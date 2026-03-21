import cors from "cors";
import express from "express";
import pg from "pg";

const PORT = Number(process.env.PORT ?? 3001);

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[scoreboard-api] DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

const app = express();

const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors(
    corsOrigins?.length
      ? { origin: corsOrigins, credentials: true }
      : { origin: true },
  ),
);
app.use(express.json({ limit: "2mb" }));

const VALID_BAT_RESULTS = new Set([
  "SINGLE","DOUBLE","TRIPLE","HOME_RUN","INFIELD_HIT",
  "GROUND_OUT_1","GROUND_OUT_3","GROUND_OUT_4","GROUND_OUT_5","GROUND_OUT_6",
  "FLY_OUT_7","FLY_OUT_8","FLY_OUT_9","FLY_OUT_78","FLY_OUT_89",
  "LINE_OUT_3","LINE_OUT_4","LINE_OUT_5","LINE_OUT_6",
  "STRIKEOUT","WALK","HIT_BY_PITCH","REACH_ON_ERROR",
  "SACRIFICE_BUNT","SACRIFICE_FLY","DOUBLE_PLAY","FIELDERS_CHOICE",
]);

type Player = {
  id?: number;
  name: string;
  team: string;
  position?: string;
  backNumber?: string;
  lineupOrder?: number;
  inningRecords?: string[];
};

type InningData = {
  id?: number;
  inningNumber: number;
  topBottom: string;
  runs: number;
  hits: number;
  errors: number;
  balls: number;
};

async function fetchGame(client: pg.PoolClient | pg.Pool, id: number) {
  const { rows: matches } = await client.query(
    `SELECT id, "ownerId", title, status, "homeTeamName", "awayTeamName", "homeScore", "awayScore", date, "createdAt"
     FROM "Match" WHERE id = $1`,
    [id],
  );
  if (matches.length === 0) return null;
  const m = matches[0] as Record<string, unknown>;

  const { rows: players } = await client.query(
    `SELECT id, "playerId", name, team, position, "backNumber", "lineupOrder"
     FROM "MatchPlayer" WHERE "matchId" = $1 ORDER BY "lineupOrder"`,
    [id],
  );

  const { rows: innings } = await client.query(
    `SELECT * FROM "Inning" WHERE "matchId" = $1`,
    [id],
  );

  const { rows: batRecords } = await client.query(
    `SELECT "playerName", "batOrder", "inningNo", result
     FROM "BatRecord" WHERE "matchId" = $1`,
    [id],
  );

  const playerList = (players as Record<string, unknown>[]).map((p) => {
    const myBats = (batRecords as Record<string, unknown>[])
      .filter((b) => b.batOrder === p.lineupOrder && b.playerName === p.name)
      .sort((a, b) => (a.inningNo as number) - (b.inningNo as number));

    let inningRecords: string[] = [];
    if (myBats.length > 0) {
      const maxInning = Math.max(...myBats.map((b) => b.inningNo as number));
      inningRecords = Array(maxInning).fill("");
      for (const b of myBats) {
        inningRecords[(b.inningNo as number) - 1] = b.result as string;
      }
    }

    return {
      id: p.id,
      name: p.name,
      team: p.team,
      position: p.position || "",
      backNumber: p.backNumber || "",
      lineupOrder: p.lineupOrder,
      inningRecords,
    };
  });

  const inningRow = (innings[0] ?? {}) as Record<string, unknown>;
  const inningList: { inningNumber: number; topBottom: string; runs: number }[] = [];
  for (let i = 1; i <= 12; i++) {
    const homeRuns = inningRow[`home${i}`];
    const awayRuns = inningRow[`away${i}`];
    if (homeRuns !== null && homeRuns !== undefined) {
      inningList.push({ inningNumber: i, topBottom: "BOTTOM", runs: homeRuns as number });
    }
    if (awayRuns !== null && awayRuns !== undefined) {
      inningList.push({ inningNumber: i, topBottom: "TOP", runs: awayRuns as number });
    }
  }

  return {
    id: m.id,
    ownerId: m.ownerId,
    title: m.title,
    status: m.status,
    homeTeam: m.homeTeamName,
    awayTeam: m.awayTeamName,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    date: m.date,
    createdAt: m.createdAt,
    players: playerList,
    innings: inningList,
  };
}

// GET /api/scoreboard/game?ownerId=xxx
app.get("/api/scoreboard/game", async (req, res) => {
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : "";
  if (!ownerId) {
    res.status(400).json({ message: "ownerId required" });
    return;
  }
  const { rows } = await pool.query(
    `SELECT id FROM "Match" WHERE "ownerId" = $1 ORDER BY id DESC`,
    [ownerId],
  );
  const games = await Promise.all(
    (rows as { id: number }[]).map((r) => fetchGame(pool, r.id)),
  );
  res.json(games.filter(Boolean));
});

// GET /api/scoreboard/game/:id
app.get("/api/scoreboard/game/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ message: "invalid id" });
    return;
  }
  const game = await fetchGame(pool, id);
  if (!game) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(game);
});

// POST /api/scoreboard/game
app.post("/api/scoreboard/game", async (req, res) => {
  const body = req.body as {
    ownerId: string;
    title: string;
    homeTeam: string;
    awayTeam: string;
    players?: Player[];
    status?: string;
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO "Match" ("ownerId", title, status, "homeTeamName", "awayTeamName", "homeScore", "awayScore")
       VALUES ($1, $2, $3, $4, $5, 0, 0) RETURNING id`,
      [body.ownerId, body.title, body.status ?? "IN_PROGRESS", body.homeTeam ?? "", body.awayTeam ?? ""],
    );
    const matchId = (rows[0] as { id: number }).id;

    for (const p of body.players ?? []) {
      await client.query(
        `INSERT INTO "MatchPlayer" ("matchId", "playerId", name, team, position, "backNumber", "lineupOrder")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [matchId, String(p.id ?? ""), p.name, p.team, p.position ?? "", p.backNumber ?? "", p.lineupOrder ?? 0],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      id: matchId,
      ownerId: body.ownerId,
      title: body.title,
      status: body.status ?? "IN_PROGRESS",
      homeTeam: body.homeTeam ?? "",
      awayTeam: body.awayTeam ?? "",
      homeScore: 0,
      awayScore: 0,
      players: body.players ?? [],
      innings: [],
    });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

// PUT /api/scoreboard/game/:id  (Save All)
app.put("/api/scoreboard/game/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ message: "invalid id" });
    return;
  }

  const body = req.body as {
    ownerId?: string;
    title?: string;
    status?: string;
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number;
    awayScore?: number;
    players?: Player[];
    innings?: InningData[];
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rowCount } = await client.query(
      `UPDATE "Match"
       SET status = 'FINISHED',
           "homeScore" = $1,
           "awayScore" = $2
       WHERE id = $3`,
      [body.homeScore ?? 0, body.awayScore ?? 0, id],
    );

    if (rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "Not found" });
      return;
    }

    // 선수 목록 교체
    if (body.players !== undefined) {
      await client.query(`DELETE FROM "MatchPlayer" WHERE "matchId" = $1`, [id]);
      for (const p of body.players) {
        await client.query(
          `INSERT INTO "MatchPlayer" ("matchId", "playerId", name, team, position, "backNumber", "lineupOrder")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, String(p.id ?? ""), p.name, p.team, p.position ?? "", p.backNumber ?? "", p.lineupOrder ?? 0],
        );
      }

      // BatRecord 교체 (inningRecords에서 추출)
      await client.query(`DELETE FROM "BatRecord" WHERE "matchId" = $1`, [id]);
      for (const p of body.players) {
        if (!p.inningRecords?.length) continue;
        for (let i = 0; i < p.inningRecords.length; i++) {
          const result = p.inningRecords[i];
          if (!result || !VALID_BAT_RESULTS.has(result)) continue;
          await client.query(
            `INSERT INTO "BatRecord" ("matchId", "playerId", "playerName", position, "batOrder", "inningNo", result)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, String(p.id ?? ""), p.name, p.position ?? "", p.lineupOrder ?? 0, i + 1, result],
          );
        }
      }
    }

    // 이닝 점수 저장
    if (body.innings !== undefined) {
      const cols: string[] = [];
      const vals: unknown[] = [id];
      for (let i = 1; i <= 12; i++) {
        const homeRuns = body.innings.find((inn) => inn.inningNumber === i && inn.topBottom === "BOTTOM")?.runs ?? null;
        const awayRuns = body.innings.find((inn) => inn.inningNumber === i && inn.topBottom === "TOP")?.runs ?? null;
        cols.push(`home${i}`, `away${i}`);
        vals.push(homeRuns, awayRuns);
      }
      const setCols = cols.map((c, i) => `"${c}" = $${i + 2}`).join(", ");
      await client.query(
        `INSERT INTO "Inning" ("matchId", ${cols.map((c) => `"${c}"`).join(", ")})
         VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")})
         ON CONFLICT ("matchId") DO UPDATE SET ${setCols}`,
        vals,
      );
    }

    await client.query("COMMIT");
    const game = await fetchGame(pool, id);
    res.json(game);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

// DELETE /api/scoreboard/game/:id
app.delete("/api/scoreboard/game/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ message: "invalid id" });
    return;
  }
  const { rowCount } = await pool.query(`DELETE FROM "Match" WHERE id = $1`, [id]);
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
