import { renderHook, act } from "@testing-library/react";
import type { SchoolPlayerWithNumericId } from "../types/school";
import { useEntryRosterSelection } from "./useEntryRosterSelection";

const REF = new Date("2026-06-15");

describe("useEntryRosterSelection", () => {
  const players: SchoolPlayerWithNumericId[] = [
    { id: 1, name: "다", year: "2016" },
    { id: 2, name: "가", year: "2014" },
    { id: 3, name: "나", year: "2015" },
  ];

  it("선수 목록을 학년 그룹(6→5→4→기타)으로 돌려준다", () => {
    const { result } = renderHook(() =>
      useEntryRosterSelection(players, { referenceDate: REF }),
    );
    expect(result.current.groups.map((g) => g.gradeKey)).toEqual([6, 5, 4]);
    expect(result.current.groups[0]!.playerIds).toEqual([2]);
    expect(result.current.groups[1]!.playerIds).toEqual([3]);
    expect(result.current.groups[2]!.playerIds).toEqual([1]);
  });

  it("toggle으로 선택 id를 넣고 뺀다", () => {
    const { result } = renderHook(() =>
      useEntryRosterSelection(players, { referenceDate: REF }),
    );
    expect(result.current.selectedIds).toEqual([]);
    act(() => {
      result.current.toggle(2);
    });
    expect(result.current.selectedIds).toEqual([2]);
    expect(result.current.isSelected(2)).toBe(true);
    act(() => {
      result.current.toggle(2);
    });
    expect(result.current.selectedIds).toEqual([]);
  });

  it("목록에서 사라진 id는 선택에서 제거된다", () => {
    const { result, rerender } = renderHook(
      ({ list }: { list: SchoolPlayerWithNumericId[] }) =>
        useEntryRosterSelection(list, { referenceDate: REF }),
      { initialProps: { list: players } },
    );
    act(() => {
      result.current.toggle(1);
      result.current.toggle(2);
    });
    expect(result.current.selectedIds.sort()).toEqual([1, 2]);
    rerender({ list: players.filter((p) => p.id !== 2) });
    expect(result.current.selectedIds).toEqual([1]);
  });

  describe("학년 그룹 전체 선택 (toggleGroup)", () => {
    const twoInGrade6: SchoolPlayerWithNumericId[] = [
      { id: 2, name: "가", year: "2014" },
      { id: 4, name: "마", year: "2014" },
      { id: 3, name: "나", year: "2015" },
    ];

    it("해당 학년 그룹 선수를 한 번에 모두 선택한다", () => {
      const { result } = renderHook(() =>
        useEntryRosterSelection(players, { referenceDate: REF }),
      );
      expect(result.current.groups[0]!.gradeKey).toBe(6);
      act(() => {
        result.current.toggleGroup(6);
      });
      expect(result.current.selectedIds.sort()).toEqual([2]);
      expect(result.current.getGroupSelectionState(6)).toBe("all");
    });

    it("그룹이 전부 선택된 상태에서 toggleGroup이면 해당 그룹만 모두 해제한다", () => {
      const { result } = renderHook(() =>
        useEntryRosterSelection(players, { referenceDate: REF }),
      );
      act(() => {
        result.current.toggleGroup(6);
      });
      expect(result.current.getGroupSelectionState(6)).toBe("all");
      act(() => {
        result.current.toggleGroup(6);
      });
      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.getGroupSelectionState(6)).toBe("none");
    });

    it("6학년이 여러 명이면 toggleGroup(6)으로 전원 선택·해제한다", () => {
      const { result } = renderHook(() =>
        useEntryRosterSelection(twoInGrade6, { referenceDate: REF }),
      );
      expect(result.current.groups.find((g) => g.gradeKey === 6)?.playerIds.sort()).toEqual([
        2, 4,
      ]);
      act(() => {
        result.current.toggleGroup(6);
      });
      expect(result.current.selectedIds.sort()).toEqual([2, 4]);
      act(() => {
        result.current.toggleGroup(6);
      });
      expect(result.current.selectedIds).toEqual([]);
    });

    it("일부만 선택된 그룹에서 toggleGroup이면 나머지까지 포함해 전원 선택한다", () => {
      const { result } = renderHook(() =>
        useEntryRosterSelection(twoInGrade6, { referenceDate: REF }),
      );
      act(() => {
        result.current.toggle(2);
      });
      expect(result.current.getGroupSelectionState(6)).toBe("some");
      act(() => {
        result.current.toggleGroup(6);
      });
      expect(result.current.selectedIds.sort()).toEqual([2, 4]);
      expect(result.current.getGroupSelectionState(6)).toBe("all");
    });

    it("getGroupSelectionState는 none / some / all을 반환한다", () => {
      const roster: SchoolPlayerWithNumericId[] = [
        { id: 2, name: "가", year: "2014" },
        { id: 3, name: "나", year: "2015" },
        { id: 4, name: "다", year: "2015" },
      ];
      const { result } = renderHook(() =>
        useEntryRosterSelection(roster, { referenceDate: REF }),
      );
      expect(result.current.getGroupSelectionState(6)).toBe("none");
      expect(result.current.getGroupSelectionState(5)).toBe("none");

      act(() => {
        result.current.toggle(3);
      });
      expect(result.current.getGroupSelectionState(5)).toBe("some");

      act(() => {
        result.current.toggle(4);
      });
      expect(result.current.getGroupSelectionState(5)).toBe("all");
    });

    it("기타 그룹에도 toggleGroup(other)를 쓸 수 있다", () => {
      const withOther: SchoolPlayerWithNumericId[] = [
        { id: 2, name: "가", year: "2014" },
        { id: 9, name: "비", year: "2020" },
      ];
      const { result } = renderHook(() =>
        useEntryRosterSelection(withOther, { referenceDate: REF }),
      );
      const keys = result.current.groups.map((g) => g.gradeKey);
      expect(keys).toContain("other");
      act(() => {
        result.current.toggleGroup("other");
      });
      expect(result.current.selectedIds).toEqual([9]);
      expect(result.current.getGroupSelectionState("other")).toBe("all");
    });
  });
});
