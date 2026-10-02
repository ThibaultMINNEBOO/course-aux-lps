import { describe, expect, it } from 'vitest';
import { paginate, rankStandings } from '../../src/modules/scoring/standings';

describe('rankStandings', () => {
  it('orders rows by score descending', () => {
    const ranked = rankStandings([
      { name: 'Bravo', score: 10 },
      { name: 'Alpha', score: 40 },
      { name: 'Charlie', score: -5 },
    ]);
    expect(ranked.map((row) => [row.place, row.name])).toEqual([
      [1, 'Alpha'],
      [2, 'Bravo'],
      [3, 'Charlie'],
    ]);
  });

  it('shares a place between tied rows and skips the next one', () => {
    const ranked = rankStandings([
      { name: 'Delta', score: 20 },
      { name: 'Bravo', score: 20 },
      { name: 'Alpha', score: 30 },
      { name: 'Echo', score: 5 },
    ]);
    expect(ranked.map((row) => [row.place, row.name])).toEqual([
      [1, 'Alpha'],
      [2, 'Bravo'],
      [2, 'Delta'],
      [4, 'Echo'],
    ]);
  });

  it('keeps the original row data', () => {
    const [first] = rankStandings([{ name: 'Alpha', score: 1, discordId: '42' }]);
    expect(first.discordId).toBe('42');
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);

  it('returns the requested page', () => {
    expect(paginate(items, 2, 10)).toEqual({ items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], page: 2, totalPages: 3 });
  });

  it('clamps out of range pages', () => {
    expect(paginate(items, 9, 10).page).toBe(3);
    expect(paginate(items, 0, 10).page).toBe(1);
  });

  it('always exposes at least one page', () => {
    expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});
