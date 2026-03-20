import axios from "axios";
import type { CreateGamePayload, Game, UpdateGamePayload } from "./types";

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
