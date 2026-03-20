/**
 * `/api/scoreboard/game` 요청·응답에 맞춘 타입
 */

import type { Game, GameStatus, Player } from "./game";

/** POST 생성 시 서버(Prisma)로 보내는 선수 — DB `id`는 서버가 부여하므로 본문에 넣지 않음 */
export type CreateGamePlayerBody = Omit<Player, "id">;

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
