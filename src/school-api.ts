import axios from "axios";

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

const playerSchoolNameApi = axios.create({
  baseURL: "/api/player/school-name",
});

// GET /api/player/school-name?playerId=...
export const getSchoolNameByPlayerId = async (playerId: number) => {
  const response = await playerSchoolNameApi.get(`?playerId=${playerId}`);
  return response.data as PlayerSchoolNameResponse;
};

const schoolByNameApi = axios.create({
  baseURL: "/api/school/by-name",
});

// GET /api/school/by-name?name=...
export const getSchoolByName = async (name: string) => {
  const response = await schoolByNameApi.get(
    `?name=${encodeURIComponent(name)}`,
  );
  return response.data as SchoolByNameResponse;
};

const schoolPlayersByNameApi = axios.create({
  baseURL: "/api/school/by-name/players",
});

/** 부모 API 응답 필드는 필요 시 확장 */
export interface SchoolPlayerListItem {
  id?: number;
  name?: string;
}

export interface SchoolPlayersByNameResponse {
  players: SchoolPlayerListItem[];
}

// GET /api/school/by-name/players?name=...
export const getSchoolPlayersByName = async (name: string) => {
  const response = await schoolPlayersByNameApi.get(
    `?name=${encodeURIComponent(name)}`,
  );
  return response.data as SchoolPlayersByNameResponse;
};

/** playerId → schoolName → school 상세 + 동일 학교 선수 목록 */
export type SchoolInfoData = {
  schoolName: string | null;
  school: School | null;
  players: SchoolPlayerListItem[];
};

/**
 * playerId로 최종학교명을 받고, 있으면 학교 상세·해당 학교 선수 리스트를 조회합니다.
 */
export async function fetchSchoolInfoForPlayerId(
  playerId: number,
): Promise<SchoolInfoData> {
  const { schoolName } = await getSchoolNameByPlayerId(playerId);
  if (!schoolName) {
    return { schoolName: null, school: null, players: [] };
  }

  const [{ school }, playersRes] = await Promise.all([
    getSchoolByName(schoolName),
    getSchoolPlayersByName(schoolName).catch((): SchoolPlayersByNameResponse => ({
      players: [],
    })),
  ]);

  return {
    schoolName,
    school,
    players: playersRes.players ?? [],
  };
}
