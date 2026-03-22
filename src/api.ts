import axios from "axios";
import type { CreateGamePayload, Game, UpdateGamePayload } from "./types";

/** 부모 앱·별도 API 서버 URL. 미설정 시 같은 origin의 `/api/scoreboard/game` (Vite mock 또는 리버스 프록시). */
const baseURL =
  (import.meta.env.VITE_SCOREBOARD_API_BASE as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "/api/scoreboard/game";

const api = axios.create({
  baseURL,
});

export const getGames = async (ownerId: string): Promise<Game[]> => {
  const response = await api.get("", {
    params: { ownerId },
  });
  return response.data as Game[];
};

/**
 * 학교 선수 ID 기준 경기 목록 (공개).
 * `baseURL`이 `/api/scoreboard/game` 이므로 `game/player/.../games` 로 붙여
 * `/api/scoreboard/game/player/:id/games` 만 호출 — 프록시가 `.../game` 만 넘길 때도 동작.
 */
export const getGamesByPlayerId = async (
  playerId: string,
): Promise<Game[]> => {
  const pid = encodeURIComponent(playerId.trim());
  const response = await api.get<Game[]>(`player/${pid}/games`);
  return response.data;
};

export const getGame = async (id: number): Promise<Game> => {
  const response = await api.get(`/${id}`);
  return response.data as Game;
};

export const createGame = async (data: CreateGamePayload): Promise<Game> => {
  const response = await api.post("", data);
  return response.data as Game;
};

export const updateGame = async (
  id: number,
  data: UpdateGamePayload,
): Promise<Game> => {
  const response = await api.put(`/${id}`, data);
  return response.data as Game;
};

export const deleteGame = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};
