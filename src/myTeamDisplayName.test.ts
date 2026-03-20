import type { MyTeamStoreState } from "./my-team-store";
import { getMyTeamDisplayName } from "./myTeamDisplayName";

describe("getMyTeamDisplayName", () => {
  it("학교명이 있으면 school.name을 쓴다", () => {
    const state: MyTeamStoreState = {
      schoolName: "백업",
      school: {
        name: "서울고",
        category: "h",
        category_label: "고",
        region: "서울",
        url: "",
        count: 1,
      },
      players: [],
      loading: false,
    };
    expect(getMyTeamDisplayName(state)).toBe("서울고");
  });

  it("school이 없으면 schoolName을 쓴다", () => {
    const state: MyTeamStoreState = {
      schoolName: "부산고",
      school: null,
      players: [],
      loading: false,
    };
    expect(getMyTeamDisplayName(state)).toBe("부산고");
  });

  it("둘 다 없으면 기본 문구", () => {
    const state: MyTeamStoreState = {
      schoolName: null,
      school: null,
      players: [],
      loading: false,
    };
    expect(getMyTeamDisplayName(state)).toBe("내 팀");
  });
});
