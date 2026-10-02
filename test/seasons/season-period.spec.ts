import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  computeSeasonEnd,
  firstRecapAfter,
  parseLocalDate,
  recapAt,
  seasonProgress,
} from '../../src/modules/seasons/season-period';

const ZONE = 'Europe/Paris';

function paris(iso: string): Date {
  return DateTime.fromISO(iso, { zone: ZONE }).toJSDate();
}

function toParis(date: Date): string {
  return DateTime.fromJSDate(date, { zone: ZONE }).toFormat("yyyy-MM-dd'T'HH:mm");
}

describe('recapAt', () => {
  it('returns 21:00 Paris time on the given local day', () => {
    expect(toParis(recapAt(paris('2026-10-02T09:15')))).toBe('2026-10-02T21:00');
  });
});

describe('firstRecapAfter', () => {
  it('uses the same evening when started before 21:00', () => {
    expect(toParis(firstRecapAfter(paris('2026-10-05T18:00')))).toBe('2026-10-05T21:00');
  });

  it('uses the next evening when started exactly at 21:00', () => {
    expect(toParis(firstRecapAfter(paris('2026-10-05T21:00')))).toBe('2026-10-06T21:00');
  });

  it('uses the next evening when started after 21:00', () => {
    expect(toParis(firstRecapAfter(paris('2026-10-05T21:30')))).toBe('2026-10-06T21:00');
  });
});

describe('computeSeasonEnd', () => {
  it('ends a weekly season seven days later at 21:00', () => {
    expect(toParis(computeSeasonEnd(paris('2026-10-05T18:00'), 'WEEKLY'))).toBe('2026-10-12T21:00');
  });

  it('ends a monthly season one month later at 21:00', () => {
    expect(toParis(computeSeasonEnd(paris('2026-01-31T12:00'), 'MONTHLY'))).toBe('2026-02-28T21:00');
  });

  it('keeps 21:00 local time across a DST change', () => {
    const end = computeSeasonEnd(paris('2026-10-20T10:00'), 'WEEKLY');
    expect(toParis(end)).toBe('2026-10-27T21:00');
    expect(end.toISOString()).toBe('2026-10-27T20:00:00.000Z');
  });

  it('ends a custom season on the requested day at 21:00', () => {
    expect(toParis(computeSeasonEnd(paris('2026-10-05T18:00'), 'CUSTOM', paris('2026-10-20T00:00')))).toBe(
      '2026-10-20T21:00',
    );
  });

  it('requires an end date for custom seasons', () => {
    expect(() => computeSeasonEnd(paris('2026-10-05T18:00'), 'CUSTOM')).toThrow();
  });
});

describe('seasonProgress', () => {
  const season = { startsAt: paris('2026-10-05T18:00'), endsAt: paris('2026-10-12T21:00') };

  it('counts the first evening as day one', () => {
    expect(seasonProgress(season, paris('2026-10-05T21:00'))).toEqual({ day: 1, totalDays: 8 });
  });

  it('counts the closing evening as the last day', () => {
    expect(seasonProgress(season, paris('2026-10-12T21:00'))).toEqual({ day: 8, totalDays: 8 });
  });

  it('gives a renewed weekly season seven recaps', () => {
    const renewed = { startsAt: paris('2026-10-12T21:00'), endsAt: paris('2026-10-19T21:00') };
    expect(seasonProgress(renewed, paris('2026-10-13T21:00'))).toEqual({ day: 1, totalDays: 7 });
    expect(seasonProgress(renewed, paris('2026-10-19T21:00'))).toEqual({ day: 7, totalDays: 7 });
  });
});

describe('parseLocalDate', () => {
  it('parses a French formatted date in Paris time', () => {
    const date = parseLocalDate('20/10/2026');
    expect(date && toParis(date)).toBe('2026-10-20T00:00');
  });

  it('rejects malformed dates', () => {
    expect(parseLocalDate('2026-10-20')).toBeNull();
    expect(parseLocalDate('31/02/2026')).toBeNull();
  });
});
