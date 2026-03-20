export function gameFromCreate(body: {
  ownerId: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  players?: unknown[];
  status: string;
}): Record<string, unknown> {
  return {
    ...body,
    homeScore: 0,
    awayScore: 0,
    innings: [],
    players: body.players ?? [],
    date: new Date().toISOString(),
  };
}

export function rowToGame(id: number, payload: unknown): Record<string, unknown> {
  return { ...(payload as Record<string, unknown>), id };
}

export function mergeUpdatePayload(
  id: number,
  body: Record<string, unknown>,
): Record<string, unknown> {
  return { ...body, id };
}
