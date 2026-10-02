import { describe, expect, it } from 'vitest';
import { formatRiotId, parseRiotId } from '../../src/modules/riot/riot-id';

describe('parseRiotId', () => {
  it('splits game name and tag line', () => {
    expect(parseRiotId('Faker#KR1')).toEqual({ gameName: 'Faker', tagLine: 'KR1' });
  });

  it('keeps spaces inside the game name and trims the input', () => {
    expect(parseRiotId('  Le Roi Lion #EUW ')).toEqual({ gameName: 'Le Roi Lion', tagLine: 'EUW' });
  });

  it('rejects a doubled separator', () => {
    expect(parseRiotId('Player##1234')).toBeNull();
  });

  it('rejects missing tag', () => {
    expect(parseRiotId('Faker')).toBeNull();
    expect(parseRiotId('Faker#')).toBeNull();
  });

  it('rejects out of range lengths', () => {
    expect(parseRiotId('ab#EUW')).toBeNull();
    expect(parseRiotId('Faker#AB')).toBeNull();
    expect(parseRiotId('Faker#ABCDEF')).toBeNull();
    expect(parseRiotId('ThisNameIsWayTooLong#EUW')).toBeNull();
  });
});

describe('formatRiotId', () => {
  it('joins game name and tag line', () => {
    expect(formatRiotId({ gameName: 'Faker', tagLine: 'KR1' })).toBe('Faker#KR1');
  });
});
