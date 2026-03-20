import React, { useState, useEffect, useMemo } from "react";
import { Game, Inning, Player, TeamLineScoreboard } from "../types";
import { updateGame } from "../api";
import { useMyTeam } from "../my-team-store";
import { getMyTeamDisplayName } from "../myTeamDisplayName";
import { parseSchoolPlayerId } from "../school-api";
import { normalizeRosterSchoolPlayerIds } from "../normalizeRosterSchoolPlayerIds";
import { PlayerInningRecordsModal } from "./PlayerInningRecordsModal";

function padInningRecords(records?: string[]): string[] {
  const out = [...(records ?? [])];
  while (out.length < 9) out.push("");
  return out.slice(0, 9);
}

/** 모달에 저장한 회별 기록을 쉼표로 이어 한 줄 요약 */
function summarizeInningRecords(records?: string[]): string {
  return (records ?? [])
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
}

function lineFromInnings(
  innings: Inning[],
  team: "HOME" | "AWAY",
): TeamLineScoreboard {
  const targetSide = team === "HOME" ? "BOTTOM" : "TOP";
  const rows = innings.filter((inn) => inn.topBottom === targetSide);
  const sum = (field: "runs" | "hits" | "errors" | "balls") =>
    rows.reduce((s, inn) => s + (inn[field] ?? 0), 0);
  return {
    runs: sum("runs"),
    hits: sum("hits"),
    errors: sum("errors"),
    balls: sum("balls"),
  };
}

/** 내 팀이 HOME/AWAY 중 어디인지 — 경기 이름표와 스토어 학교명으로 매칭, 실패 시 명단 다수 기준. */
function resolveMyTeamSide(
  game: Game,
  myTeamLabel: string,
  rosterPlayers: Player[],
): "HOME" | "AWAY" {
  const m = myTeamLabel.trim();
  const h = game.homeTeam.trim();
  const a = game.awayTeam.trim();
  if (h === m) return "HOME";
  if (a === m) return "AWAY";
  const home = rosterPlayers.filter((p) => p.team === "HOME").length;
  const away = rosterPlayers.filter((p) => p.team === "AWAY").length;
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  if (rosterPlayers[0]) return rosterPlayers[0].team;
  return "HOME";
}

interface Props {
  game: Game;
  onBack: () => void;
}

const TOTAL_INNINGS = 9;

export const Scoreboard: React.FC<Props> = ({ game: initialGame, onBack }) => {
  const [game, setGame] = useState<Game>(initialGame);
  const [innings, setInnings] = useState<Inning[]>(initialGame.innings || []);
  const [players, setPlayers] = useState<Player[]>(initialGame.players || []);
  const [isSaving, setIsSaving] = useState(false);
  const [awayLine, setAwayLine] = useState<TeamLineScoreboard>(
    () =>
      initialGame.awayLineScoreboard ??
      lineFromInnings(initialGame.innings ?? [], "AWAY"),
  );
  const [homeLine, setHomeLine] = useState<TeamLineScoreboard>(
    () =>
      initialGame.homeLineScoreboard ??
      lineFromInnings(initialGame.innings ?? [], "HOME"),
  );
  const myTeam = useMyTeam();
  const myTeamLabel = getMyTeamDisplayName(myTeam);
  const myTeamSide = useMemo(
    () => resolveMyTeamSide(game, myTeamLabel, players),
    [game, myTeamLabel, players],
  );

  /** 학교에 등록된 선수만 — id는 `parseSchoolPlayerId`로 통일 */
  const schoolPlayersForPick = useMemo(() => {
    const rows: {
      id: number;
      name: string;
      backNumber: string;
      position: string;
    }[] = [];
    for (const sp of myTeam.players) {
      const id = parseSchoolPlayerId(sp);
      if (id == null) continue;
      rows.push({
        id,
        name: sp.name?.trim() || `#${id}`,
        backNumber: sp.backNumber?.trim() ?? "",
        position: sp.position?.trim() || "",
      });
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return rows;
  }, [myTeam.players]);

  const schoolPlayerIdsKey = useMemo(
    () =>
      schoolPlayersForPick
        .map((r) => r.id)
        .sort((a, b) => a - b)
        .join(","),
    [schoolPlayersForPick],
  );

  useEffect(() => {
    if (myTeam.loading || !schoolPlayerIdsKey) return;
    setPlayers((prev) => normalizeRosterSchoolPlayerIds(prev, myTeam.players));
  }, [schoolPlayerIdsKey, myTeam.loading, myTeam.players]);

  const availableSchoolPlayers = useMemo(
    () =>
      schoolPlayersForPick.filter((sp) => !players.some((p) => p.id === sp.id)),
    [schoolPlayersForPick, players],
  );

  const [selectedSchoolPlayerId, setSelectedSchoolPlayerId] = useState("");
  const [modalPlayerIndex, setModalPlayerIndex] = useState<number | null>(null);
  const [draftInningRecords, setDraftInningRecords] = useState<string[]>(() =>
    Array(9).fill(""),
  );

  const openPlayerRecordModal = (idx: number) => {
    setDraftInningRecords(padInningRecords(players[idx]?.inningRecords));
    setModalPlayerIndex(idx);
  };

  const savePlayerInningRecords = () => {
    if (modalPlayerIndex === null) return;
    setPlayers((prev) =>
      prev.map((pl, i) =>
        i === modalPlayerIndex
          ? { ...pl, inningRecords: padInningRecords(draftInningRecords) }
          : pl,
      ),
    );
    setModalPlayerIndex(null);
  };

  const closePlayerRecordModal = () => {
    setModalPlayerIndex(null);
  };

  // Initialize innings grid if empty
  useEffect(() => {
    if (!innings || innings.length === 0) {
      const newInnings: Inning[] = [];
      for (let i = 1; i <= TOTAL_INNINGS; i++) {
        newInnings.push({
          inningNumber: i,
          topBottom: "TOP",
          runs: 0,
          hits: 0,
          errors: 0,
          balls: 0,
        });
        newInnings.push({
          inningNumber: i,
          topBottom: "BOTTOM",
          runs: 0,
          hits: 0,
          errors: 0,
          balls: 0,
        });
      }
      setInnings(newInnings);
      setAwayLine(lineFromInnings(newInnings, "AWAY"));
      setHomeLine(lineFromInnings(newInnings, "HOME"));
    }
  }, []);

  const handleScoreChange = (
    inningNumber: number,
    topBottom: "TOP" | "BOTTOM",
    field: keyof Inning,
    value: number,
  ) => {
    setInnings((prev) =>
      prev.map((inn) =>
        inn.inningNumber === inningNumber && inn.topBottom === topBottom
          ? { ...inn, [field]: value }
          : inn,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedGame = await updateGame(game.id!, {
        ...game,
        homeScore: homeLine.runs,
        awayScore: awayLine.runs,
        awayLineScoreboard: awayLine,
        homeLineScoreboard: homeLine,
        innings,
        players,
      });
      setGame(updatedGame);
      setAwayLine(
        updatedGame.awayLineScoreboard ??
          lineFromInnings(updatedGame.innings ?? [], "AWAY"),
      );
      setHomeLine(
        updatedGame.homeLineScoreboard ??
          lineFromInnings(updatedGame.innings ?? [], "HOME"),
      );
      setPlayers(
        normalizeRosterSchoolPlayerIds(
          updatedGame.players || [],
          myTeam.players,
        ),
      );
      alert("Saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Error saving game");
    } finally {
      setIsSaving(false);
    }
  };

  const getInningData = (num: number, side: "TOP" | "BOTTOM") => {
    return (
      innings.find((i) => i.inningNumber === num && i.topBottom === side) || {
        runs: 0,
        hits: 0,
        errors: 0,
        balls: 0,
      }
    );
  };

  const reorderRosterPlayer = (from: number, to: number) => {
    setPlayers((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next.map((p, i) => ({ ...p, lineupOrder: i + 1 }));
    });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-blue-600 flex items-center transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Games List
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {game.title}
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            {new Date(game.date!).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-100 flex items-center gap-2"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Save All
            </>
          )}
        </button>
      </div>

      {/* Main Scoreboard UI */}
      <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
        <div className="grid grid-cols-[1fr_repeat(9,auto)_repeat(4,auto)] text-center items-center">
          {/* Header Row */}
          <div className="p-4 text-left font-bold text-slate-500 text-xs uppercase tracking-widest">
            Team
          </div>
          {[...Array(TOTAL_INNINGS)].map((_, i) => (
            <div
              key={i}
              className="text-xs font-bold text-slate-500 border-l border-slate-800"
            >
              {i + 1}
            </div>
          ))}
          <div className="font-black text-amber-400 border-l-2 border-slate-700">
            R
          </div>
          <div className="font-bold text-slate-400 border-l border-slate-800">
            H
          </div>
          <div className="font-bold text-slate-400 border-l border-slate-800">
            E
          </div>
          <div className="font-bold text-slate-400 border-l border-slate-800">
            B
          </div>

          {/* Away Team Row */}
          <div className="p-4 text-left border-t border-slate-800">
            <span className="text-lg font-black tracking-tighter">
              {game.awayTeam}
            </span>
          </div>
          {[...Array(TOTAL_INNINGS)].map((_, i) => (
            <div
              key={i}
              className="border-l border-t border-slate-800 bg-slate-800/30"
            >
              <input
                type="number"
                min="0"
                className="w-12 h-12 bg-transparent text-center font-mono text-xl font-bold focus:bg-blue-900/40 outline-none transition"
                value={getInningData(i + 1, "TOP").runs}
                onChange={(e) =>
                  handleScoreChange(
                    i + 1,
                    "TOP",
                    "runs",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>
          ))}
          <div className=" border-l-2 border-t border-slate-700 bg-slate-800/50 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[4.5rem] bg-transparent text-center font-mono text-3xl font-black text-amber-400 focus:bg-blue-900/40 outline-none rounded px-1"
              value={awayLine.runs}
              onChange={(e) =>
                setAwayLine((prev) => ({
                  ...prev,
                  runs: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
          <div className="border-l border-t border-slate-800 bg-slate-800/20 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[3.5rem] bg-transparent text-center font-mono text-xl font-bold text-slate-300 focus:bg-blue-900/40 outline-none rounded px-1"
              value={awayLine.hits}
              onChange={(e) =>
                setAwayLine((prev) => ({
                  ...prev,
                  hits: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
          <div className="border-l border-t border-slate-800 bg-slate-800/20 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[3.5rem] bg-transparent text-center font-mono text-xl font-bold text-slate-300 focus:bg-blue-900/40 outline-none rounded px-1"
              value={awayLine.errors}
              onChange={(e) =>
                setAwayLine((prev) => ({
                  ...prev,
                  errors: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
          <div className="border-l border-t border-slate-800 bg-slate-800/20 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[3.5rem] bg-transparent text-center font-mono text-xl font-bold text-slate-300 focus:bg-blue-900/40 outline-none rounded px-1"
              value={awayLine.balls}
              onChange={(e) =>
                setAwayLine((prev) => ({
                  ...prev,
                  balls: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>

          {/* Home Team Row */}
          <div className="p-4 text-left border-t border-slate-800">
            <span className="text-lg font-black tracking-tighter">
              {game.homeTeam}
            </span>
          </div>
          {[...Array(TOTAL_INNINGS)].map((_, i) => (
            <div
              key={i}
              className="border-l border-t border-slate-800 bg-slate-800/30"
            >
              <input
                type="number"
                min="0"
                className="w-12 h-12 bg-transparent text-center font-mono text-xl font-bold focus:bg-blue-900/40 outline-none transition"
                value={getInningData(i + 1, "BOTTOM").runs}
                onChange={(e) =>
                  handleScoreChange(
                    i + 1,
                    "BOTTOM",
                    "runs",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>
          ))}
          <div className="border-l-2 border-t border-slate-700 bg-slate-800/50 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[4.5rem] bg-transparent text-center font-mono text-3xl font-black text-amber-400 focus:bg-blue-900/40 outline-none rounded px-1"
              value={homeLine.runs}
              onChange={(e) =>
                setHomeLine((prev) => ({
                  ...prev,
                  runs: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
          <div className="border-l border-t border-slate-800 bg-slate-800/20 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[3.5rem] bg-transparent text-center font-mono text-xl font-bold text-slate-300 focus:bg-blue-900/40 outline-none rounded px-1"
              value={homeLine.hits}
              onChange={(e) =>
                setHomeLine((prev) => ({
                  ...prev,
                  hits: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
          <div className="border-l border-t border-slate-800 bg-slate-800/20 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[3.5rem] bg-transparent text-center font-mono text-xl font-bold text-slate-300 focus:bg-blue-900/40 outline-none rounded px-1"
              value={homeLine.errors}
              onChange={(e) =>
                setHomeLine((prev) => ({
                  ...prev,
                  errors: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
          <div className="border-l border-t border-slate-800 bg-slate-800/20 flex items-center justify-center min-h-[3.5rem]">
            <input
              type="number"
              min={0}
              className="w-full max-w-[3.5rem] bg-transparent text-center font-mono text-xl font-bold text-slate-300 focus:bg-blue-900/40 outline-none rounded px-1"
              value={homeLine.balls}
              onChange={(e) =>
                setHomeLine((prev) => ({
                  ...prev,
                  balls: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Roster Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-700">Player Roster</h3>
            <div className="text-xs text-gray-400">Total: {players.length}</div>
          </div>

          <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2">
            {players.map((p, idx) => {
              const recordsSummary = summarizeInningRecords(p.inningRecords);
              return (
                <div
                  key={p.id != null ? `id-${p.id}` : `row-${idx}-${p.name}`}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                >
                  <span
                    className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full font-bold text-white ${p.team === "HOME" ? "bg-indigo-500" : "bg-orange-500"}`}
                  >
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => openPlayerRecordModal(idx)}
                    className="flex-1 min-w-0 text-left rounded-lg px-1 py-0.5 -mx-1 hover:bg-gray-200/90 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 break-words">
                      <span className="font-bold text-gray-900">{p.name}</span>
                      {recordsSummary ? (
                        <span className="text-[13px] font-normal text-gray-500 leading-snug">
                          {recordsSummary}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-medium">
                      {p.position} • {p.team}
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={idx === 0}
                      onClick={() => reorderRosterPlayer(idx, idx - 1)}
                      className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={idx === players.length - 1}
                      onClick={() => reorderRosterPlayer(idx, idx + 1)}
                      className="rounded px-1.5 py-0.5 text-xs font-bold text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPlayers((prev) => {
                        const filtered = prev.filter((_, i) => i !== idx);
                        return filtered.map((row, i) => ({
                          ...row,
                          lineupOrder: i + 1,
                        }));
                      })
                    }
                    className="text-gray-300 hover:text-red-500 transition shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
            {players.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs italic border-2 border-dashed rounded-xl">
                No players registered.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-500">
              추가: 우리 팀{" "}
              <span className="font-semibold text-gray-700">
                {myTeamSide === "HOME" ? game.homeTeam : game.awayTeam}
              </span>{" "}
              ({myTeamSide === "HOME" ? "HOME" : "AWAY"}) · 학교 등록 선수만
            </p>
            {myTeam.loading ? (
              <p className="text-xs text-gray-400">
                학교 선수 목록을 불러오는 중…
              </p>
            ) : schoolPlayersForPick.length === 0 ? (
              <p className="text-xs text-amber-600">
                학교에 등록된 선수가 없거나, 선수 ID를 확인할 수 없습니다.
              </p>
            ) : (
              <>
                <select
                  value={selectedSchoolPlayerId}
                  onChange={(e) => setSelectedSchoolPlayerId(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400"
                >
                  <option value="">선수 선택</option>
                  {availableSchoolPlayers.map((sp) => (
                    <option key={sp.id} value={String(sp.id)}>
                      {sp.name}
                      {sp.backNumber ? ` · #${sp.backNumber}` : ""}
                    </option>
                  ))}
                </select>
                {availableSchoolPlayers.length === 0 && (
                  <p className="text-xs text-gray-400">
                    추가할 학교 선수가 없습니다. (이미 명단에 모두 포함됨)
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const team = myTeamSide;
                    const pid = Number.parseInt(selectedSchoolPlayerId, 10);
                    if (!Number.isFinite(pid)) return;
                    const sp = schoolPlayersForPick.find((s) => s.id === pid);
                    if (!sp) return;
                    if (players.some((p) => p.id === pid)) {
                      alert("This player is already in the roster.");
                      return;
                    }
                    setPlayers([
                      ...players,
                      {
                        id: sp.id,
                        name: sp.name,
                        backNumber: sp.backNumber,
                        team,
                        position: sp.position,
                        lineupOrder: players.length + 1,
                      },
                    ]);
                    setSelectedSchoolPlayerId("");
                  }}
                  disabled={
                    selectedSchoolPlayerId === "" ||
                    availableSchoolPlayers.length === 0
                  }
                  className="w-full bg-gray-800 text-white text-sm font-bold py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Player
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <PlayerInningRecordsModal
        open={modalPlayerIndex !== null}
        playerName={
          modalPlayerIndex !== null && players[modalPlayerIndex]
            ? players[modalPlayerIndex]!.name
            : ""
        }
        values={draftInningRecords}
        onChange={setDraftInningRecords}
        onClose={closePlayerRecordModal}
        onSave={savePlayerInningRecords}
      />
    </div>
  );
};
