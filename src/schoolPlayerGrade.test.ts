import type { SchoolPlayerListItem } from "./types/school";
import {
  buildDefaultEntryOrderByGrade,
  elementaryGradeFromBirthYear,
  getPlayerEntryGrade,
  groupSchoolPlayersByGrade,
} from "./schoolPlayerGrade";

/** 테스트에서 고정 — 앱은 `new Date()` 사용 */
const REF = new Date("2026-06-15");

describe("elementaryGradeFromBirthYear", () => {
  it("2026-06 기준 출생연도로 초등 6·5·4학년을 추정한다", () => {
    expect(elementaryGradeFromBirthYear(2014, REF)).toBe(6);
    expect(elementaryGradeFromBirthYear(2015, REF)).toBe(5);
    expect(elementaryGradeFromBirthYear(2016, REF)).toBe(4);
    expect(elementaryGradeFromBirthYear(2017, REF)).toBe(3);
    expect(elementaryGradeFromBirthYear(2018, REF)).toBe(2);
    expect(elementaryGradeFromBirthYear(2019, REF)).toBe(1);
  });

  it("초등 범위(1~6) 밖이면 null", () => {
    expect(elementaryGradeFromBirthYear(2021, REF)).toBeNull();
    expect(elementaryGradeFromBirthYear(1990, REF)).toBeNull();
  });
});

describe("getPlayerEntryGrade", () => {
  it("player.grade가 있으면 생년보다 우선한다 (4~6만 엔트리 그룹)", () => {
    const p: SchoolPlayerListItem = { name: "a", year: "2015", grade: 6 };
    expect(getPlayerEntryGrade(p, REF)).toBe(6);
  });

  it("grade가 4~6 밖이면 생년으로 폴백한다", () => {
    const p: SchoolPlayerListItem = { name: "a", year: "2014", grade: 3 };
    expect(getPlayerEntryGrade(p, REF)).toBe(6);
  });

  it("생년만 있으면 elementaryGradeFromBirthYear와 동일", () => {
    const p: SchoolPlayerListItem = { name: "a", year: "2014" };
    expect(getPlayerEntryGrade(p, REF)).toBe(6);
  });

  it("4~6 학년으로 판별 불가하면 null (기타 그룹)", () => {
    expect(getPlayerEntryGrade({ name: "x" }, REF)).toBeNull();
    expect(getPlayerEntryGrade({ name: "x", year: "2021" }, REF)).toBeNull();
  });
});

describe("groupSchoolPlayersByGrade", () => {
  it("6학년 → 5학년 → 4학년 → 기타 순으로 그룹을 낸다", () => {
    const rows = groupSchoolPlayersByGrade(
      [
        { id: 1, name: "다", year: "2016" },
        { id: 2, name: "가", year: "2014" },
        { id: 3, name: "나", year: "2015" },
        { id: 4, name: "라" },
      ],
      REF,
    );
    expect(rows.map((g) => g.gradeKey)).toEqual([6, 5, 4, "other"]);
    expect(rows[0]!.playerIds).toEqual([2]);
    expect(rows[1]!.playerIds).toEqual([3]);
    expect(rows[2]!.playerIds).toEqual([1]);
    expect(rows[3]!.playerIds).toEqual([4]);
  });

  it("같은 학년 내에서는 이름 오름차순", () => {
    const rows = groupSchoolPlayersByGrade(
      [
        { id: 10, name: "이", year: "2014" },
        { id: 11, name: "김", year: "2014" },
      ],
      REF,
    );
    const g6 = rows.find((r) => r.gradeKey === 6);
    expect(g6?.playerIds).toEqual([11, 10]);
  });
});

describe("buildDefaultEntryOrderByGrade", () => {
  it("선택된 id를 학년 그룹(6→5→4→기타) 순·이름순으로 펼친다", () => {
    const byId = new Map([
      [1, { id: 1, name: "다", year: "2016" }],
      [2, { id: 2, name: "가", year: "2014" }],
      [3, { id: 3, name: "나", year: "2015" }],
    ] as const);
    const order = buildDefaultEntryOrderByGrade(
      [3, 1, 2],
      (id) => byId.get(id),
      REF,
    );
    expect(order).toEqual([2, 3, 1]);
  });
});
