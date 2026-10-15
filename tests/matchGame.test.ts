import { describe, expect, test } from 'vitest';
import teague from '../data/teague.json';
import { matchGame } from '../src/core/matchGame';
import { summarize } from '../src/core/summary';
import type { TeagueData } from '../src/core/types';

const data = teague as TeagueData;

describe('matchGame', () => {
  test('played: 2021 Finals Game 6 with date in title', () => {
    const r = matchGame('Milwaukee Bucks vs. Phoenix Suns | NBA Game Highlights | July 20, 2021', null, data);
    expect(r).toMatchObject({ verdict: 'PLAYED', date: '2021-07-20', dateSource: 'title', confidence: 'high' });
    expect(r.game).toMatchObject({ team: 'MIL', gameNumber: 6, min: 2 });
  });

  test('on roster, did not play', () => {
    expect(matchGame('Lakers vs Timberwolves | Jan 1, 2018', null, data).verdict).toBe('ON_ROSTER_DNP');
  });

  test('not there: reports the team Teague was on', () => {
    const r = matchGame('Heat vs Knicks | Feb 2, 2019', null, data);
    expect(r).toMatchObject({ verdict: 'NOT_THERE', teagueTeam: 'MIN' });
  });

  test('out of career on both sides', () => {
    expect(matchGame('Lakers vs Raptors | January 22, 2006', null, data)).toMatchObject({
      verdict: 'OUT_OF_CAREER', era: 'before',
    });
    expect(matchGame('Lakers vs Celtics | December 25, 2023', null, data)).toMatchObject({
      verdict: 'OUT_OF_CAREER', era: 'after',
    });
  });

  test('not a game', () => {
    expect(matchGame('Rick Astley - Never Gonna Give You Up', null, data).verdict).toBe('NOT_A_GAME');
    expect(matchGame('Lakers top 10 plays', null, data).verdict).toBe('NOT_A_GAME');
  });

  test('no date anywhere', () => {
    expect(matchGame('Bucks vs Nets Game 7', null, data)).toMatchObject({ verdict: 'NO_DATE', teams: ['MIL', 'BKN'] });
  });

  test('upload date: late Pacific upload lands on the next Eastern day, still finds the game', () => {
    const r = matchGame('SUNS at BUCKS | FULL GAME 6 HIGHLIGHTS', '2021-07-20T21:30:00-07:00', data);
    expect(r).toMatchObject({ verdict: 'PLAYED', date: '2021-07-20', dateSource: 'upload', confidence: 'medium' });
  });

  test('upload date: two games in the window, Game N picks the right one', () => {
    // Window is Jul 8, 7, 6 -> Game 2 (Jul 8) and Game 1 (Jul 6) both match.
    const upload = '2021-07-08T10:00:00-04:00';
    expect(matchGame('Bucks vs Suns Game 1', upload, data).date).toBe('2021-07-06');
    expect(matchGame('Bucks vs Suns Game 2', upload, data).date).toBe('2021-07-08');
    // Without a game number, prefer the closest day to the upload.
    expect(matchGame('Bucks vs Suns highlights', upload, data).date).toBe('2021-07-08');
  });

  test('pre-2013 "Hornets" means New Orleans', () => {
    const r = matchGame('Hawks vs Hornets | November 14, 2009', null, data);
    expect(r).toMatchObject({ verdict: 'PLAYED', teams: ['ATL', 'NOP'] });
  });
});

describe('summarize', () => {
  test('played summary includes stat line and playoff game', () => {
    const s = summarize(matchGame('Hawks vs Wizards Game 4 | May 11, 2015', null, data));
    expect(s.headline).toBe('Jeff Teague was at this game. He played for the Atlanta Hawks.');
    expect(s.details).toContain('Playoffs, Game 4');
    expect(s.details).toContain('32 min · 26 pts · 4 reb · 8 ast');
  });

  test('upload-date results say so', () => {
    const s = summarize(matchGame('SUNS at BUCKS', '2021-07-20T21:30:00-07:00', data));
    expect(s.details.some((d) => d.includes('upload date'))).toBe(true);
  });
});
