import type { BoardOpening, BoardPageLink, BoardTarget } from './components/board-page.button';

export function boardPageLinks(
  target: BoardTarget,
  page: number,
  totalPages: number,
  opening: BoardOpening,
): Array<BoardPageLink> {
  const link = (slot: number, destination: number, label: string, emoji?: string): BoardPageLink => ({
    target,
    page: destination,
    opening,
    slot,
    label,
    emoji,
    disabled: opening === 'update' && destination === page,
  });
  return [
    link(0, 1, 'Début', '⏮️'),
    link(1, Math.max(1, page - 1), 'Préc.', '◀️'),
    { ...link(2, page, `${page}/${totalPages}`), disabled: opening === 'update' },
    link(3, Math.min(totalPages, page + 1), 'Suiv.', '▶️'),
    link(4, totalPages, 'Fin', '⏭️'),
  ];
}
