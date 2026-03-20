import { renderHook, act } from "@testing-library/react";
import { useTeamEntryOrder } from "./useTeamEntryOrder";

describe("useTeamEntryOrder", () => {
  it("playerIds 순서대로 orderedIds가 초기화된다", () => {
    const { result } = renderHook(() => useTeamEntryOrder([10, 20, 30]));
    expect(result.current.orderedIds).toEqual([10, 20, 30]);
  });

  it("moveUp은 해당 인덱스를 한 칸 위로 올린다", () => {
    const { result } = renderHook(() => useTeamEntryOrder([10, 20, 30]));
    act(() => {
      result.current.moveUp(1);
    });
    expect(result.current.orderedIds).toEqual([20, 10, 30]);
  });

  it("moveUp(0)은 변화 없음", () => {
    const { result } = renderHook(() => useTeamEntryOrder([10, 20]));
    act(() => {
      result.current.moveUp(0);
    });
    expect(result.current.orderedIds).toEqual([10, 20]);
  });

  it("moveDown은 해당 인덱스를 한 칸 아래로 내린다", () => {
    const { result } = renderHook(() => useTeamEntryOrder([10, 20, 30]));
    act(() => {
      result.current.moveDown(1);
    });
    expect(result.current.orderedIds).toEqual([10, 30, 20]);
  });

  it("moveDown(마지막)은 변화 없음", () => {
    const { result } = renderHook(() => useTeamEntryOrder([10, 20]));
    act(() => {
      result.current.moveDown(1);
    });
    expect(result.current.orderedIds).toEqual([10, 20]);
  });

  it("playerIds가 바뀌면 기존 순서를 유지하며 id만 동기화한다", () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: number[] }) => useTeamEntryOrder(ids),
      { initialProps: { ids: [1, 2, 3] as number[] } },
    );
    act(() => {
      result.current.moveUp(1);
    });
    expect(result.current.orderedIds).toEqual([2, 1, 3]);
    rerender({ ids: [1, 2, 3, 4] });
    expect(result.current.orderedIds).toEqual([2, 1, 3, 4]);
  });
});
