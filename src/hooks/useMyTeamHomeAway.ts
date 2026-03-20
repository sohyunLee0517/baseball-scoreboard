import { useState } from "react";
import type { TeamSide } from "../types";

/** UI 훅에서 쓰는 이름 — 도메인 `TeamSide`와 동일 */
export type MyTeamSide = TeamSide;

export function useMyTeamHomeAway(initialSide: MyTeamSide = "HOME") {
  const [myTeamSide, setMyTeamSide] = useState<MyTeamSide>(initialSide);

  return { myTeamSide, setMyTeamSide };
}
