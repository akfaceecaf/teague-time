import { describe, expect, test } from 'vitest';
import { parseTitle } from '../src/core/parseTitle';
import { parseTitleDate, toEasternDate, uploadCandidates } from '../src/core/dates';
import { resolveToken } from '../src/core/teams';

describe('parseTitle teams', () => {
  test.each([
    ['Milwaukee Bucks vs. Phoenix Suns | NBA Game Highlights', ['MIL', 'PHX']],
    ['SUNS at BUCKS | FULL GAME 6 HIGHLIGHTS', ['PHX', 'MIL']],
    ['New York Knicks vs Boston Celtics', ['NYK', 'BOS']], // "new york" must not double-count
    ['Lakers vs Clippers', ['LAL', 'LAC']],
    ["Bucks' comeback vs the Nets", ['MIL', 'BKN']],
    ['LAL vs MIN - Full Game Highlights', ['LAL', 'MIN']],
    ['Trail Blazers vs Bucks', ['POR', 'MIL']],
    ['Hawks vs Hornets', ['ATL', 'HORNETS']],
    ['New Orleans Hornets vs Hawks', ['NOP', 'ATL']],
    ['Hawks vs Bobcats', ['ATL', 'CHA']],
  ])('%s', (title, teams) => {
    expect(parseTitle(title).teams).toEqual(teams);
  });

  test('ignores lowercase abbreviation look-alikes', () => {
    expect(parseTitle('this was the min requirement').teams).toEqual([]);
  });

  test('ignores abbreviation-like words in ALL-CAPS titles', () => {
    // "WAS" and "MIN" are words here, not Washington / Minnesota.
    expect(parseTitle('BUCKS VS SUNS: TEAGUE WAS 2 MIN AWAY').teams).toEqual(['MIL', 'PHX']);
  });

  test('"los angeles" alone is not a team', () => {
    expect(parseTitle('Los Angeles vs Boston').teams).toEqual(['BOS']);
  });

  test('reads Game N', () => {
    expect(parseTitle('Bucks vs Suns Game 6').gameNumber).toBe(6);
    expect(parseTitle('Bucks vs Suns Game Highlights').gameNumber).toBeNull();
  });
});

describe('dates', () => {
  test.each([
    ['July 20, 2021', '2021-07-20'],
    ['Jul. 20th 2021', '2021-07-20'],
    ['20 July 2021', '2021-07-20'],
    ['7/20/21', '2021-07-20'],
    ['07.20.2021', '2021-07-20'],
    ['2021-07-20', '2021-07-20'],
    ['Sept 5, 2019', '2019-09-05'],
  ])('%s', (text, iso) => {
    expect(parseTitleDate(`Bucks vs Suns | ${text}`)).toBe(iso);
  });

  test('no date / invalid date', () => {
    expect(parseTitleDate('2020-21 season recap')).toBeNull();
    expect(parseTitleDate('Game on 2/30/2021')).toBeNull();
  });

  test('upload date converts to US Eastern', () => {
    // 9:30pm Pacific is already the next day in Eastern.
    expect(toEasternDate('2021-07-20T21:30:00-07:00')).toBe('2021-07-21');
    expect(toEasternDate('2021-07-20')).toBe('2021-07-20');
  });

  test('upload candidates: day 0, -1, -2 across month boundary', () => {
    expect(uploadCandidates('2021-07-01')).toEqual(['2021-07-01', '2021-06-30', '2021-06-29']);
  });

  test('bare "Hornets" depends on the era', () => {
    expect(resolveToken('HORNETS', '2010-01-01')).toBe('NOP');
    expect(resolveToken('HORNETS', '2019-01-01')).toBe('CHA');
  });
});
