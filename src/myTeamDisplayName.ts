import type { MyTeamStoreState } from "./my-team-store";

/**
 * 내 팀(학교) 이름 — 스토어·부모 API 기준으로만 결정되며 UI에서 임의 수정하지 않습니다.
 */
export function getMyTeamDisplayName(myTeam: MyTeamStoreState): string {
  return (
    myTeam.school?.name?.trim() ||
    myTeam.schoolName?.trim() ||
    "내 팀"
  );
}
