import React from "react";
import { BatResult, BAT_RESULT_LABEL_KO } from "../constants/batResult";

const INNINGS = 9;

const BAT_RESULT_ORDER = Object.keys(BatResult) as (keyof typeof BatResult)[];

const batResultValueSet = new Set<string>(Object.values(BatResult));

export interface PlayerInningRecordsModalProps {
  open: boolean;
  playerName: string;
  /** 길이 9 — 인덱스 0 = 1회 */
  values: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
  onSave: () => void;
}

export const PlayerInningRecordsModal: React.FC<
  PlayerInningRecordsModalProps
> = ({ open, playerName, values, onChange, onClose, onSave }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-inning-records-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center gap-3">
          <h2
            id="player-inning-records-title"
            className="font-bold text-lg text-gray-900 truncate"
          >
            개인 기록 · {playerName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-xl leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-2">
          <p className="text-xs text-gray-500 mb-3">
            1회부터 9회까지 타석 결과를 선택하세요.
          </p>
          {Array.from({ length: INNINGS }, (_, i) => {
            const raw = values[i] ?? "";
            const isLegacy = raw !== "" && !batResultValueSet.has(raw);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-11 shrink-0 text-sm font-bold text-slate-600 tabular-nums">
                  {i + 1}회
                </span>
                <select
                  value={raw}
                  onChange={(e) => {
                    const next = [...values];
                    while (next.length < INNINGS) next.push("");
                    next[i] = e.target.value;
                    onChange(next.slice(0, INNINGS));
                  }}
                  className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 bg-white"
                >
                  <option value="">선택</option>
                  {isLegacy ? (
                    <option value={raw}>{raw} (기존)</option>
                  ) : null}
                  {BAT_RESULT_ORDER.map((key) => (
                    <option key={key} value={BatResult[key]}>
                      {BAT_RESULT_LABEL_KO[key]}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};
