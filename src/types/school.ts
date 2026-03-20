/**
 * 부모 백엔드 학교 / 학교 선수 API 응답 형태
 */

export interface PlayerSchoolNameResponse {
  schoolName: string | null;
}

export interface School {
  name: string;
  category: string;
  category_label: string;
  region: string;
  url: string;
  count: number;
}

export interface SchoolByNameResponse {
  school: School;
}

/**
 * GET /api/school/by-name/players — 학교 소속 선수 한 명
 * `id`는 JSON에서 number 또는 string으로 올 수 있음.
 */
export interface SchoolPlayerListItem {
  id?: number | string;
  playerId?: number | string;
  name?: string;
  position?: string;
  backNumber?: string;
  /** 출생 연도 (학년 추정용, 부모 API 필드명이 다르면 매핑) */
  year?: string;
  /** 초등 4~6학년 등 — 있으면 학년 추정보다 우선 */
  grade?: number;
}

/**
 * `parseSchoolPlayerId`로 키를 확정한 뒤 맵에 넣을 때 — `id`는 항상 number.
 */
export type SchoolPlayerWithNumericId = SchoolPlayerListItem & { id: number };

export interface SchoolPlayersByNameResponse {
  players: SchoolPlayerListItem[];
}

/** playerId → schoolName → school 상세 + 동일 학교 선수 목록 */
export type SchoolInfoData = {
  schoolName: string | null;
  school: School | null;
  /** `GET /api/school/by-name/players?name=` */
  players: SchoolPlayerListItem[];
};
