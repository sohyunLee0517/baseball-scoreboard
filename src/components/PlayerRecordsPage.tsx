import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGamesByPlayerId } from "../api";
import type { Game, PitcherRecord, Player } from "../types";
import { getPlayerById, type PlayerApiProfile } from "../school-api";
import { batResultCodeToLabelKo } from "../constants/batResult";
import { outsToDisplayString } from "../utils/pitchingInnings";
import { useOwnerId } from "../ownerId-store";

function summarizeInningRecords(records?: string[]): string {
  return (records ?? [])
    .map((s) => s?.trim())
    .filter(Boolean)
    .map((s) => batResultCodeToLabelKo(s))
    .join(", ");
}

function findBatter(game: Game, playerId: number): Player | undefined {
  return (game.players ?? []).find((p) => p.id === playerId);
}

function findPitcher(game: Game, playerId: number): PitcherRecord | undefined {
  return game.pitchers?.find((p) => p.id === playerId);
}

function gamesWithPlayer(games: Game[], playerId: number): Game[] {
  return games.filter(
    (g) => findBatter(g, playerId) || findPitcher(g, playerId),
  );
}

/** 부모 앱 `/school/:name` 학교명 태그 (소속 이력·소속팀 공통) */
const schoolProfileLinkClassName =
  "inline-flex max-w-full items-center rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-blue-300/80 hover:bg-blue-50/80 hover:text-blue-800";

/** 상세 목록: 본명(realName) 제외 · 제목에 쓰인 name·등번호는 중복 생략 */
const PROFILE_DETAIL_SKIP = new Set([
  "realName",
  "realname",
  "name",
  "backNumber",
  "id",
]);

function isRealNameField(key: string): boolean {
  return key === "realName" || key.toLowerCase() === "realname";
}

/** `path` 항목 한 개 → 표시·링크에 쓸 학교명 (객체는 `team`, 문자열은 그대로) */
function pathEntryToSchoolName(entry: unknown): string | null {
  if (typeof entry === "string") {
    const t = entry.trim();
    return t || null;
  }
  if (entry !== null && typeof entry === "object") {
    const team = (entry as { team?: unknown }).team;
    if (typeof team === "string") {
      const t = team.trim();
      if (t) return t;
    }
  }
  return null;
}

/** API `path` — `{ team, year, ... }[]` 또는 학교명 문자열 배열, 또는 구분 문자열 */
function parsePathSchools(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => pathEntryToSchoolName(x))
      .filter((s): s is string => s != null);
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t) as unknown;
        if (Array.isArray(parsed)) return parsePathSchools(parsed);
      } catch {
        /* fall through */
      }
    }
    return t
      .split(/\s*->\s*|\s*→\s*|,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function profileFieldLabelKo(key: string): string {
  const labels: Record<string, string> = {
    id: "선수 ID",
    position: "포지션",
    schoolName: "학교명",
    school: "학교",
    history: "소속 이력",
    path: "학력",
    finalSchool: "소속팀",
    grade: "학년",
    birthYear: "출생연도",
    height: "키",
    weight: "몸무게",
    batHand: "타격",
    throwHand: "투구",
  };
  return labels[key] ?? key;
}

function formatProfileValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") {
    const t = value.trim();
    return t === "" ? null : t;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((v) => formatProfileValue(v))
      .filter((s): s is string => s != null && s !== "");
    return parts.length ? parts.join(", ") : null;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

const PROFILE_KEY_ORDER = [
  "position",
  "schoolName",
  "school",
  "finalSchool",
  "history",
  "path",
  "grade",
  "birthYear",
  "height",
  "weight",
  "batHand",
  "throwHand",
];

type ProfileDetailRow = {
  key: string;
  label: string;
  value: string;
  /** `path` 필드 — 부모 앱 `/school/:name` 링크용 */
  pathSchools?: string[];
};

function profileDetailRowsFromApi(
  profile: PlayerApiProfile,
): ProfileDetailRow[] {
  const raw: ProfileDetailRow[] = [];
  for (const [k, v] of Object.entries(profile)) {
    if (isRealNameField(k)) continue;
    if (PROFILE_DETAIL_SKIP.has(k)) continue;
    if (k === "history" || k === "path") {
      const schools = parsePathSchools(v);
      if (schools.length === 0) continue;
      /** 부모 API는 최신 소속이 앞에 오는 경우가 있어, 이력은 과거 → 현재 순으로 표시 */
      const ordered = [...schools].reverse();
      raw.push({
        key: k,
        label: profileFieldLabelKo(k),
        value: ordered.join(" -> "),
        pathSchools: ordered,
      });
      continue;
    }
    const value = formatProfileValue(v);
    if (value === null) continue;
    raw.push({ key: k, label: profileFieldLabelKo(k), value });
  }
  raw.sort((a, b) => {
    const ia = PROFILE_KEY_ORDER.indexOf(a.key);
    const ib = PROFILE_KEY_ORDER.indexOf(b.key);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    return a.key.localeCompare(b.key, "ko");
  });
  return raw;
}

function profileDetailRowsFromGames(
  games: Game[],
  playerIdNum: number,
): ProfileDetailRow[] {
  for (const g of games) {
    const bat = findBatter(g, playerIdNum);
    if (bat?.position?.trim()) {
      return [{ key: "position", label: "포지션", value: bat.position.trim() }];
    }
    const pit = findPitcher(g, playerIdNum);
    if (pit?.position?.trim()) {
      return [{ key: "position", label: "포지션", value: pit.position.trim() }];
    }
  }
  return [];
}

export const PlayerRecordsPage: React.FC = () => {
  const { playerId: playerIdParam } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { ownerId } = useOwnerId();

  const playerIdRaw = (playerIdParam ?? "").trim();
  const playerIdNum = useMemo(() => {
    if (!/^\d+$/.test(playerIdRaw)) return NaN;
    const n = Number(playerIdRaw);
    return Number.isFinite(n) ? n : NaN;
  }, [playerIdRaw]);

  const [games, setGames] = useState<Game[]>([]);
  const [playerProfile, setPlayerProfile] = useState<PlayerApiProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const playerMeta = useMemo(() => {
    if (!Number.isFinite(playerIdNum)) return null;
    if (playerProfile) {
      const name = playerProfile.name?.trim();
      const backNumber = playerProfile.backNumber?.trim() ?? "";
      return {
        name: name || `#${playerIdNum}`,
        backNumber,
      };
    }
    for (const g of games) {
      const bat = (g.players ?? []).find((p) => p.id === playerIdNum);
      if (bat) {
        return {
          name: bat.name?.trim() || `#${playerIdNum}`,
          backNumber: bat.backNumber?.trim() ?? "",
        };
      }
      const pit = (g.pitchers ?? []).find((p) => p.id === playerIdNum);
      if (pit) {
        return {
          name: pit.name?.trim() || `#${playerIdNum}`,
          backNumber: pit.backNumber?.trim() ?? "",
        };
      }
    }
    return null;
  }, [playerProfile, games, playerIdNum]);

  useEffect(() => {
    if (!/^\d+$/.test(playerIdRaw)) {
      setLoading(false);
      setGames([]);
      setPlayerProfile(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setGames([]);
    setPlayerProfile(null);
    void Promise.all([
      getGamesByPlayerId(playerIdRaw)
        .then((data) => {
          if (!cancelled) setGames(data);
        })
        .catch(() => {
          if (!cancelled) setGames([]);
        }),
      getPlayerById(playerIdRaw).then((p) => {
        if (!cancelled) setPlayerProfile(p);
      }),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [playerIdRaw]);

  const relevantGames = useMemo(
    () =>
      Number.isFinite(playerIdNum) ? gamesWithPlayer(games, playerIdNum) : [],
    [games, playerIdNum],
  );

  const profileDetailRows = useMemo(() => {
    if (!Number.isFinite(playerIdNum)) return [];
    if (playerProfile) return profileDetailRowsFromApi(playerProfile);
    return profileDetailRowsFromGames(games, playerIdNum);
  }, [playerProfile, games, playerIdNum]);

  if (!Number.isFinite(playerIdNum)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-600">
        <p className="font-bold mb-4">선수 정보를 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-blue-600 font-bold hover:underline"
        >
          목록으로
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const displayName = playerMeta?.name ?? `#${playerIdNum}`;
  const showHeaderPlayerId =
    Number.isFinite(playerIdNum) && displayName !== `#${playerIdNum}`;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/40 mb-8 overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="pb-5 border-b border-slate-100">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>{displayName}</span>
              {playerMeta?.backNumber ? (
                <span className="text-lg font-bold text-slate-400 tabular-nums">
                  #{playerMeta.backNumber}
                </span>
              ) : null}
            </h1>
            {showHeaderPlayerId ? (
              <span className="text-[11px] font-semibold text-slate-400 tabular-nums tracking-wide">
                {playerIdNum}
              </span>
            ) : null}
          </div>
          {profileDetailRows.length > 0 ? (
            <div className="mt-5 flex flex-col gap-y-4 text-[13px] leading-relaxed sm:gap-y-3.5">
              {profileDetailRows.map((row) => (
                <div
                  key={row.key}
                  className={
                    row.key === "path"
                      ? "min-w-0"
                      : "grid grid-cols-1 gap-x-8 sm:grid-cols-[minmax(7rem,auto)_1fr]"
                  }
                >
                  {row.key === "path" ? null : (
                    <div className="text-slate-500 font-medium sm:pt-0.5">
                      {row.label}
                    </div>
                  )}
                  <div className="min-w-0 break-words text-slate-800">
                    {row.pathSchools && row.pathSchools.length > 0 ? (
                      <span className="inline-flex flex-wrap items-center gap-y-2 gap-x-0">
                        {row.pathSchools.map((schoolName, i) => (
                          <React.Fragment key={`${schoolName}-${i}`}>
                            {i > 0 ? (
                              <span
                                className="text-slate-300 select-none px-1.5 text-xs"
                                aria-hidden
                              >
                                →
                              </span>
                            ) : null}
                            <a
                              href={`/school/${encodeURIComponent(schoolName)}`}
                              className={schoolProfileLinkClassName}
                            >
                              <span className="min-w-0 break-words">
                                {schoolName}
                              </span>
                            </a>
                          </React.Fragment>
                        ))}
                      </span>
                    ) : row.key === "finalSchool" && row.value.trim() !== "" ? (
                      <a
                        href={`/school/${encodeURIComponent(row.value.trim())}`}
                        className={schoolProfileLinkClassName}
                      >
                        <span className="min-w-0 break-words">
                          {row.value.trim()}
                        </span>
                      </a>
                    ) : (
                      row.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {relevantGames.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center text-slate-500 text-sm">
          이 선수가 포함된 경기 기록이 없습니다. 경기에 타자·투수로 등록한 뒤
          저장하면 여기에 표시됩니다.
        </div>
      ) : (
        <ul className="space-y-4">
          {relevantGames.map((game) => {
            const batter = findBatter(game, playerIdNum);
            const pitcher = findPitcher(game, playerIdNum);
            const summary = summarizeInningRecords(batter?.inningRecords);
            return (
              <li key={game.id ?? game.title}>
                <button
                  type="button"
                  onClick={() => {
                    if (!ownerId) return;
                    game.id != null && navigate(`/games/${game.id}`);
                  }}
                  className="w-full text-left rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <span className="font-bold text-slate-900">
                      {game.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {game.date
                        ? new Date(game.date).toLocaleDateString("ko-KR")
                        : ""}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    {game.awayTeam} {game.awayScore} : {game.homeScore}{" "}
                    {game.homeTeam}
                  </div>

                  {batter ? (
                    <div className="text-sm border-t border-slate-100 pt-3 mt-1">
                      <span className="text-[11px] font-bold text-slate-400 tracking-wide">
                        타격
                      </span>
                      <p className="text-slate-700 mt-1">
                        {batter.team === "HOME" ? "홈" : "원정"} · 타순{" "}
                        {batter.lineupOrder ?? "—"}
                      </p>
                      {summary ? (
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          {summary}
                        </p>
                      ) : (
                        <p className="text-slate-400 text-xs mt-1 italic">
                          타석 기록 없음
                        </p>
                      )}
                    </div>
                  ) : null}

                  {pitcher ? (
                    <div
                      className={`text-sm ${batter ? "border-t border-slate-100 pt-3 mt-3" : "border-t border-slate-100 pt-3 mt-1"}`}
                    >
                      <span className="text-[11px] font-bold text-slate-400 tracking-wide">
                        투구
                      </span>
                      <p className="text-slate-700 mt-1">
                        {pitcher.team === "HOME" ? "홈" : "원정"} · 이닝{" "}
                        {outsToDisplayString(pitcher.pitchingOuts ?? 0)}
                      </p>
                      <p className="text-slate-600 mt-1 text-xs tabular-nums">
                        안타 {pitcher.hitsAllowed ?? 0} · 실점{" "}
                        {pitcher.runsAllowed ?? 0} · 4구 {pitcher.walks ?? 0} ·
                        삼진 {pitcher.strikeouts ?? 0} · 홈런{" "}
                        {pitcher.homeRunsAllowed ?? 0}
                      </p>
                    </div>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
