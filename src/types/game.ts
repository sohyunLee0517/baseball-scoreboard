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
  /** 1~9회 개인 기록(타석 결과 등) — 인덱스 0 = 1회 */
  inningRecords?: string[];
}

/** 투수 기록 — 타순과 무관하게 명단에 추가한 선수만 (학교 선수 id 기준) */
export interface PitcherRecord {
  id?: number;
  name: string;
  team: TeamSide;
  position?: string;
  backNumber?: string;
  /** 총 아웃 수 (3아웃 = 1이닝). 화면에는 0.1 → 0.2 → 1 형식으로 표시 */
  pitchingOuts?: number;
  /** 안타 */
  hitsAllowed?: number;
  /** 실점 */
  runsAllowed?: number;
  /** 4구(볼넷) */
  walks?: number;
  /** 삼진 */
  strikeouts?: number;
  /** 피홈런 */
  homeRunsAllowed?: number;
}

export interface Inning {
  id?: number;
  inningNumber: number;
  topBottom: TopBottom;
  runs: number;
  hits: number;
  errors: number;
  /** 볼 카운트 등 — 스코어보드 B 열 합계용 */
  balls: number;
}

/** 스코어보드 우측 R / H / E / B 팀 합계(직접 입력·저장) */
export interface TeamLineScoreboard {
  runs: number;
  hits: number;
  errors: number;
  balls: number;
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
  /** 투수 기록 (라인업과 별도) */
  pitchers?: PitcherRecord[];
  innings: Inning[];
  date?: string;
  /** 원정 팀 R/H/E/B — 없으면 이닝 합으로 초기화 */
  awayLineScoreboard?: TeamLineScoreboard;
  /** 홈 팀 R/H/E/B */
  homeLineScoreboard?: TeamLineScoreboard;
}
