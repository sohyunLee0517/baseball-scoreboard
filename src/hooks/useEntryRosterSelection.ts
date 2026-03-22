import { useCallback, useEffect, useMemo, useState } from "react";
import type { SchoolPlayerWithNumericId } from "../types/school";
import {
  groupSchoolPlayersByGrade,
  type EntryGradeKey,
  type GradeGroupRow,
} from "../schoolPlayerGrade";

/** 학년 그룹 체크 상태 (전체선택 UI용) */
export type GroupSelectionState = "none" | "some" | "all";

export type UseEntryRosterSelectionOptions = {
  /**
   * 학년 계산 기준일 (`elementaryGradeFromBirthYear`에 전달).
   * 기본값: 실행 시점 `new Date()` — 연도가 바뀌면 같은 출생연도도 학년 추정이 달라질 수 있음.
   */
  referenceDate?: Date;
};

export function useEntryRosterSelection(
  players: SchoolPlayerWithNumericId[],
  options?: UseEntryRosterSelectionOptions,
) {
  const asOf = options?.referenceDate ?? new Date();

  console.log("players", players);
  const groups: GradeGroupRow[] = useMemo(
    () => groupSchoolPlayersByGrade(players, asOf),
    [players, asOf],
  );

  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const valid = new Set(players.map((p) => p.id));
    setSelected((prev) => {
      const next = new Set<number>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
      }
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) {
        return prev;
      }
      return next;
    });
  }, [players]);

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSelected = useCallback((id: number) => selected.has(id), [selected]);

  const selectedIds = useMemo(
    () => [...selected].sort((a, b) => a - b),
    [selected],
  );

  const getGroupSelectionState = useCallback(
    (gradeKey: EntryGradeKey): GroupSelectionState => {
      const row = groups.find((g) => g.gradeKey === gradeKey);
      if (!row || row.playerIds.length === 0) return "none";
      let n = 0;
      for (const id of row.playerIds) {
        if (selected.has(id)) n += 1;
      }
      if (n === 0) return "none";
      if (n === row.playerIds.length) return "all";
      return "some";
    },
    [groups, selected],
  );

  const toggleGroup = useCallback(
    (gradeKey: EntryGradeKey) => {
      setSelected((prev) => {
        const row = groups.find((g) => g.gradeKey === gradeKey);
        if (!row || row.playerIds.length === 0) return prev;
        const ids = row.playerIds;
        const allSelected = ids.every((id) => prev.has(id));
        const next = new Set(prev);
        if (allSelected) {
          for (const id of ids) next.delete(id);
        } else {
          for (const id of ids) next.add(id);
        }
        return next;
      });
    },
    [groups],
  );

  return {
    groups,
    selectedIds,
    toggle,
    isSelected,
    toggleGroup,
    getGroupSelectionState,
  };
}
