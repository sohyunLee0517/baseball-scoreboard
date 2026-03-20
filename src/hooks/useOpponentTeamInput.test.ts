import { renderHook, act } from "@testing-library/react";
import { useOpponentTeamInput } from "./useOpponentTeamInput";

describe("useOpponentTeamInput", () => {
  it("초기값은 빈 문자열이고 유효하지 않다 (내 팀 이름은 이 훅에서 다루지 않음)", () => {
    const { result } = renderHook(() => useOpponentTeamInput());
    expect(result.current.opponentName).toBe("");
    expect(result.current.isValid).toBe(false);
    expect(result.current.trimmedOpponentName).toBe("");
    expect(result.current).not.toHaveProperty("myTeamName");
    expect(result.current).not.toHaveProperty("setMyTeamName");
  });

  it("상대팀만 입력 가능하며 내 팀 이름을 바꾸는 API는 노출하지 않는다", () => {
    const { result } = renderHook(() => useOpponentTeamInput());
    const keys = Object.keys(result.current).sort();
    expect(keys).toEqual(
      ["isValid", "opponentName", "reset", "setOpponentName", "trimmedOpponentName"],
    );
  });

  it("상대팀 이름을 설정하면 trimmed 값과 유효성이 갱신된다", () => {
    const { result } = renderHook(() => useOpponentTeamInput());
    act(() => {
      result.current.setOpponentName("  Tigers  ");
    });
    expect(result.current.opponentName).toBe("  Tigers  ");
    expect(result.current.trimmedOpponentName).toBe("Tigers");
    expect(result.current.isValid).toBe(true);
  });

  it("reset으로 초기화할 수 있다", () => {
    const { result } = renderHook(() => useOpponentTeamInput());
    act(() => {
      result.current.setOpponentName("A");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.opponentName).toBe("");
    expect(result.current.isValid).toBe(false);
  });
});
