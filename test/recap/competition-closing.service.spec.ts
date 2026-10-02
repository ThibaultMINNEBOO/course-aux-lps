import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Season } from '../../src/generated/prisma/client';
import type { LeaderboardService } from '../../src/modules/leaderboard/leaderboard.service';
import { CompetitionClosingService } from '../../src/modules/recap/competition-closing.service';
import type { RecapChannel } from '../../src/modules/recap/recap-channel';
import type { StandingsService } from '../../src/modules/scoring/standings.service';
import type { SeasonService } from '../../src/modules/seasons/season.service';
import type { SideEventService } from '../../src/modules/side-events/side-event.service';
import type { LpSyncService } from '../../src/modules/sync/lp-sync.service';

const NOW = new Date('2026-10-12T19:00:00Z');

function makeSeason(overrides: Partial<Season> = {}): Season {
  return {
    id: 'season-1',
    number: 1,
    frequency: 'WEEKLY',
    startsAt: new Date('2026-10-05T19:00:00Z'),
    endsAt: NOW,
    status: 'ACTIVE',
    autoRenew: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('CompetitionClosingService', () => {
  let seasons: Record<'findActive' | 'close' | 'closeNow' | 'renew', ReturnType<typeof vi.fn>>;
  let sideEvents: Record<'findDue' | 'close', ReturnType<typeof vi.fn>>;
  let standings: Record<'forSeason' | 'forSideEvent', ReturnType<typeof vi.fn>>;
  let send: ReturnType<typeof vi.fn>;
  let syncActiveSeason: ReturnType<typeof vi.fn>;
  let service: CompetitionClosingService;

  beforeEach(() => {
    seasons = {
      findActive: vi.fn().mockResolvedValue(null),
      close: vi.fn().mockImplementation((season: Season) => Promise.resolve({ ...season, status: 'ENDED' })),
      closeNow: vi.fn().mockImplementation((season: Season) => Promise.resolve({ ...season, status: 'ENDED' })),
      renew: vi.fn().mockResolvedValue({ season: makeSeason({ id: 'season-2', number: 2 }), enrolled: 4 }),
    };
    sideEvents = {
      findDue: vi.fn().mockResolvedValue([]),
      close: vi.fn().mockImplementation((event) => Promise.resolve({ ...event, status: 'ENDED' })),
    };
    standings = {
      forSeason: vi.fn().mockResolvedValue([{ discordId: 'winner', place: 1 }]),
      forSideEvent: vi.fn().mockResolvedValue([]),
    };
    send = vi.fn().mockResolvedValue(undefined);
    syncActiveSeason = vi.fn().mockResolvedValue({ synced: 0, failed: 0 });
    const board = { embeds: [], components: [] };
    service = new CompetitionClosingService(
      seasons as unknown as SeasonService,
      sideEvents as unknown as SideEventService,
      standings as unknown as StandingsService,
      {
        seasonBoard: vi.fn().mockResolvedValue(board),
        sideEventBoard: vi.fn().mockResolvedValue(board),
      } as unknown as LeaderboardService,
      { syncActiveSeason } as unknown as LpSyncService,
      { send } as unknown as RecapChannel,
    );
  });

  it('closes and renews a season that reached its end', async () => {
    seasons.findActive.mockResolvedValue(makeSeason());

    await service.closeDue(NOW);

    expect(syncActiveSeason).toHaveBeenCalled();
    expect(seasons.close).toHaveBeenCalled();
    expect(seasons.renew).toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].content).toContain('<@winner>');
  });

  it('leaves a running season untouched before its end', async () => {
    seasons.findActive.mockResolvedValue(makeSeason({ endsAt: new Date(NOW.getTime() + 86_400_000) }));

    await service.closeDue(NOW);

    expect(seasons.close).not.toHaveBeenCalled();
  });

  it('does not renew when auto renewal is disabled', async () => {
    await service.closeSeason(makeSeason({ autoRenew: false }), 'scheduled');

    expect(seasons.renew).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('ends a season immediately without renewal when closed manually', async () => {
    const next = await service.closeSeason(makeSeason(), 'manual');

    expect(next).toBeNull();
    expect(seasons.closeNow).toHaveBeenCalled();
    expect(seasons.renew).not.toHaveBeenCalled();
  });

  it('closes side events that reached their end', async () => {
    sideEvents.findDue.mockResolvedValue([{ id: 'event-1', name: 'Tournoi', status: 'ACTIVE' }]);
    standings.forSideEvent.mockResolvedValue([{ discordId: 'champ', place: 1 }]);

    await service.closeDue(NOW);

    expect(sideEvents.close).toHaveBeenCalled();
    expect(send.mock.calls[0][0].content).toContain('<@champ>');
  });
});
