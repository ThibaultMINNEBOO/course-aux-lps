import { describe, expect, it } from 'vitest';
import {
  applyRankedSnapshot,
  carryOver,
  type EntryProgress,
  entryGames,
  entryScore,
} from '../../src/modules/competition/entry-progress';

const fresh: EntryProgress = {
  baselineLp: null,
  baselineWins: 0,
  baselineLosses: 0,
  currentLp: null,
  wins: 0,
  losses: 0,
  carriedLp: 0,
  carriedWins: 0,
  carriedLosses: 0,
};

const gold2 = { tier: 'GOLD', rank: 'II', leaguePoints: 45, wins: 20, losses: 18 };
const gold1 = { tier: 'GOLD', rank: 'I', leaguePoints: 10, wins: 23, losses: 19 };

describe('applyRankedSnapshot', () => {
  it('sets the baseline on the first ranked observation', () => {
    const update = applyRankedSnapshot(fresh, gold2);
    expect(update).toMatchObject({
      baselineLp: 1445,
      baselineWins: 20,
      baselineLosses: 18,
      currentLp: 1445,
      currentTier: 'GOLD',
      currentDivision: 'II',
      currentLeaguePoints: 45,
      wins: 20,
      losses: 18,
    });
  });

  it('keeps the existing baseline on later observations', () => {
    const progress = { ...fresh, ...applyRankedSnapshot(fresh, gold2) };
    const update = applyRankedSnapshot(progress, gold1);
    expect(update.baselineLp).toBe(1445);
    expect(update.baselineWins).toBe(20);
    expect(update.currentLp).toBe(1510);
  });

  it('leaves the entry untouched when the player is unranked', () => {
    expect(applyRankedSnapshot(fresh, null)).toEqual({});
  });
});

describe('entryScore', () => {
  it('is zero before any ranked observation', () => {
    expect(entryScore(fresh, 0)).toBe(0);
  });

  it('sums carried LP, net ladder progress and manual adjustments', () => {
    const progress = { ...fresh, ...applyRankedSnapshot(fresh, gold2), carriedLp: 30 };
    const updated = { ...progress, ...applyRankedSnapshot(progress, gold1) };
    expect(entryScore(updated, -15)).toBe(30 + 65 - 15);
  });
});

describe('entryGames', () => {
  it('counts games played since the baseline plus carried games', () => {
    const progress = { ...fresh, ...applyRankedSnapshot(fresh, gold2), carriedWins: 2, carriedLosses: 1 };
    const updated = { ...progress, ...applyRankedSnapshot(progress, gold1) };
    expect(entryGames(updated)).toEqual({ wins: 5, losses: 2 });
  });
});

describe('carryOver', () => {
  it('banks the progress of the previous account and resets the ladder state', () => {
    const progress = { ...fresh, ...applyRankedSnapshot(fresh, gold2) };
    const updated = { ...progress, ...applyRankedSnapshot(progress, gold1) };
    const switched = { ...updated, ...carryOver(updated) };

    expect(switched).toMatchObject({
      carriedLp: 65,
      carriedWins: 3,
      carriedLosses: 1,
      baselineLp: null,
      currentLp: null,
      wins: 0,
      losses: 0,
    });
    expect(entryScore(switched, 0)).toBe(65);
  });

  it('resumes progress from the new account rank', () => {
    const progress = { ...fresh, ...applyRankedSnapshot(fresh, gold2) };
    const updated = { ...progress, ...applyRankedSnapshot(progress, gold1) };
    const switched = { ...updated, ...carryOver(updated) };
    const plat = { tier: 'PLATINUM', rank: 'IV', leaguePoints: 0, wins: 50, losses: 40 };
    const onNewAccount = { ...switched, ...applyRankedSnapshot(switched, plat) };
    const afterWin = { ...onNewAccount, ...applyRankedSnapshot(onNewAccount, { ...plat, leaguePoints: 22, wins: 51 }) };

    expect(entryScore(afterWin, 0)).toBe(65 + 22);
    expect(entryGames(afterWin)).toEqual({ wins: 4, losses: 1 });
  });
});
