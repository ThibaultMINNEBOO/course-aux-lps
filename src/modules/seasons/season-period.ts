import { DateTime } from 'luxon';
import type { SeasonFrequency } from '../../generated/prisma/client';

export const COMPETITION_ZONE = 'Europe/Paris';
export const RECAP_HOUR = 21;

export interface SeasonWindow {
  startsAt: Date;
  endsAt: Date;
}

export interface SeasonProgress {
  day: number;
  totalDays: number;
}

function local(date: Date): DateTime {
  return DateTime.fromJSDate(date, { zone: COMPETITION_ZONE });
}

function atRecapHour(date: DateTime): DateTime {
  return date.set({ hour: RECAP_HOUR, minute: 0, second: 0, millisecond: 0 });
}

export function recapAt(date: Date): Date {
  return atRecapHour(local(date)).toJSDate();
}

export function firstRecapAfter(start: Date): Date {
  const sameEvening = atRecapHour(local(start));
  return (sameEvening.toMillis() > start.getTime() ? sameEvening : sameEvening.plus({ days: 1 })).toJSDate();
}

export function computeSeasonEnd(start: Date, frequency: SeasonFrequency, customEnd?: Date): Date {
  const startDay = local(start);
  switch (frequency) {
    case 'WEEKLY':
      return atRecapHour(startDay.plus({ weeks: 1 })).toJSDate();
    case 'MONTHLY':
      return atRecapHour(startDay.plus({ months: 1 })).toJSDate();
    case 'CUSTOM':
      if (!customEnd) {
        throw new Error('A custom season requires an end date');
      }
      return recapAt(customEnd);
  }
}

export function seasonProgress(season: SeasonWindow, now: Date): SeasonProgress {
  const firstRecap = local(firstRecapAfter(season.startsAt)).startOf('day');
  const lastRecap = local(season.endsAt).startOf('day');
  const today = local(now).startOf('day');
  const totalDays = Math.max(1, Math.round(lastRecap.diff(firstRecap, 'days').days) + 1);
  const day = Math.round(today.diff(firstRecap, 'days').days) + 1;
  return { day: Math.min(Math.max(day, 1), totalDays), totalDays };
}

export function parseLocalDate(input: string): Date | null {
  const parsed = DateTime.fromFormat(input.trim(), 'dd/MM/yyyy', { zone: COMPETITION_ZONE });
  return parsed.isValid ? parsed.toJSDate() : null;
}

export function seasonLengthInDays(season: SeasonWindow): number {
  return Math.max(
    1,
    Math.round(local(season.endsAt).startOf('day').diff(local(season.startsAt).startOf('day'), 'days').days),
  );
}

export function addDays(date: Date, days: number): Date {
  return local(date).plus({ days }).toJSDate();
}
