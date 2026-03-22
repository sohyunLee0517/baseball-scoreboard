import axios from "axios";

import type {
  MemberPlayerResponse,
  MemberSchoolResponse,
  PlayerSchoolNameResponse,
  School,
  SchoolByNameResponse,
  SchoolInfoData,
  SchoolPlayerListItem,
  SchoolPlayersByNameResponse,
} from "./types/school";

export type {
  MemberPlayerResponse,
  MemberSchoolResponse,
  PlayerSchoolNameResponse,
  School,
  SchoolByNameResponse,
  SchoolInfoData,
  SchoolPlayerListItem,
  SchoolPlayersByNameResponse,
} from "./types/school";

const memberApi = axios.create({
  baseURL: "/api/member",
});

/** GET /api/member/player?loginId= */
export const getMemberPlayer = async (
  loginId: string,
): Promise<MemberPlayerResponse> => {
  const response = await memberApi.get<MemberPlayerResponse>("/player", {
    params: { loginId },
  });
  return response.data;
};

/** GET /api/member/school?loginId= */
export const getMemberSchool = async (
  loginId: string,
): Promise<MemberSchoolResponse> => {
  const response = await memberApi.get<MemberSchoolResponse>("/school", {
    params: { loginId },
  });
  return response.data;
};

/** loginId로 학교·선수 목록을 `SchoolInfoData` 형태로 조회 (신규 member API) */
export async function fetchSchoolInfoByLoginId(
  loginId: string,
): Promise<SchoolInfoData> {
  const data = await getMemberSchool(loginId);
  const schoolName = data.schoolName ?? data.school?.name?.trim() ?? null;
  return {
    schoolName,
    school: data.school ?? null,
    players: data.currentPlayers ?? [],
  };
}

const playerSchoolNameApi = axios.create({
  baseURL: "/api/player/school-name",
});

// GET /api/player/school-name?playerId=...
export const getSchoolNameByPlayerId = async (
  playerId: number,
): Promise<PlayerSchoolNameResponse> => {
  const response = await playerSchoolNameApi.get(`?playerId=${playerId}`);
  return response.data as PlayerSchoolNameResponse;
};

const schoolByNameApi = axios.create({
  baseURL: "/api/school/by-name",
});

// GET /api/school/by-name?name=...
export const getSchoolByName = async (
  name: string,
): Promise<SchoolByNameResponse> => {
  const response = await schoolByNameApi.get(
    `?name=${encodeURIComponent(name)}`,
  );
  return response.data as SchoolByNameResponse;
};

const schoolPlayersByNameApi = axios.create({
  baseURL: "/api/school/by-name/players",
});

/**
 * 학교 선수 객체에서 숫자 id를 뽑습니다. (JSON에서 id가 문자열로 오는 경우 대응)
 */
export function parseSchoolPlayerId(p: SchoolPlayerListItem): number | null {
  const raw = p.id ?? p.playerId;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// GET /api/school/by-name/players?name=...
export const getSchoolPlayersByName = async (
  name: string,
): Promise<SchoolPlayersByNameResponse> => {
  const response = await schoolPlayersByNameApi.get(
    `?name=${encodeURIComponent(name)}`,
  );
  return response.data as SchoolPlayersByNameResponse;
};

/**
 * 정확한 학교명으로 학교 상세 + 해당 학교 소속 선수 목록을 함께 조회합니다.
 * 선수 리스트는 `getSchoolPlayersByName`을 사용합니다.
 */
export async function fetchSchoolInfoBySchoolName(schoolName: string): Promise<{
  school: School | null;
  players: SchoolPlayerListItem[];
}> {
  const [{ school }, playersRes] = await Promise.all([
    getSchoolByName(schoolName),
    getSchoolPlayersByName(schoolName).catch(
      (): SchoolPlayersByNameResponse => ({
        players: [],
      }),
    ),
  ]);

  return {
    school,
    players: playersRes.players ?? [],
  };
}

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

  const { school, players } = await fetchSchoolInfoBySchoolName(schoolName);

  return {
    schoolName,
    school,
    players,
  };
}
