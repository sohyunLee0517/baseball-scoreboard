import type { Player } from "./types";
import type { SchoolPlayerListItem } from "./types/school";
import { parseSchoolPlayerId } from "./school-api";

function normName(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function normBack(s: string | undefined): string {
  return (s ?? "").trim();
}

/**
 * 경기 명단의 `player.id`를 서버 DB id 대신 학교 선수 id(`parseSchoolPlayerId`)로 맞춥니다.
 * 저장 응답·로컬 상태가 DB id를 쓰더라도, 학교 API와 동일한 id로 통일합니다.
 */
export function normalizeRosterSchoolPlayerIds(
  roster: Player[],
  schoolPlayers: SchoolPlayerListItem[],
): Player[] {
  const withIds = schoolPlayers
    .map((sp) => ({ sp, id: parseSchoolPlayerId(sp) }))
    .filter((x): x is { sp: SchoolPlayerListItem; id: number } => x.id != null);

  const schoolIdSet = new Set(withIds.map((x) => x.id));

  return roster.map((p) => {
    if (p.id != null && schoolIdSet.has(p.id)) {
      return p;
    }

    const name = normName(p.name);
    const back = normBack(p.backNumber);

    const nameBackMatches = withIds.filter(
      ({ sp }) =>
        normName(sp.name) === name && normBack(sp.backNumber) === back,
    );
    if (nameBackMatches.length === 1) {
      const { sp, id } = nameBackMatches[0]!;
      return {
        ...p,
        id,
        name: sp.name?.trim() || p.name,
        backNumber: normBack(sp.backNumber) || p.backNumber,
        position: sp.position?.trim() || p.position,
      };
    }

    const nameOnly = withIds.filter(({ sp }) => normName(sp.name) === name);
    if (nameOnly.length === 1) {
      const { sp, id } = nameOnly[0]!;
      return {
        ...p,
        id,
        name: sp.name?.trim() || p.name,
        backNumber: normBack(sp.backNumber) || p.backNumber,
        position: sp.position?.trim() || p.position,
      };
    }

    return p;
  });
}
