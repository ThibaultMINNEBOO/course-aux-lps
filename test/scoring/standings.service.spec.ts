import { describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../../src/modules/database/database.service';
import { StandingsService } from '../../src/modules/scoring/standings.service';

function seasonEntry(overrides: Record<string, unknown>) {
  return {
    baselineLp: 1400,
    baselineWins: 10,
    baselineLosses: 10,
    currentLp: 1400,
    currentTier: 'GOLD',
    currentDivision: 'II',
    currentLeaguePoints: 0,
    wins: 10,
    losses: 10,
    carriedLp: 0,
    carriedWins: 0,
    carriedLosses: 0,
    adjustments: [],
    snapshots: [],
    ...overrides,
  };
}

describe('StandingsService', () => {
  it('ranks season entries with ladder progress, bonuses and daily delta', async () => {
    const findMany = vi.fn().mockResolvedValue([
      seasonEntry({
        player: { gameName: 'Alpha', discordId: 'a' },
        currentLp: 1460,
        currentLeaguePoints: 60,
        wins: 13,
        losses: 11,
        snapshots: [{ score: 40 }],
      }),
      seasonEntry({
        player: { gameName: 'Bravo', discordId: 'b' },
        adjustments: [{ amount: 100 }, { amount: -20 }],
      }),
      seasonEntry({
        player: { gameName: 'Charlie', discordId: 'c' },
        baselineLp: null,
        currentLp: null,
        currentTier: null,
        currentDivision: null,
        currentLeaguePoints: null,
      }),
    ]);
    const service = new StandingsService({ seasonEntry: { findMany } } as unknown as DatabaseService);

    const standings = await service.forSeason('season-1');

    expect(standings).toEqual([
      expect.objectContaining({ place: 1, discordId: 'b', score: 80, dailyDelta: 80 }),
      expect.objectContaining({
        place: 2,
        discordId: 'a',
        score: 60,
        dailyDelta: 20,
        rankLabel: 'Or II · 60 LP',
        wins: 3,
        losses: 1,
      }),
      expect.objectContaining({ place: 3, discordId: 'c', score: 0, rankLabel: 'Non classé' }),
    ]);
  });

  it('ranks side event entries by their total points', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { player: { gameName: 'Alpha', discordId: 'a' }, adjustments: [{ amount: 5 }] },
      { player: { gameName: 'Bravo', discordId: 'b' }, adjustments: [{ amount: 3 }, { amount: 4 }] },
    ]);
    const service = new StandingsService({ sideEventEntry: { findMany } } as unknown as DatabaseService);

    const standings = await service.forSideEvent('event-1');

    expect(standings.map((row) => [row.place, row.discordId, row.score])).toEqual([
      [1, 'b', 7],
      [2, 'a', 5],
    ]);
  });
});
