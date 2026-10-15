import type { Result } from './matchGame';
import { teamName } from './teams';

export interface Summary {
  headline: string;
  details: string[];
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export function summarize(result: Result): Summary {
  const { verdict, teams, date, game } = result;
  const matchup = teams ? `${teamName(teams[0])} vs. ${teamName(teams[1])}` : '';
  const when = date ? formatDate(date) : '';
  const details: string[] = [];
  if (teams && date) details.push(`${matchup} · ${when}`);
  if (game?.seasonType === 'Playoffs' && game.gameNumber) details.push(`Playoffs, Game ${game.gameNumber}`);
  if (result.dateSource === 'upload') details.push('Date guessed from the upload date — may be off by a game.');

  switch (verdict) {
    case 'PLAYED':
      return {
        headline: `Jeff Teague was at this game. He played for the ${teamName(game!.team)}.`,
        details: [...details, `${game!.min} min · ${game!.pts} pts · ${game!.reb} reb · ${game!.ast} ast`],
      };
    case 'ON_ROSTER_DNP':
      return {
        headline: `Jeff Teague was at this game: on the ${teamName(game!.team)} roster, but he didn't play.`,
        details,
      };
    case 'NOT_THERE':
      return {
        headline: 'Jeff Teague was not at this game.',
        details: result.teagueTeam
          ? [...details, `He was with the ${teamName(result.teagueTeam)} at the time.`]
          : details,
      };
    case 'OUT_OF_CAREER':
      return {
        headline:
          result.era === 'before'
            ? "Jeff Teague wasn't in the NBA yet."
            : 'Jeff Teague had already retired by this game.',
        details,
      };
    case 'NO_DATE':
      return {
        headline: `Found ${matchup}, but couldn't tell which game.`,
        details: ['No date in the title and no upload date available.'],
      };
    case 'NOT_A_GAME':
      return {
        headline: "This doesn't look like an NBA game.",
        details: ["Couldn't find two NBA teams in the title."],
      };
  }
}
