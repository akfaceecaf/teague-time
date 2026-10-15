// Canonical IDs are the current franchise abbreviations used in data/teague.json.
export type TeamId =
  | 'ATL' | 'BOS' | 'BKN' | 'CHA' | 'CHI' | 'CLE' | 'DAL' | 'DEN' | 'DET' | 'GSW'
  | 'HOU' | 'IND' | 'LAC' | 'LAL' | 'MEM' | 'MIA' | 'MIL' | 'MIN' | 'NOP' | 'NYK'
  | 'OKC' | 'ORL' | 'PHI' | 'PHX' | 'POR' | 'SAC' | 'SAS' | 'TOR' | 'UTA' | 'WAS';

// "Hornets" alone was New Orleans until 2013, Charlotte from 2014-15. Resolved once we know the date.
export type TeamToken = TeamId | 'HORNETS';

interface Team {
  id: TeamId;
  name: string;
  /** Lowercase phrases matched as whole words in the normalized title. */
  aliases: string[];
  /** Matched case-sensitively as whole words in the original title (e.g. "MIL", not "mil"). */
  abbrs: string[];
}

export const TEAMS: Team[] = [
  { id: 'ATL', name: 'Atlanta Hawks', aliases: ['atlanta hawks', 'hawks', 'atlanta'], abbrs: ['ATL'] },
  { id: 'BOS', name: 'Boston Celtics', aliases: ['boston celtics', 'celtics', 'boston'], abbrs: ['BOS'] },
  {
    id: 'BKN', name: 'Brooklyn Nets',
    aliases: ['brooklyn nets', 'new jersey nets', 'nets', 'brooklyn', 'new jersey'],
    abbrs: ['BKN', 'BRK', 'NJN'],
  },
  {
    id: 'CHA', name: 'Charlotte Hornets',
    aliases: ['charlotte hornets', 'charlotte bobcats', 'bobcats', 'charlotte'],
    abbrs: ['CHA', 'CHO'],
  },
  { id: 'CHI', name: 'Chicago Bulls', aliases: ['chicago bulls', 'bulls', 'chicago'], abbrs: ['CHI'] },
  { id: 'CLE', name: 'Cleveland Cavaliers', aliases: ['cleveland cavaliers', 'cavaliers', 'cavs', 'cleveland'], abbrs: ['CLE'] },
  { id: 'DAL', name: 'Dallas Mavericks', aliases: ['dallas mavericks', 'mavericks', 'mavs', 'dallas'], abbrs: ['DAL'] },
  { id: 'DEN', name: 'Denver Nuggets', aliases: ['denver nuggets', 'nuggets', 'denver'], abbrs: ['DEN'] },
  { id: 'DET', name: 'Detroit Pistons', aliases: ['detroit pistons', 'pistons', 'detroit'], abbrs: ['DET'] },
  { id: 'GSW', name: 'Golden State Warriors', aliases: ['golden state warriors', 'warriors', 'golden state'], abbrs: ['GSW'] },
  { id: 'HOU', name: 'Houston Rockets', aliases: ['houston rockets', 'rockets', 'houston'], abbrs: ['HOU'] },
  { id: 'IND', name: 'Indiana Pacers', aliases: ['indiana pacers', 'pacers', 'indiana'], abbrs: ['IND'] },
  // "los angeles" / "la" alone is ambiguous, so only the nicknames count.
  { id: 'LAC', name: 'LA Clippers', aliases: ['los angeles clippers', 'la clippers', 'clippers'], abbrs: ['LAC'] },
  { id: 'LAL', name: 'Los Angeles Lakers', aliases: ['los angeles lakers', 'la lakers', 'lakers'], abbrs: ['LAL'] },
  { id: 'MEM', name: 'Memphis Grizzlies', aliases: ['memphis grizzlies', 'grizzlies', 'grizz', 'memphis'], abbrs: ['MEM'] },
  { id: 'MIA', name: 'Miami Heat', aliases: ['miami heat', 'heat', 'miami'], abbrs: ['MIA'] },
  { id: 'MIL', name: 'Milwaukee Bucks', aliases: ['milwaukee bucks', 'bucks', 'milwaukee'], abbrs: ['MIL'] },
  {
    id: 'MIN', name: 'Minnesota Timberwolves',
    aliases: ['minnesota timberwolves', 'timberwolves', 't-wolves', 'twolves', 'wolves', 'minnesota'],
    abbrs: ['MIN'],
  },
  {
    id: 'NOP', name: 'New Orleans Pelicans',
    aliases: ['new orleans pelicans', 'new orleans hornets', 'pelicans', 'pels', 'new orleans'],
    abbrs: ['NOP', 'NOH'],
  },
  { id: 'NYK', name: 'New York Knicks', aliases: ['new york knicks', 'knicks', 'new york'], abbrs: ['NYK'] },
  { id: 'OKC', name: 'Oklahoma City Thunder', aliases: ['oklahoma city thunder', 'thunder', 'oklahoma city'], abbrs: ['OKC'] },
  { id: 'ORL', name: 'Orlando Magic', aliases: ['orlando magic', 'magic', 'orlando'], abbrs: ['ORL'] },
  {
    id: 'PHI', name: 'Philadelphia 76ers',
    aliases: ['philadelphia 76ers', 'philadelphia sixers', '76ers', 'sixers', 'philadelphia', 'philly'],
    abbrs: ['PHI'],
  },
  { id: 'PHX', name: 'Phoenix Suns', aliases: ['phoenix suns', 'suns', 'phoenix'], abbrs: ['PHX', 'PHO'] },
  {
    id: 'POR', name: 'Portland Trail Blazers',
    aliases: ['portland trail blazers', 'portland trailblazers', 'trail blazers', 'trailblazers', 'blazers', 'portland'],
    abbrs: ['POR'],
  },
  { id: 'SAC', name: 'Sacramento Kings', aliases: ['sacramento kings', 'kings', 'sacramento'], abbrs: ['SAC'] },
  { id: 'SAS', name: 'San Antonio Spurs', aliases: ['san antonio spurs', 'spurs', 'san antonio'], abbrs: ['SAS'] },
  { id: 'TOR', name: 'Toronto Raptors', aliases: ['toronto raptors', 'raptors', 'toronto'], abbrs: ['TOR'] },
  { id: 'UTA', name: 'Utah Jazz', aliases: ['utah jazz', 'jazz', 'utah'], abbrs: ['UTA', 'UTAH'] },
  { id: 'WAS', name: 'Washington Wizards', aliases: ['washington wizards', 'wizards', 'washington'], abbrs: ['WAS', 'WSH'] },
];

const BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

export function teamName(id: TeamId): string {
  return BY_ID.get(id)!.name;
}

/** Every (alias, token) pair, longest alias first so "new orleans hornets" wins over "hornets". */
export const ALIASES: Array<[string, TeamToken]> = [
  ...TEAMS.flatMap((t) => t.aliases.map((a): [string, TeamToken] => [a, t.id])),
  ['hornets', 'HORNETS'] as [string, TeamToken],
].sort((a, b) => b[0].length - a[0].length);

export const ABBREVIATIONS: Array<[string, TeamId]> = TEAMS.flatMap((t) =>
  t.abbrs.map((a): [string, TeamId] => [a, t.id]),
);

/** First season the Charlotte franchise played as the Hornets again (2014-15). */
const CHARLOTTE_HORNETS_FROM = '2014-07-01';

export function resolveToken(token: TeamToken, isoDate: string): TeamId {
  if (token !== 'HORNETS') return token;
  return isoDate >= CHARLOTTE_HORNETS_FROM ? 'CHA' : 'NOP';
}
