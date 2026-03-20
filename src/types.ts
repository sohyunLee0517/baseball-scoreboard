export interface Player {
  id?: number;
  name: string;
  team: 'HOME' | 'AWAY';
  position?: string;
  backNumber?: string;
}

export interface Inning {
  id?: number;
  inningNumber: number;
  topBottom: 'TOP' | 'BOTTOM';
  runs: number;
  hits: number;
  errors: number;
}

export interface Game {
  id?: number;
  ownerId: string;
  title: string;
  status: 'IN_PROGRESS' | 'FINISHED';
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  players: Player[];
  innings: Inning[];
  date?: string;
}
