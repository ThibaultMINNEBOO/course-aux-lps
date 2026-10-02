import { placeLabel, signed } from '../../shared/format';
import type { Ranked } from '../scoring/standings';
import type { SeasonStandingRow, SideEventStandingRow } from '../scoring/standings.service';

export const EMPTY_STANDINGS = 'Aucun participant pour le moment.';

export function formatSeasonRow(row: Ranked<SeasonStandingRow>, showDailyDelta: boolean): string {
  const today = showDailyDelta && row.dailyDelta !== 0 ? ` (${signed(row.dailyDelta)} aujourd'hui)` : '';
  return [
    `${placeLabel(row.place)} **${row.name}** · <@${row.discordId}>`,
    `┗ **${signed(row.score)} LP**${today} · ${row.rankLabel} · ${row.wins}V/${row.losses}D`,
  ].join('\n');
}

export function formatSideEventRow(row: Ranked<SideEventStandingRow>): string {
  return `${placeLabel(row.place)} **${row.name}** · <@${row.discordId}> — **${signed(row.score)} pts**`;
}

export function formatRows<T>(rows: ReadonlyArray<T>, format: (row: T) => string): string {
  return rows.length > 0 ? rows.map(format).join('\n') : EMPTY_STANDINGS;
}
