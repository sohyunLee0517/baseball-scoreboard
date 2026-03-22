import type { SchoolPlayerListItem } from "./types/school";

/** 엔트리 화면에서 나누는 학년 그룹 (높은 학년 먼저) */
export const ENTRY_GRADE_ORDER = [6, 5, 4] as const;
export type EntryGradeKey = (typeof ENTRY_GRADE_ORDER)[number] | "other";

/**
 * 출생연도만으로 초등 학년을 추정합니다.
 * 기준: 기준일의 **달력 연도 `Y`** 로 `학년 = Y - 출생연도 - 6`
 * (예: Y=2026일 때 2014년생 → 6학년, 2015년생 → 5학년 …).
 * 3월 학년도 경계는 모호할 수 있어, 필요 시 API `grade`를 쓰세요.
 */
export function elementaryGradeFromBirthYear(
  birthYear: number,
  asOf: Date,
): number | null {
  if (!Number.isFinite(birthYear)) return null;
  const y = asOf.getFullYear();
  const grade = y - birthYear - 6;
  if (grade < 1 || grade > 6) return null;
  return grade;
}

function normalizeGradeField(grade: number): number | null {
  if (!Number.isFinite(grade)) return null;
  const g = Math.trunc(grade);
  if (g < 1 || g > 6) return null;
  return g;
}

/**
 * 엔트리 그룹(4·5·6학년)용 학년. 4~6이 아니면 null (기타).
 * `grade`가 4~6 밖이면 `birthYear`로 재추정합니다.
 */
export function getPlayerEntryGrade(
  player: SchoolPlayerListItem,
  asOf: Date,
): EntryGradeKey | null {
  const gField =
    player.grade != null ? normalizeGradeField(player.grade) : null;
  if (gField != null && gField >= 4 && gField <= 6) {
    return gField as EntryGradeKey;
  }
  if (player.birthYear != null) {
    const fromBirth = elementaryGradeFromBirthYear(
      Number(player.birthYear),
      asOf,
    );
    if (fromBirth != null && fromBirth >= 4 && fromBirth <= 6) {
      return fromBirth as EntryGradeKey;
    }
  }
  return null;
}

export type GradeGroupRow = {
  gradeKey: EntryGradeKey;
  /** UI용 (예: 6학년) */
  label: string;
  playerIds: number[];
};

function gradeLabel(key: EntryGradeKey): string {
  if (key === "other") return "기타";
  return `${key}학년`;
}

type PlayerRow = { id: number } & SchoolPlayerListItem;

function sortByNameStable(a: PlayerRow, b: PlayerRow): number {
  const an = (a.name ?? "").trim();
  const bn = (b.name ?? "").trim();
  const c = an.localeCompare(bn, "ko");
  if (c !== 0) return c;
  return a.id - b.id;
}

/**
 * 전체 선수를 6 → 5 → 4 → 기타 순으로 묶고, 각 그룹 안은 이름순.
 */
export function groupSchoolPlayersByGrade(
  players: PlayerRow[],
  asOf: Date,
): GradeGroupRow[] {
  const buckets: Record<number, number[]> = { 6: [], 5: [], 4: [] };
  const other: number[] = [];

  const enriched = players.map((p) => ({
    row: p,
    key: getPlayerEntryGrade(p, asOf),
  }));

  for (const { row, key } of enriched) {
    if (key === 6 || key === 5 || key === 4) {
      buckets[key].push(row.id);
    } else {
      other.push(row.id);
    }
  }

  const byId = new Map(players.map((p) => [p.id, p] as const));
  const sortIds = (ids: number[]) =>
    [...ids].sort((i, j) => sortByNameStable(byId.get(i)!, byId.get(j)!));

  const out: GradeGroupRow[] = [];
  for (const g of ENTRY_GRADE_ORDER) {
    const ids = sortIds(buckets[g]);
    if (ids.length > 0) {
      out.push({ gradeKey: g, label: gradeLabel(g), playerIds: ids });
    }
  }
  const oIds = sortIds(other);
  if (oIds.length > 0) {
    out.push({
      gradeKey: "other",
      label: gradeLabel("other"),
      playerIds: oIds,
    });
  }
  return out;
}

/**
 * 선택된 선수 id만 학년·이름 순으로 펼친 기본 라인업 순서.
 */
export function buildDefaultEntryOrderByGrade(
  selectedIds: number[],
  getPlayer: (id: number) => SchoolPlayerListItem | undefined,
  asOf: Date,
): number[] {
  const rows: PlayerRow[] = [];
  for (const id of selectedIds) {
    const p = getPlayer(id);
    if (!p) continue;
    rows.push({ ...p, id });
  }
  const grouped = groupSchoolPlayersByGrade(rows, asOf);
  return grouped.flatMap((g) => g.playerIds);
}
