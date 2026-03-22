import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGames, deleteGame } from "../api";
import { Game } from "../types";
import { useOwnerId } from "../ownerId-store";
import { useMyTeam } from "../my-team-store";
import { parseSchoolPlayerId } from "../school-api";

export const GameList: React.FC = () => {
  const navigate = useNavigate();
  const { ownerId } = useOwnerId();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  /** 학교 정보·학교 선수 리스트 — 전역 MyTeam 스토어만 사용 */
  const myTeam = useMyTeam();

  useEffect(() => {
    loadGames();
  }, [ownerId]);

  const loadGames = async () => {
    if (!ownerId) return;
    try {
      const data = await getGames(ownerId);
      setGames(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("이 경기 기록을 삭제할까요?")) {
      await deleteGame(id);
      loadGames();
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
        <div className="text-xs text-gray-500 mb-2">
          {myTeam.loading ? (
            "학교 정보 로딩중..."
          ) : myTeam.school ? (
            <a
              href={myTeam.school.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline font-bold"
            >
              {myTeam.school.name}
              <span className="text-gray-400 font-bold">
                {" "}
                {myTeam.school.category_label
                  ? "• " + myTeam.school.category_label
                  : ""}{" "}
                • {myTeam.school.region}
              </span>
            </a>
          ) : (
            <span className="text-gray-400">학교 정보 없음</span>
          )}
        </div>
        {!myTeam.loading && myTeam.players.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="mb-2">
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                아래 선수를 누르면, 해당 선수로 등록된 경기의{" "}
                <span className="text-slate-600 font-semibold">
                  개인 기록(타격·투구)
                </span>
                를 볼 수 있습니다.
              </p>
            </div>
            <ul className="flex flex-wrap gap-2 text-xs text-slate-700">
              {myTeam.players.map((p, idx) => {
                const schoolId = parseSchoolPlayerId(p);
                return (
                  <li key={p.id ?? `p-${idx}`}>
                    <button
                      type="button"
                      disabled={schoolId == null}
                      onClick={() => {
                        if (schoolId != null) navigate(`/players/${schoolId}`);
                      }}
                      className={`rounded-full px-3 py-1 font-medium transition ${
                        schoolId != null
                          ? "bg-slate-100 text-slate-800 cursor-pointer hover:bg-slate-200 hover:text-slate-900"
                          : "bg-slate-50 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {p.name ?? `#${p.id ?? "?"}`}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            경기 기록
          </h2>
          <p className="text-gray-500 text-sm">
            야구 경기 기록을 관리하고 확인합니다.
          </p>
        </div>
        <button
          onClick={() => navigate("/games/new")}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          새 경기
        </button>
      </div>
      <div className="grid gap-6">
        {games.map((game) => {
          return (
            <div
              key={game.id}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
              onClick={() => game.id != null && navigate(`/games/${game.id}`)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-[10px] font-black tracking-widest rounded-full ${game.status === "FINISHED" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700 animate-pulse"}`}
                    >
                      {game.status === "FINISHED" ? "종료" : "진행 중"}
                    </span>
                    <span className="text-xs font-bold text-gray-300 italic">
                      {new Date(game.date!).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(game.id!);
                    }}
                    className="text-gray-200 hover:text-red-500 p-2 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-6">
                  {game.title}
                </h3>

                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div className="flex-1 text-center px-2">
                    <div className="text-[10px] font-bold text-gray-400 mb-1">
                      홈
                    </div>
                    <div className="text-lg font-black text-gray-800 truncate">
                      {game.homeTeam}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 px-6 border-x border-gray-200">
                    <span className="text-4xl font-black text-slate-900">
                      {game.homeScore}
                    </span>
                    <span className="text-gray-300 font-bold">:</span>
                    <span className="text-4xl font-black text-slate-900">
                      {game.awayScore}
                    </span>
                  </div>

                  <div className="flex-1 text-center px-2">
                    <div className="text-[10px] font-bold text-gray-400 mb-1">
                      원정
                    </div>
                    <div className="text-lg font-black text-gray-800 truncate">
                      {game.awayTeam}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 px-6 py-3 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-400">
                <span>등록 선수 {game.players?.length || 0}명</span>
                <span className="flex items-center gap-1 text-blue-500">
                  상세 보기
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            </div>
          );
        })}

        {games.length === 0 && (
          <div className="bg-white rounded-3xl border-4 border-dashed border-gray-100 p-20 text-center">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              아직 경기가 없습니다
            </h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">
              첫 경기를 만들고 득점·안타 등 기록을 남겨 보세요.
            </p>
            <button
              onClick={() => navigate("/games/new")}
              className="text-blue-600 font-bold hover:underline"
            >
              새 경기 기록 만들기 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
