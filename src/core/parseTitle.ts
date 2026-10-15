import { ABBREVIATIONS, ALIASES, type TeamToken } from './teams';
import { parseTitleDate } from './dates';

export interface ParsedTitle {
  /** Distinct teams found, in title order. A game needs exactly two. */
  teams: TeamToken[];
  date: string | null;
  gameNumber: number | null;
}

function normalize(title: string): string {
  return ` ${title
    .toLowerCase()
    .replace(/[’']s\b/g, '') // "Bucks' " / "Lakers's" -> plain nickname
    .replace(/[^a-z0-9\-/., ]+/g, ' ')
    .replace(/\s+/g, ' ')} `;
}

function isMostlyUppercase(title: string): boolean {
  const letters = title.replace(/[^A-Za-z]/g, '');
  const upper = letters.replace(/[^A-Z]/g, '');
  return letters.length > 0 && upper.length / letters.length > 0.6;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseTitle(title: string): ParsedTitle {
  const found: Array<{ index: number; token: TeamToken }> = [];

  // Longest aliases first; blank out each hit so "new york knicks" doesn't also match "new york".
  let text = normalize(title);
  for (const [alias, token] of ALIASES) {
    const re = new RegExp(`(?<=[^a-z0-9])${escape(alias)}(?=[^a-z0-9])`, 'g');
    text = text.replace(re, (match, index: number) => {
      found.push({ index, token });
      return ' '.repeat(match.length);
    });
  }

  // Abbreviations only count when written in caps in the original title ("MIL", not "mil"),
  // and not in ALL-CAPS titles, where "WAS" / "MIN" are just words.
  for (const [abbr, id] of isMostlyUppercase(title) ? [] : ABBREVIATIONS) {
    const m = new RegExp(`(?<![A-Za-z0-9])${abbr}(?![A-Za-z0-9])`).exec(title);
    if (m) found.push({ index: m.index, token: id });
  }

  const teams: TeamToken[] = [];
  for (const { token } of found.sort((a, b) => a.index - b.index)) {
    if (!teams.includes(token)) teams.push(token);
  }

  const game = title.match(/\bgame\s*#?([1-7])\b/i);
  return { teams, date: parseTitleDate(title), gameNumber: game ? +game[1] : null };
}
