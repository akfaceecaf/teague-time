import type { TeamId } from './teams';

/** Shape of data/teague.json (see scripts/build_teague_data.py). */
export interface TeagueGame {
  date: string;
  team: TeamId;
  opp: TeamId;
  home: boolean;
  seasonType: 'Regular' | 'Playoffs';
  gameNumber?: number;
  played: boolean;
  min?: number;
  pts?: number;
  reb?: number;
  ast?: number;
}

export interface TeagueData {
  playerId: number;
  careerStart: string;
  careerEnd: string;
  stints: Array<{ team: TeamId; from: string; to: string }>;
  games: TeagueGame[];
}
