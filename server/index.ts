import cors from "cors";
import express from "express";
import pg from "pg";
import { gameFromCreate, mergeUpdatePayload, rowToGame } from "./game-store.js";

const PORT = Number(process.env.PORT ?? 3001);

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[scoreboard-api] DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

/** 쉼표로 여러 origin (예: 부모 http://localhost:3000, Vite http://localhost:5174) */
const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors(
    corsOrigins?.length
      ? { origin: corsOrigins, credentials: true }
      : { origin: true },
  ),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/scoreboard/game", async (req, res) => {
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : "";
  if (!ownerId) {
    res.status(400).json({ message: "ownerId required" });
    return;
  }
  const { rows } = await pool.query<{
    id: number;
    ownerId: string;
    payload: unknown;
  }>(
    `SELECT id, "ownerId", payload FROM scoreboard_games WHERE "ownerId" = $1 ORDER BY id DESC`,
    [ownerId],
  );
  res.json(rows.map((r) => rowToGame(r.id, r.payload)));
});

app.get("/api/scoreboard/game/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ message: "invalid id" });
    return;
  }
  const { rows } = await pool.query<{ id: number; payload: unknown }>(
    `SELECT id, payload FROM scoreboard_games WHERE id = $1`,
    [id],
  );
  if (rows.length === 0) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(rowToGame(rows[0].id, rows[0].payload));
});

app.post("/api/scoreboard/game", async (req, res) => {
  const draft = gameFromCreate(
    req.body as {
      ownerId: string;
      title: string;
      homeTeam: string;
      awayTeam: string;
      players?: unknown[];
      status: string;
    },
  );
  const { rows } = await pool.query<{ id: number; payload: unknown }>(
    `INSERT INTO scoreboard_games ("ownerId", payload, "updatedAt") VALUES ($1, $2::jsonb, NOW()) RETURNING id, payload`,
    [draft.ownerId as string, JSON.stringify(draft)],
  );
  const row = rows[0];
  res.status(201).json(rowToGame(row.id, row.payload));
});

app.put("/api/scoreboard/game/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ message: "invalid id" });
    return;
  }
  const game = mergeUpdatePayload(id, req.body as Record<string, unknown>);
  const { rowCount } = await pool.query(
    `UPDATE scoreboard_games SET "ownerId" = $1, payload = $2::jsonb, "updatedAt" = NOW() WHERE id = $3`,
    [game.ownerId as string, JSON.stringify(game), id],
  );
  if (rowCount === 0) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  const { rows } = await pool.query<{ id: number; payload: unknown }>(
    `SELECT id, payload FROM scoreboard_games WHERE id = $1`,
    [id],
  );
  res.json(rowToGame(rows[0].id, rows[0].payload));
});

app.delete("/api/scoreboard/game/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ message: "invalid id" });
    return;
  }
  const { rowCount } = await pool.query(`DELETE FROM scoreboard_games WHERE id = $1`, [
    id,
  ]);
  if (rowCount === 0) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.status(204).send();
});

const server = app.listen(PORT, () => {
  console.log(`[scoreboard-api] http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
