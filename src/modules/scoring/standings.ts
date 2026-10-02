export interface Rankable {
  name: string;
  score: number;
}

export type Ranked<T extends Rankable> = T & { place: number };

export interface Page<T> {
  items: Array<T>;
  page: number;
  totalPages: number;
}

export const STANDINGS_PAGE_SIZE = 10;

export function rankStandings<T extends Rankable>(rows: ReadonlyArray<T>): Array<Ranked<T>> {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr'));
  let place = 0;
  return sorted.map((row, index) => {
    if (index === 0 || row.score !== sorted[index - 1].score) {
      place = index + 1;
    }
    return { ...row, place };
  });
}

export function paginate<T>(items: ReadonlyArray<T>, page: number, pageSize = STANDINGS_PAGE_SIZE): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(page, 1), totalPages);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: current, totalPages };
}
