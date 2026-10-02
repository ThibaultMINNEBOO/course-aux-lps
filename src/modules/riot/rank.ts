export interface RankedState {
  tier: string;
  rank: string;
  leaguePoints: number;
}

const DIVISIONAL_TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
const APEX_TIERS = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];
const DIVISIONS = ['IV', 'III', 'II', 'I'];
const LP_PER_DIVISION = 100;
const LP_PER_TIER = LP_PER_DIVISION * DIVISIONS.length;
const APEX_BASE_LP = DIVISIONAL_TIERS.length * LP_PER_TIER;

const TIER_LABELS: Record<string, string> = {
  IRON: 'Fer',
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
  EMERALD: 'Émeraude',
  DIAMOND: 'Diamant',
  MASTER: 'Maître',
  GRANDMASTER: 'Grand Maître',
  CHALLENGER: 'Challenger',
};

export function isApexTier(tier: string): boolean {
  return APEX_TIERS.includes(tier);
}

export function toAbsoluteLp(state: RankedState): number {
  if (isApexTier(state.tier)) {
    return APEX_BASE_LP + state.leaguePoints;
  }
  const tierIndex = DIVISIONAL_TIERS.indexOf(state.tier);
  const divisionIndex = DIVISIONS.indexOf(state.rank);
  if (tierIndex < 0 || divisionIndex < 0) {
    throw new Error(`Unknown rank ${state.tier} ${state.rank}`);
  }
  return tierIndex * LP_PER_TIER + divisionIndex * LP_PER_DIVISION + state.leaguePoints;
}

export function formatRank(state: RankedState | null): string {
  if (!state) {
    return 'Non classé';
  }
  const tier = TIER_LABELS[state.tier] ?? state.tier;
  const label = isApexTier(state.tier) ? tier : `${tier} ${state.rank}`;
  return `${label} · ${state.leaguePoints} LP`;
}
