const MEDALS = ['🥇', '🥈', '🥉'];
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Paris',
});

export function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function placeLabel(rank: number): string {
  return MEDALS[rank - 1] ?? `\`#${rank}\``;
}

export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}
