/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 예: `http://localhost:3001/api/scoreboard/game` — 비우면 `/api/scoreboard/game` (같은 origin 또는 프록시). Vercel Production에는 배포된 API 전체 URL. */
  readonly VITE_SCOREBOARD_API_BASE?: string;
  /** `true`면 Vite 개발 서버에서 스코어보드 API mock 비활성화 (실 API·프록시 사용 시) */
  readonly VITE_DISABLE_SCOREBOARD_MOCK?: string;
  /** 로컬 전용: `npm run dev` 시 `/api/scoreboard` 를 이 origin으로 프록시 (예: `http://localhost:3001`) */
  readonly VITE_SCOREBOARD_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
