import axios from "axios";
import type {
  CreateGamePayload,
  CreateGamePlayerBody,
  Game,
  UpdateGamePayload,
} from "./types";

const api = axios.create({
  baseURL: "/api/scoreboard/game",
});

export const getGames = async (ownerId: string): Promise<Game[]> => {
  const response = await api.get(`?ownerId=${ownerId}`);
  return response.data as Game[];
};

export const getGame = async (id: number): Promise<Game> => {
  const response = await api.get(`/${id}`);
  return response.data as Game;
};

/**
 * Prisma `players.create`는 보통 DB 자동 `id`를 쓰므로,
 * 프론트의 학교 선수 `id`가 그대로 가면 스키마와 맞지 않아 500이 날 수 있음 → 제거.
 */
function playersForCreateApi(players: CreateGamePayload["players"]): CreateGamePlayerBody[] {
  return players.map(({ id: _clientPlayerId, ...rest }) => rest);
}

export const createGame = async (data: CreateGamePayload): Promise<Game> => {
  const body = {
    ...data,
    players: playersForCreateApi(data.players),
  };
  const response = await api.post("", body);
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
