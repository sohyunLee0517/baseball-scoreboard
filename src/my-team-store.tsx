import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchSchoolInfoForPlayerId, type SchoolInfoData } from "./school-api";
import { useOwnerId } from "./ownerId-store";

/** ownerId(내 선수) 기준 학교(팀) 및 동일 학교 선수 목록 */
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

    void Promise.resolve(fetchSchoolInfoForPlayerId(Number(ownerId)))
      .then((data) => {
        if (cancelled) return;
        setState({
          ...data,
          loading: false,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
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

  return (
    <MyTeamContext.Provider value={state}>{children}</MyTeamContext.Provider>
  );
};

export const useMyTeam = (): MyTeamStoreState => {
  const value = useContext(MyTeamContext);
  if (!value) {
    throw new Error("useMyTeam must be used within MyTeamProvider");
  }
  return value;
};
