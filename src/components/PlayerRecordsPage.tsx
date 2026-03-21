import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGames } from "../api";
import type { Game, PitcherRecord, Player } from "../types";
import { useOwnerId } from "../ownerId-store";
import { useMyTeam } from "../my-team-store";
import { parseSchoolPlayerId } from "../school-api";
import { batResultCodeToLabelKo } from "../constants/batResult";
import { outsToDisplayString } from "../utils/pitchingInnings";

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
  return games.filter((g) => findBatter(g, playerId) || findPitcher(g, playerId));
}

export const PlayerRecordsPage: React.FC = () => {
  const { playerId: playerIdParam } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { ownerId } = useOwnerId();
  const myTeam = useMyTeam();

  const playerId = useMemo(() => {
    const n = Number.parseInt(playerIdParam ?? "", 10);
    return Number.isFinite(n) ? n : NaN;
  }, [playerIdParam]);

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const playerMeta = useMemo(() => {
    const sp = myTeam.players.find((p) => parseSchoolPlayerId(p) === playerId);
    if (!sp) return null;
    return {
      name: sp.name?.trim() || `#${playerId}`,
      backNumber: sp.backNumber?.trim() ?? "",
    };
  }, [myTeam.players, playerId]);

  useEffect(() => {
    if (!ownerId || !Number.isFinite(playerId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getGames(ownerId)
      .then((data) => {
        if (!cancelled) setGames(data);
      })
      .catch(() => {
        if (!cancelled) setGames([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId, playerId]);

  const relevantGames = useMemo(
    () => (Number.isFinite(playerId) ? gamesWithPlayer(games, playerId) : []),
    [games, playerId],
  );

  if (!Number.isFinite(playerId)) {
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

  const displayName = playerMeta?.name ?? `#${playerId}`;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-6 text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1"
      >
        ← 경기 목록
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {displayName}
          {playerMeta?.backNumber ? (
            <span className="text-lg font-bold text-slate-500 ml-2">
              #{playerMeta.backNumber}
            </span>
          ) : null}
        </h1>
        <p className="text-sm text-slate-500 mt-1">등록된 경기별 개인 기록</p>
      </div>

      {relevantGames.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center text-slate-500 text-sm">
          이 선수가 포함된 경기 기록이 없습니다. 경기에 타자·투수로 등록한 뒤
          저장하면 여기에 표시됩니다.
        </div>
      ) : (
        <ul className="space-y-4">
          {relevantGames.map((game) => {
            const batter = findBatter(game, playerId);
            const pitcher = findPitcher(game, playerId);
            const summary = summarizeInningRecords(batter?.inningRecords);
            return (
              <li key={game.id ?? game.title}>
                <button
                  type="button"
                  onClick={() => game.id != null && navigate(`/games/${game.id}`)}
                  className="w-full text-left rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <span className="font-bold text-slate-900">{game.title}</span>
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
