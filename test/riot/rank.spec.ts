import { describe, expect, it } from 'vitest';
import { formatRank, toAbsoluteLp } from '../../src/modules/riot/rank';

describe('toAbsoluteLp', () => {
  it('starts at zero for Iron IV 0 LP', () => {
    expect(toAbsoluteLp({ tier: 'IRON', rank: 'IV', leaguePoints: 0 })).toBe(0);
  });

  it('adds 100 per division and 400 per tier', () => {
    expect(toAbsoluteLp({ tier: 'GOLD', rank: 'II', leaguePoints: 45 })).toBe(3 * 400 + 2 * 100 + 45);
  });

  it('counts a promotion as a net gain', () => {
    const before = toAbsoluteLp({ tier: 'GOLD', rank: 'I', leaguePoints: 90 });
    const after = toAbsoluteLp({ tier: 'PLATINUM', rank: 'IV', leaguePoints: 10 });
    expect(after - before).toBe(20);
  });

  it('counts a demotion as a net loss', () => {
    const before = toAbsoluteLp({ tier: 'EMERALD', rank: 'IV', leaguePoints: 5 });
    const after = toAbsoluteLp({ tier: 'PLATINUM', rank: 'I', leaguePoints: 75 });
    expect(after - before).toBe(-30);
  });

  it('places Master right after Diamond I 100 LP', () => {
    expect(toAbsoluteLp({ tier: 'DIAMOND', rank: 'I', leaguePoints: 100 })).toBe(2800);
    expect(toAbsoluteLp({ tier: 'MASTER', rank: 'I', leaguePoints: 0 })).toBe(2800);
  });

  it('shares a single LP ladder across apex tiers', () => {
    expect(toAbsoluteLp({ tier: 'GRANDMASTER', rank: 'I', leaguePoints: 350 })).toBe(3150);
    expect(toAbsoluteLp({ tier: 'CHALLENGER', rank: 'I', leaguePoints: 900 })).toBe(3700);
  });
});

describe('formatRank', () => {
  it('formats a divisional tier in French', () => {
    expect(formatRank({ tier: 'GOLD', rank: 'II', leaguePoints: 45 })).toBe('Or II · 45 LP');
  });

  it('omits the division for apex tiers', () => {
    expect(formatRank({ tier: 'GRANDMASTER', rank: 'I', leaguePoints: 412 })).toBe('Grand Maître · 412 LP');
  });

  it('reports unranked players', () => {
    expect(formatRank(null)).toBe('Non classé');
  });
});
