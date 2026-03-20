/**
 * Prisma `BatResult` enum과 동일한 값(영문) — DB에는 이 문자열만 저장됩니다.
 * 한글은 UI 표시용 `BAT_RESULT_LABEL_KO`와 짝입니다.
 */
export const BatResult = {
  SINGLE: "SINGLE",
  DOUBLE: "DOUBLE",
  TRIPLE: "TRIPLE",
  HOME_RUN: "HOME_RUN",
  INFIELD_HIT: "INFIELD_HIT",
  GROUND_OUT_1: "GROUND_OUT_1",
  GROUND_OUT_3: "GROUND_OUT_3",
  GROUND_OUT_4: "GROUND_OUT_4",
  GROUND_OUT_5: "GROUND_OUT_5",
  GROUND_OUT_6: "GROUND_OUT_6",
  FLY_OUT_7: "FLY_OUT_7",
  FLY_OUT_8: "FLY_OUT_8",
  FLY_OUT_9: "FLY_OUT_9",
  FLY_OUT_78: "FLY_OUT_78",
  FLY_OUT_89: "FLY_OUT_89",
  LINE_OUT_3: "LINE_OUT_3",
  LINE_OUT_4: "LINE_OUT_4",
  LINE_OUT_5: "LINE_OUT_5",
  LINE_OUT_6: "LINE_OUT_6",
  STRIKEOUT: "STRIKEOUT",
  WALK: "WALK",
  HIT_BY_PITCH: "HIT_BY_PITCH",
  REACH_ON_ERROR: "REACH_ON_ERROR",
  SACRIFICE_BUNT: "SACRIFICE_BUNT",
  SACRIFICE_FLY: "SACRIFICE_FLY",
  DOUBLE_PLAY: "DOUBLE_PLAY",
  FIELDERS_CHOICE: "FIELDERS_CHOICE",
} as const;

/** DB·API에서 쓰는 타구 결과 코드 (영문) */
export type BatResult = (typeof BatResult)[keyof typeof BatResult];

/** UI 표시용 한글 (키는 `BatResult`와 동일) */
export const BAT_RESULT_LABEL_KO = {
  SINGLE: "1루타",
  DOUBLE: "2루타",
  TRIPLE: "3루타",
  HOME_RUN: "홈런",
  INFIELD_HIT: "내야안타",
  GROUND_OUT_1: "땅볼(1)",
  GROUND_OUT_3: "땅볼(3)",
  GROUND_OUT_4: "땅볼(4)",
  GROUND_OUT_5: "땅볼(5)",
  GROUND_OUT_6: "땅볼(6)",
  FLY_OUT_7: "플라이(7)",
  FLY_OUT_8: "플라이(8)",
  FLY_OUT_9: "플라이(9)",
  FLY_OUT_78: "플라이(7·8)",
  FLY_OUT_89: "플라이(8·9)",
  LINE_OUT_3: "라인(3)",
  LINE_OUT_4: "라인(4)",
  LINE_OUT_5: "라인(5)",
  LINE_OUT_6: "라인(6)",
  STRIKEOUT: "삼진",
  WALK: "볼넷",
  HIT_BY_PITCH: "사구",
  REACH_ON_ERROR: "실책출루",
  SACRIFICE_BUNT: "희생번트",
  SACRIFICE_FLY: "희생플라이",
  DOUBLE_PLAY: "병살",
  FIELDERS_CHOICE: "야수선택",
} as const satisfies Record<BatResult, string>;

/** 저장된 코드(영문) → 한글. 알 수 없는 문자열(구버전 자유입력)은 그대로 반환 */
export function batResultCodeToLabelKo(code: string): string {
  if (!code) return "";
  const label = BAT_RESULT_LABEL_KO[code as BatResult];
  return label ?? code;
}
