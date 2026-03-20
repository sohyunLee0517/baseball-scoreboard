/**
 * 앱 전역 타입 진입점
 * - `game` — 스코어보드 도메인
 * - `school` — 학교/학교선수 API DTO
 * - `scoreboard-api` — 스코어보드 REST 페이로드
 */

export type {
  GameStatus,
  Game,
  Inning,
  Player,
  TeamSide,
  TopBottom,
} from "./game";

export type {
  PlayerSchoolNameResponse,
  School,
  SchoolByNameResponse,
  SchoolInfoData,
  SchoolPlayerListItem,
  SchoolPlayerWithNumericId,
  SchoolPlayersByNameResponse,
} from "./school";

export type {
  CreateGamePayload,
  CreateGamePlayerBody,
  UpdateGamePayload,
} from "./scoreboard-api";
