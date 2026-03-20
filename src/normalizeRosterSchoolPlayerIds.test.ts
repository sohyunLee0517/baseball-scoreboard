import type { Player } from "./types";
import type { SchoolPlayerListItem } from "./types/school";
import { normalizeRosterSchoolPlayerIds } from "./normalizeRosterSchoolPlayerIds";

describe("normalizeRosterSchoolPlayerIds", () => {
  const school: SchoolPlayerListItem[] = [
    { id: 501, name: "Kim", backNumber: "7", position: "P" },
    { id: 502, name: "Lee", backNumber: "10", position: "C" },
  ];

  it("replaces server DB id with school player id when name+number match", () => {
    const roster: Player[] = [
      {
        id: 3,
        name: "Kim",
        backNumber: "7",
        team: "HOME",
        position: "Bench",
      },
    ];
    const out = normalizeRosterSchoolPlayerIds(roster, school);
    expect(out[0]!.id).toBe(501);
    expect(out[0]!.position).toBe("P");
  });

  it("keeps roster row when id already matches school id", () => {
    const roster: Player[] = [
      { id: 501, name: "Kim", backNumber: "7", team: "HOME", position: "P" },
    ];
    const out = normalizeRosterSchoolPlayerIds(roster, school);
    expect(out[0]).toEqual(roster[0]);
  });
});
