import { renderHook, act } from "@testing-library/react";
import { useMyTeamHomeAway } from "./useMyTeamHomeAway";

describe("useMyTeamHomeAway", () => {
  it("기본값은 HOME이다", () => {
    const { result } = renderHook(() => useMyTeamHomeAway());
    expect(result.current.myTeamSide).toBe("HOME");
  });

  it("초기값을 AWAY로 줄 수 있다", () => {
    const { result } = renderHook(() => useMyTeamHomeAway("AWAY"));
    expect(result.current.myTeamSide).toBe("AWAY");
  });

  it("setMyTeamSide로 내 팀이 홈/어웨이를 바꿀 수 있다", () => {
    const { result } = renderHook(() => useMyTeamHomeAway());
    act(() => {
      result.current.setMyTeamSide("AWAY");
    });
    expect(result.current.myTeamSide).toBe("AWAY");
    act(() => {
      result.current.setMyTeamSide("HOME");
    });
    expect(result.current.myTeamSide).toBe("HOME");
  });
});
