/**
 * 투수 이닝: 3아웃 = 1이닝. 표시는 0 → 0.1 → 0.2 → 1 → 1.1 → … (야구 기록 방식)
 * 내부 값은 총 아웃 수(정수)로만 다룹니다.
 */

import type { PitcherRecord } from "../types";

/** 총 아웃 수 → "1.1", "2" 같은 표시 문자열 */
export function outsToDisplayString(outs: number): string {
  const o = Math.max(0, Math.floor(outs));
  const inn = Math.floor(o / 3);
  const rem = o % 3;
  if (rem === 0) return String(inn);
  return `${inn}.${rem}`;
}

export function addOneOut(outs: number): number {
  return outs + 1;
}

export function subOneOut(outs: number): number {
  return Math.max(0, outs - 1);
}

/**
 * DB·구버전 저장값(정수 아웃 또는 예전 1.1·1.2 표기 float) → 총 아웃 수
 */
export function inningsFloatFromDbToOuts(v: number): number {
  if (!Number.isFinite(v) || v < 0) return 0;
  const r = Math.round(v);
  if (Math.abs(v - r) < 1e-4) return r;
  const whole = Math.floor(v + 1e-9);
  const frac = v - whole;
  const t = Math.round(frac * 10);
  if (t === 1) return whole * 3 + 1;
  if (t === 2) return whole * 3 + 2;
  if (Math.abs(frac) < 1e-4 || t === 0) return whole * 3;
  return Math.max(0, Math.round(v * 3));
}

/** API·로컬에 `inningsPitched`만 있던 예전 데이터 호환 */
export function pitcherRecordWithOuts(p: PitcherRecord): PitcherRecord {
  const legacy = p as PitcherRecord & { inningsPitched?: number };
  const { inningsPitched: _old, ...rest } = legacy;
  if (p.pitchingOuts != null) {
    return { ...rest, pitchingOuts: Math.max(0, Math.floor(p.pitchingOuts)) };
  }
  if (_old != null) {
    return { ...rest, pitchingOuts: inningsFloatFromDbToOuts(_old) };
  }
  return { ...rest, pitchingOuts: 0 };
}
