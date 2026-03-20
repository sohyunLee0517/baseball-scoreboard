import { parseSchoolPlayerId, type SchoolPlayerListItem } from "./school-api";

describe("parseSchoolPlayerId", () => {
  it("number id", () => {
    const p: SchoolPlayerListItem = { id: 42, name: "a" };
    expect(parseSchoolPlayerId(p)).toBe(42);
  });

  it("string id (JSON에서 문자열로 오는 경우)", () => {
    const p = { id: " 99 ", name: "b" } as SchoolPlayerListItem;
    expect(parseSchoolPlayerId(p)).toBe(99);
  });

  it("playerId 폴백", () => {
    const p: SchoolPlayerListItem = { playerId: 7, name: "c" };
    expect(parseSchoolPlayerId(p)).toBe(7);
  });

  it("파싱 불가면 null", () => {
    expect(parseSchoolPlayerId({ name: "only" })).toBeNull();
    expect(parseSchoolPlayerId({ id: "x" })).toBeNull();
  });
});
