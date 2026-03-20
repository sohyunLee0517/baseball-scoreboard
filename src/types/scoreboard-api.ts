/**
 * `/api/scoreboard/game` 요청·응답에 맞춘 타입
 */

import type { Game, GameStatus, Player } from "./game";

/** POST 생성 시 선수 한 명 — 학교 선수 `id`는 API와 동일하게 보냄 */
export type CreateGamePlayerBody = Player;

/** POST 생성 시 본문 */
export interface CreateGamePayload {
  ownerId: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  players: Player[];
  status: GameStatus;
}

/** PUT 수정 시 본문 — 서버가 전체 `Game`을 기대하는 경우 */
export type UpdateGamePayload = Game;
