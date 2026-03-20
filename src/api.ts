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
  const response = await api.get(`?ownerId=${ownerId}`);
  return response.data as Game[];
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
