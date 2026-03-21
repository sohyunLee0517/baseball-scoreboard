/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 예: `http://localhost:3001/api/scoreboard/game` — 비우면 `/api/scoreboard/game` (같은 origin 또는 프록시) */
  readonly VITE_SCOREBOARD_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
