import type { MyTeamStoreState } from "../my-team-store";
import { useMyTeam } from "../my-team-store";

/**
 * 전역 `ownerId`는 이 앱에서 **선수(player) ID**로 쓰입니다.
 * 팀·선수 데이터는 `MyTeamProvider` 스토어에서 가져옵니다.
 */
export type SchoolInfoState = MyTeamStoreState;

export function useSchoolInfoForOwnerPlayer() {
  return { schoolInfo: useMyTeam() };
}
