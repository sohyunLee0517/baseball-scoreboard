import type { Player } from "./types";

/** gameId → 스코어 시작 시 확정한 엔트리(내 팀 선수만, 순서대로) — Provider 없이 모듈 싱글톤 */
const lineupsByGameId: Record<number, Player[]> = {};

export function setLineupForGame(gameId: number, players: Player[]): void {
  lineupsByGameId[gameId] = players;
}

export function getLineupForGame(gameId: number): Player[] | undefined {
  return lineupsByGameId[gameId];
}

/** 디버그·다른 화면에서 읽을 때 (복사본) */
export function getLineupsSnapshot(): Record<number, Player[]> {
  return { ...lineupsByGameId };
}
