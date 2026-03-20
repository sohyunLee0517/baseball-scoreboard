import { useEffect, useState } from "react";
import { fetchSchoolInfoForPlayerId, type SchoolInfoData } from "../school-api";
import { useOwnerId } from "../ownerId-store";

/**
 * 전역 `ownerId`는 이 앱에서 **선수(player) ID**로 쓰입니다.
 * `/api/player/school-name?playerId=` → `/api/school/by-name?name=` 흐름은 `fetchSchoolInfoForPlayerId`에 위임합니다.
 */
export type SchoolInfoState = SchoolInfoData & {
  loading: boolean;
  error?: string;
};

export function useSchoolInfoForOwnerPlayer() {
  const { ownerId } = useOwnerId();
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfoState>({
    schoolName: null,
    school: null,
    players: [],
    loading: false,
  });

  useEffect(() => {
    if (!ownerId) {
      setSchoolInfo({
        schoolName: null,
        school: null,
        players: [],
        loading: false,
      });
      return;
    }

    let cancelled = false;
    setSchoolInfo((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    void Promise.resolve(fetchSchoolInfoForPlayerId(Number(ownerId)))
      .then((data) => {
        if (cancelled) return;
        setSchoolInfo({
          ...data,
          loading: false,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setSchoolInfo({
          schoolName: null,
          school: null,
          players: [],
          loading: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  return { schoolInfo };
}
