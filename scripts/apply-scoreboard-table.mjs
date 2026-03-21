/**
 * Prisma CLI 없이 `scoreboard_games` 테이블만 적용 (로컬/Homebrew Postgres 등)
 * 사용: npm run db:apply:scoreboard
 */
import "dotenv/config";
import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL 이 .env 에 없습니다.");
  process.exit(1);
}

const sqlPath = join(
  __dirname,
  "../prisma/migrations/20260321120000_scoreboard_games/migration.sql",
);
const sql = fs.readFileSync(sqlPath, "utf8");

const pool = new pg.Pool({
  connectionString: url,
  ssl: url.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});
try {
  await pool.query(sql);
  console.log("[db] scoreboard_games 테이블 적용 완료");
} catch (e) {
  const msg = e && typeof e === "object" && "message" in e ? String(e.message) : String(e);
  if (msg.includes("already exists")) {
    console.log("[db] scoreboard_games 이미 있음 — 건너뜀");
  } else {
    console.error("[db]", e);
    process.exit(1);
  }
} finally {
  await pool.end();
}
