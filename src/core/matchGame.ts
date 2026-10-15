import { parseTitle } from './parseTitle';
import { uploadCandidates } from './dates';
import { resolveToken, type TeamId } from './teams';
import type { TeagueData, TeagueGame } from './types';

export type Verdict =
  | 'PLAYED' //         on a roster in this game and logged minutes
  | 'ON_ROSTER_DNP' //  on a roster but didn't play
  | 'NOT_THERE' //      valid matchup + date, Teague's team wasn't in it
  | 'OUT_OF_CAREER' //  before his rookie year or after he retired
  | 'NOT_A_GAME' //     couldn't find exactly two teams
  | 'NO_DATE'; //       two teams but no date in the title and no upload date

export interface Result {
  verdict: Verdict;
  teams?: [TeamId, TeamId];
  date?: string;
  dateSource?: 'title' | 'upload';
  confidence?: 'high' | 'medium';
  game?: TeagueGame;
  /** OUT_OF_CAREER: which side of his career the date falls on. */
  era?: 'before' | 'after';
  /** NOT_THERE: the team Teague was on that day, if any. */
  teagueTeam?: TeamId;
}

export function matchGame(title: string, uploadDate: string | null, data: TeagueData): Result {
  // Step 1: is this a game? Exactly two distinct teams.
  const parsed = parseTitle(title);
  if (parsed.teams.length !== 2) return { verdict: 'NOT_A_GAME' };

  // Step 2: which date(s)? Title date beats upload date.
  const fromTitle = parsed.date !== null;
  const candidates = fromTitle ? [parsed.date!] : uploadDate ? uploadCandidates(uploadDate) : [];
  if (candidates.length === 0) {
    return { verdict: 'NO_DATE', teams: resolveTeams(parsed.teams, '9999-12-31') };
  }
  const base = {
    teams: resolveTeams(parsed.teams, candidates[0]),
    dateSource: fromTitle ? 'title' : 'upload',
    confidence: fromTitle ? 'high' : 'medium',
  } as const;

  // Step 3: check Teague's data.
  if (candidates.every((d) => d < data.careerStart)) {
    return { ...base, verdict: 'OUT_OF_CAREER', era: 'before', date: candidates[0] };
  }
  if (candidates.every((d) => d > data.careerEnd)) {
    return { ...base, verdict: 'OUT_OF_CAREER', era: 'after', date: candidates[0] };
  }

  const [a, b] = base.teams;
  let matches = data.games
    .filter((g) => candidates.includes(g.date))
    .filter((g) => (g.team === a && g.opp === b) || (g.team === b && g.opp === a));
  if (matches.length > 1 && parsed.gameNumber !== null) {
    const byNumber = matches.filter((g) => g.gameNumber === parsed.gameNumber);
    if (byNumber.length > 0) matches = byNumber;
  }
  // Prefer the candidate closest to the upload date (day 0, then -1, then -2).
  matches.sort((x, y) => candidates.indexOf(x.date) - candidates.indexOf(y.date));

  const game = matches[0];
  if (game) {
    return { ...base, verdict: game.played ? 'PLAYED' : 'ON_ROSTER_DNP', date: game.date, game };
  }
  return { ...base, verdict: 'NOT_THERE', date: candidates[0], teagueTeam: teamOn(candidates[0], data) };
}

function resolveTeams(tokens: ReturnType<typeof parseTitle>['teams'], date: string): [TeamId, TeamId] {
  return [resolveToken(tokens[0], date), resolveToken(tokens[1], date)];
}

function teamOn(date: string, data: TeagueData): TeamId | undefined {
  return data.stints.find((s) => s.from <= date && date <= s.to)?.team;
}
