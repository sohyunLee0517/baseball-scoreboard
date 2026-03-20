import axios from 'axios';

const api = axios.create({
  baseURL: '/api/scoreboard/game', 
});

export const getGames = async (ownerId: string) => {
    const response = await api.get(`?ownerId=${ownerId}`);
    return response.data;
};
export const getGame = async (id: number) => {
    const response = await api.get(`/${id}`);
    return response.data;
};
export const createGame = async (data: any) => {
    const response = await api.post('', data);
    return response.data;
};
export const updateGame = async (id: number, data: any) => {
    const response = await api.put(`/${id}`, data);
    return response.data;
};
export const deleteGame = async (id: number) => {
    const response = await api.delete(`/${id}`);
    return response.data;
};
