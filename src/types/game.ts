/**
 * 스코어보드 도메인 (경기·선수·이닝)
 */

/** 선수 소속 (홈 / 원정) */
export type TeamSide = "HOME" | "AWAY";

/** 이닝 상·하 */
export type TopBottom = "TOP" | "BOTTOM";

/** 경기 진행 상태 */
export type GameStatus = "IN_PROGRESS" | "FINISHED";

export interface Player {
  /** 학교 선수 API와 동일한 선수 id (생성·수정 요청에 그대로 포함) */
  id?: number;
  name: string;
  team: TeamSide;
  position?: string;
  backNumber?: string;
  /** 타순(엔트리) — 1부터 */
  lineupOrder?: number;
}

export interface Inning {
  id?: number;
  inningNumber: number;
  topBottom: TopBottom;
  runs: number;
  hits: number;
  errors: number;
}

export interface Game {
  id?: number;
  ownerId: string;
  title: string;
  status: GameStatus;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  players: Player[];
  innings: Inning[];
  date?: string;
}
