import { placeLabel, signed } from '../../shared/format';
import type { Ranked } from '../scoring/standings';
import type { SeasonStandingRow, SideEventStandingRow } from '../scoring/standings.service';

const TOP_MOVERS = 3;
const EVENT_PODIUM = 3;

export interface DailyHighlights {
  topMovers: Array<SeasonStandingRow>;
  biggestDrop: SeasonStandingRow | null;
  totalDelta: number;
  activePlayers: number;
}

export function dailyHighlights(standings: ReadonlyArray<SeasonStandingRow>): DailyHighlights {
  const movers = standings.filter((row) => row.dailyDelta !== 0);
  const byDelta = [...movers].sort((a, b) => b.dailyDelta - a.dailyDelta);
  const lowest = byDelta.at(-1);
  return {
    topMovers: byDelta.filter((row) => row.dailyDelta > 0).slice(0, TOP_MOVERS),
    biggestDrop: lowest && lowest.dailyDelta < 0 ? lowest : null,
    totalDelta: movers.reduce((total, row) => total + row.dailyDelta, 0),
    activePlayers: movers.length,
  };
}

export function formatDailyHighlights(highlights: DailyHighlights): string {
  if (highlights.activePlayers === 0) {
    return "Aucune progression aujourd'hui.";
  }
  const lines = highlights.topMovers.map(
    (row, index) => `${placeLabel(index + 1)} **${row.name}** ${signed(row.dailyDelta)} LP`,
  );
  if (highlights.biggestDrop) {
    lines.push(`📉 **${highlights.biggestDrop.name}** ${signed(highlights.biggestDrop.dailyDelta)} LP`);
  }
  lines.push(
    `Bilan du jour : **${signed(highlights.totalDelta)} LP** pour ${highlights.activePlayers} joueur(s) actif(s)`,
  );
  return lines.join('\n');
}

export function formatEventHighlights(standings: ReadonlyArray<Ranked<SideEventStandingRow>>): string {
  if (standings.length === 0) {
    return 'Aucun point attribué pour le moment.';
  }
  return standings
    .slice(0, EVENT_PODIUM)
    .map((row) => `${placeLabel(row.place)} <@${row.discordId}> — ${row.score} pts`)
    .join('\n');
}
