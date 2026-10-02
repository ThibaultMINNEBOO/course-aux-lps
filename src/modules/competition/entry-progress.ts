import { type RankedState, toAbsoluteLp } from '../riot/rank';

export interface EntryProgress {
  baselineLp: number | null;
  baselineWins: number;
  baselineLosses: number;
  currentLp: number | null;
  wins: number;
  losses: number;
  carriedLp: number;
  carriedWins: number;
  carriedLosses: number;
}

export interface RankedSnapshot extends RankedState {
  wins: number;
  losses: number;
}

export interface LadderUpdate {
  baselineLp?: number | null;
  baselineWins?: number;
  baselineLosses?: number;
  currentLp?: number | null;
  currentTier?: string | null;
  currentDivision?: string | null;
  currentLeaguePoints?: number | null;
  wins?: number;
  losses?: number;
}

export interface CarryOverUpdate extends LadderUpdate {
  carriedLp: number;
  carriedWins: number;
  carriedLosses: number;
}

export function applyRankedSnapshot(progress: EntryProgress, snapshot: RankedSnapshot | null): LadderUpdate {
  if (!snapshot) {
    return {};
  }
  const absoluteLp = toAbsoluteLp(snapshot);
  const firstObservation = progress.baselineLp === null;
  return {
    baselineLp: firstObservation ? absoluteLp : progress.baselineLp,
    baselineWins: firstObservation ? snapshot.wins : progress.baselineWins,
    baselineLosses: firstObservation ? snapshot.losses : progress.baselineLosses,
    currentLp: absoluteLp,
    currentTier: snapshot.tier,
    currentDivision: snapshot.rank,
    currentLeaguePoints: snapshot.leaguePoints,
    wins: snapshot.wins,
    losses: snapshot.losses,
  };
}

export function carryOver(progress: EntryProgress): CarryOverUpdate {
  const games = ladderGames(progress);
  return {
    carriedLp: progress.carriedLp + ladderGain(progress),
    carriedWins: progress.carriedWins + games.wins,
    carriedLosses: progress.carriedLosses + games.losses,
    baselineLp: null,
    baselineWins: 0,
    baselineLosses: 0,
    currentLp: null,
    currentTier: null,
    currentDivision: null,
    currentLeaguePoints: null,
    wins: 0,
    losses: 0,
  };
}

export function entryScore(progress: EntryProgress, adjustmentTotal: number): number {
  return progress.carriedLp + ladderGain(progress) + adjustmentTotal;
}

export function entryGames(progress: EntryProgress): { wins: number; losses: number } {
  const games = ladderGames(progress);
  return {
    wins: progress.carriedWins + games.wins,
    losses: progress.carriedLosses + games.losses,
  };
}

function ladderGain(progress: EntryProgress): number {
  if (progress.baselineLp === null || progress.currentLp === null) {
    return 0;
  }
  return progress.currentLp - progress.baselineLp;
}

function ladderGames(progress: EntryProgress): { wins: number; losses: number } {
  if (progress.baselineLp === null) {
    return { wins: 0, losses: 0 };
  }
  return {
    wins: Math.max(0, progress.wins - progress.baselineWins),
    losses: Math.max(0, progress.losses - progress.baselineLosses),
  };
}
