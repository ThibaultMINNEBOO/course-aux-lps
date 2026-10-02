import { describe, expect, it } from 'vitest';
import { dailyHighlights, formatDailyHighlights, formatEventHighlights } from '../../src/modules/recap/recap-format';
import type { Ranked } from '../../src/modules/scoring/standings';
import type { SeasonStandingRow } from '../../src/modules/scoring/standings.service';

function row(name: string, score: number, dailyDelta: number, place: number): Ranked<SeasonStandingRow> {
  return {
    entryId: name,
    name,
    discordId: name.toLowerCase(),
    score,
    dailyDelta,
    rankLabel: 'Or II · 10 LP',
    wins: 0,
    losses: 0,
    place,
  };
}

describe('dailyHighlights', () => {
  const standings = [
    row('Alpha', 120, 30, 1),
    row('Bravo', 90, 54, 2),
    row('Charlie', 10, -40, 3),
    row('Delta', 0, 0, 4),
  ];

  it('keeps the three best positive daily progressions', () => {
    const highlights = dailyHighlights(standings);
    expect(highlights.topMovers.map((mover) => mover.name)).toEqual(['Bravo', 'Alpha']);
  });

  it('reports the biggest drop and the total daily gain', () => {
    const highlights = dailyHighlights(standings);
    expect(highlights.biggestDrop?.name).toBe('Charlie');
    expect(highlights.totalDelta).toBe(44);
    expect(highlights.activePlayers).toBe(3);
  });
});

describe('formatDailyHighlights', () => {
  it('lists the top movers with medals', () => {
    const text = formatDailyHighlights(dailyHighlights([row('Alpha', 50, 50, 1)]));
    expect(text).toContain('🥇 **Alpha** +50 LP');
    expect(text).toContain('**+50 LP**');
  });

  it('handles quiet days', () => {
    expect(formatDailyHighlights(dailyHighlights([row('Alpha', 0, 0, 1)]))).toContain('Aucune progression');
  });
});

describe('formatEventHighlights', () => {
  it('shows the podium of a side event', () => {
    const text = formatEventHighlights([
      { name: 'Alpha', discordId: 'a', score: 12, place: 1 },
      { name: 'Bravo', discordId: 'b', score: 8, place: 2 },
    ]);
    expect(text).toBe('🥇 <@a> — 12 pts\n🥈 <@b> — 8 pts');
  });

  it('handles events without points', () => {
    expect(formatEventHighlights([])).toBe('Aucun point attribué pour le moment.');
  });
});
