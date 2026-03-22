import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGame } from "../api";
import { setLineupForGame } from "../lineup-store";
import { buildSchoolPlayerByIdMap, useMyTeam } from "../my-team-store";
import { getMyTeamDisplayName } from "../myTeamDisplayName";
import { useOpponentTeamInput } from "../hooks/useOpponentTeamInput";
import { useMyTeamHomeAway } from "../hooks/useMyTeamHomeAway";
import { useEntryRosterSelection } from "../hooks/useEntryRosterSelection";
import { useTeamEntryOrder } from "../hooks/useTeamEntryOrder";
import { buildDefaultEntryOrderByGrade } from "../schoolPlayerGrade";
import type { Player } from "../types";

interface Props {
  ownerId: string | null;
}

type WizardStep = 1 | 2 | 3;
type EntrySubStep = "select" | "order";

export const NewGameForm: React.FC<Props> = ({ ownerId }) => {
  const navigate = useNavigate();
  const myTeam = useMyTeam();

  const [step, setStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const opponent = useOpponentTeamInput();
  const { myTeamSide, setMyTeamSide } = useMyTeamHomeAway();

  /** 전역 스토어 `myTeam.players` → id 맵 (학교 선수 API와 동일 소스) */
  const schoolPlayerById = useMemo(
    () => buildSchoolPlayerByIdMap(myTeam.players),
    [myTeam.players],
  );

  const myRosterPlayerIds = useMemo(
    () => Array.from(schoolPlayerById.keys()),
    [schoolPlayerById],
  );

  const rosterPlayers = useMemo(
    () => Array.from(schoolPlayerById.values()),
    [schoolPlayerById],
  );

  const entrySelection = useEntryRosterSelection(rosterPlayers);

  /** 순서 조정 단계에서만 채움 — 학년·이름순 기본 라인업 */
  const [lineupOrderSeed, setLineupOrderSeed] = useState<number[] | null>(null);
  const [entrySubStep, setEntrySubStep] = useState<EntrySubStep>("select");

  const entryOrder = useTeamEntryOrder(lineupOrderSeed ?? []);

  const goToLineupOrder = () => {
    const ids = entrySelection.selectedIds;
    if (ids.length === 0) return;
    const ordered = buildDefaultEntryOrderByGrade(
      ids,
      (id) => schoolPlayerById.get(id),
      new Date(),
    );
    setLineupOrderSeed(ordered);
    setEntrySubStep("order");
  };

  const backToEntrySelection = () => {
    setLineupOrderSeed(null);
    setEntrySubStep("select");
  };

  /** 내 팀 이름은 스토어(부모 API) 기준 — 입력으로 수정하지 않음 */
  const myTeamLabel = getMyTeamDisplayName(myTeam);

  const canGoStep2 = opponent.isValid && title.trim().length > 0;
  const canSubmit =
    canGoStep2 &&
    (myRosterPlayerIds.length === 0 ||
      (entrySubStep === "order" &&
        lineupOrderSeed != null &&
        entryOrder.orderedIds.length > 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId) return;
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const opp = opponent.trimmedOpponentName;
      const homeTeam = myTeamSide === "HOME" ? myTeamLabel : opp;
      const awayTeam = myTeamSide === "HOME" ? opp : myTeamLabel;

      const players: Player[] = entryOrder.orderedIds.map((pid, idx) => {
        const src = schoolPlayerById.get(pid);
        return {
          id: pid,
          name: src?.name ?? "",
          team: myTeamSide,
          position: src?.position?.trim() || "대기",
          backNumber: src?.backNumber?.trim() || String(idx + 1),
          lineupOrder: idx + 1,
        };
      });

      const newGame = await createGame({
        ownerId,
        title: title.trim(),
        homeTeam,
        awayTeam,
        players,
        status: "IN_PROGRESS",
      });
      if (newGame.id != null) {
        setLineupForGame(newGame.id, players);
        navigate(`/games/${newGame.id}`);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert("경기를 시작하지 못했습니다. 네트워크를 확인해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === 1 && !canGoStep2) return;
    if (step === 2) {
      setEntrySubStep("select");
      setLineupOrderSeed(null);
    }
    if (step < 3) setStep((s) => (s + 1) as WizardStep);
  };

  const goBack = () => {
    if (step === 3 && entrySubStep === "order") {
      backToEntrySelection();
      return;
    }
    if (step > 1) {
      if (step === 3) {
        setEntrySubStep("select");
        setLineupOrderSeed(null);
      }
      setStep((s) => (s - 1) as WizardStep);
    } else navigate("/");
  };

  return (
    <div className="max-w-xl mx-auto px-4">
      <button
        type="button"
        onClick={() => (step === 1 ? navigate("/") : goBack())}
        className="mb-6 text-gray-400 hover:text-gray-600 flex items-center text-sm font-bold transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        {step === 1 ? "취소하고 목록으로" : "이전"}
      </button>

      <div className="mb-4 flex gap-2 text-xs font-bold text-gray-400">
        <span className={step === 1 ? "text-blue-600" : ""}>① 상대팀</span>
        <span>→</span>
        <span className={step === 2 ? "text-blue-600" : ""}>② 홈/어웨이</span>
        <span>→</span>
        <span className={step === 3 ? "text-blue-600" : ""}>③ 엔트리</span>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-2xl font-black tracking-tight mb-2">
            새 경기 시작
          </h2>
          <p className="text-blue-100 text-sm opacity-80">
            {step === 1 && "상대 팀 이름과 경기 제목을 입력하세요."}
            {step === 2 && "우리 팀이 홈인지 어웨이인지 선택하세요."}
            {step === 3 &&
              myTeam.loading &&
              "팀 선수 정보를 불러오는 중입니다."}
            {step === 3 &&
              !myTeam.loading &&
              myRosterPlayerIds.length === 0 &&
              "동일 학교 선수가 없으면 엔트리 없이 경기만 시작할 수 있습니다."}
            {step === 3 &&
              !myTeam.loading &&
              myRosterPlayerIds.length > 0 &&
              entrySubStep === "select" &&
              "학년별로 묶어서 엔트리에 넣을 선수를 먼저 선택하세요."}
            {step === 3 &&
              !myTeam.loading &&
              myRosterPlayerIds.length > 0 &&
              entrySubStep === "order" &&
              "선택한 선수의 라인업 순서를 조정합니다 (위/아래 버튼)."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                  경기 제목
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="예: 2024 봄 대회 결승"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                  상대팀 이름
                </label>
                <input
                  type="text"
                  required
                  value={opponent.opponentName}
                  onChange={(e) => opponent.setOpponentName(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="상대 학교 / 팀명"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoStep2}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">
                  우리 팀: <span className="text-blue-600">{myTeamLabel}</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMyTeamSide("HOME")}
                    className={`rounded-2xl border-2 py-4 font-black ${
                      myTeamSide === "HOME"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-600"
                    }`}
                  >
                    홈
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyTeamSide("AWAY")}
                    className={`rounded-2xl border-2 py-4 font-black ${
                      myTeamSide === "AWAY"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-600"
                    }`}
                  >
                    원정
                  </button>
                </div>
              </div>
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-gray-500 font-bold px-4 py-2"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
                >
                  다음
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {myTeam.loading ? (
                <p className="text-sm text-gray-500">
                  팀 선수 목록 불러오는 중…
                </p>
              ) : myRosterPlayerIds.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-4">
                  등록된 동일 학교 선수가 없습니다. 그대로 경기만 생성합니다.
                </p>
              ) : entrySubStep === "select" ? (
                <div className="space-y-6">
                  <p className="text-xs text-gray-500">
                    출생연도·학년은 부모 API 필드 기준으로 묶입니다. 없으면
                    「기타」에 표시됩니다.
                  </p>
                  {entrySelection.groups.map((group) => (
                    <div key={String(group.gradeKey)}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-sm font-black text-blue-600">
                          {group.label}
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            entrySelection.toggleGroup(group.gradeKey)
                          }
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          {entrySelection.getGroupSelectionState(
                            group.gradeKey,
                          ) === "all"
                            ? "선택 해제"
                            : "전체 선택"}
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {group.playerIds.map((pid) => {
                          const schoolPlayer = schoolPlayerById.get(pid);
                          const label = schoolPlayer?.name?.trim() || `#${pid}`;
                          console.log(
                            schoolPlayer?.backNumber,
                            schoolPlayer?.position,
                          );
                          const meta =
                            !schoolPlayer?.backNumber && !schoolPlayer?.position
                              ? undefined
                              : [
                                  schoolPlayer?.backNumber
                                    ? `#${schoolPlayer.backNumber}`
                                    : null,
                                  schoolPlayer?.position
                                    ? `(${schoolPlayer.position})`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ");
                          return (
                            <li
                              key={pid}
                              className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
                            >
                              <input
                                type="checkbox"
                                id={`entry-${pid}`}
                                checked={entrySelection.isSelected(pid)}
                                onChange={() => entrySelection.toggle(pid)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`entry-${pid}`}
                                className="flex-1 min-w-0 cursor-pointer"
                              >
                                <div className="font-bold text-gray-800 truncate">
                                  {label}
                                </div>
                                {meta ? (
                                  <div className="text-[11px] text-gray-500 truncate">
                                    {meta}
                                  </div>
                                ) : null}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={goToLineupOrder}
                    disabled={entrySelection.selectedIds.length === 0}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black disabled:opacity-50"
                  >
                    라인업 순서 정하기
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={backToEntrySelection}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      선수 다시 선택
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {entryOrder.orderedIds.map((pid, index) => {
                      const schoolPlayer = schoolPlayerById.get(pid);
                      const label = schoolPlayer?.name?.trim() || `#${pid}`;
                      const meta =
                        !schoolPlayer?.backNumber && !schoolPlayer?.position
                          ? undefined
                          : [
                              schoolPlayer?.backNumber
                                ? `#${schoolPlayer.backNumber}`
                                : null,
                              schoolPlayer?.position,
                            ]
                              .filter(Boolean)
                              .join(" · ");
                      return (
                        <li
                          key={pid}
                          className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3"
                        >
                          <span className="text-xs font-black text-gray-400 w-6">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 truncate">
                              {label}
                            </div>
                            {meta ? (
                              <div className="text-[11px] text-gray-500 truncate">
                                {meta}
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            aria-label="위로"
                            disabled={index === 0}
                            onClick={() => entryOrder.moveUp(index)}
                            className="px-2 py-1 text-sm rounded bg-white border disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label="아래로"
                            disabled={
                              index === entryOrder.orderedIds.length - 1
                            }
                            onClick={() => entryOrder.moveDown(index)}
                            className="px-2 py-1 text-sm rounded bg-white border disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-gray-500 font-bold px-4 py-2"
                >
                  이전
                </button>
                {myRosterPlayerIds.length === 0 || entrySubStep === "order" ? (
                  <button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="bg-blue-600 text-white rounded-2xl px-8 py-4 text-xl font-black shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? "시작하는 중…" : "기록 시작하기"}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 max-w-[140px] text-right">
                    선수 선택 후 「라인업 순서 정하기」를 누르세요
                  </span>
                )}
              </div>
              <p className="text-center text-gray-400 text-xs">
                경기 시작 후에도 선수를 더 등록할 수 있습니다.
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
