import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchSchoolInfoByLoginId, parseSchoolPlayerId } from "./school-api";
import type {
  SchoolInfoData,
  SchoolPlayerListItem,
  SchoolPlayerWithNumericId,
} from "./types";
import { useOwnerId } from "./ownerId-store";

/**
 * 전역 스토어: 학교 정보 + 학교 소속 선수 리스트를 한곳에 둡니다 (별도 훅으로 또 부르지 않음).
 * - `school`, `schoolName`: 학교 메타
 * - `players`: member/school API 응답을 그대로 둡니다. `id`/`playerId`는 API 값을 바꾸지 않습니다.
 */

/**
 * 스토어의 `players`로 id → 선수 조회 맵 (엔트리 UI·제출용).
 * 맵 키용 숫자 id만 `parseSchoolPlayerId`로 뽑고, 원본 객체는 spread — API의 선수 식별 값은 유지됩니다.
 */
export function buildSchoolPlayerByIdMap(
  players: SchoolPlayerListItem[],
): Map<number, SchoolPlayerWithNumericId> {
  const m = new Map<number, SchoolPlayerWithNumericId>();
  for (const p of players) {
    const id = parseSchoolPlayerId(p);
    if (id != null) {
      m.set(id, { ...p, id });
    }
  }
  return m;
}
export type MyTeamStoreState = SchoolInfoData & {
  loading: boolean;
  error?: string;
};

const emptyState: MyTeamStoreState = {
  schoolName: null,
  school: null,
  players: [],
  loading: false,
};

const MyTeamContext = createContext<MyTeamStoreState | undefined>(undefined);

export const MyTeamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { ownerId } = useOwnerId();
  const [state, setState] = useState<MyTeamStoreState>(emptyState);

  useEffect(() => {
    if (!ownerId) {
      setState(emptyState);
      return;
    }

    let cancelled = false;
    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    void (async () => {
      try {
        const { schoolName, school, players } =
          await fetchSchoolInfoByLoginId(ownerId);
        if (cancelled) return;
        setState({
          schoolName,
          school,
          players,
          loading: false,
        });
      } catch (e: unknown) {
        if (cancelled) return;
        setState({
          schoolName: null,
          school: null,
          players: [],
          loading: false,
          error: e instanceof Error ? e.message : "알 수 없는 오류",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  return (
    <MyTeamContext.Provider value={state}>{children}</MyTeamContext.Provider>
  );
};

export const useMyTeam = (): MyTeamStoreState => {
  const value = useContext(MyTeamContext);
  if (!value) {
    throw new Error("useMyTeam은 MyTeamProvider 안에서만 사용할 수 있습니다.");
  }
  return value;
};
