import type { Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { parse as parseUrl } from 'node:url'

/** In-memory store for local dev when no backend runs on :3001 */
const games: Record<string, unknown>[] = []
let nextId = 1

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function noContent(res: ServerResponse) {
  res.statusCode = 204
  res.end()
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** POST/PUT 본문을 안전히 객체로 — JSON 오류·null·배열이면 500 방지 */
function parseJsonBody(raw: string): Record<string, unknown> {
  if (!raw || !raw.trim()) return {}
  try {
    const v = JSON.parse(raw) as unknown
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return v as Record<string, unknown>
    }
    return {}
  } catch {
    return {}
  }
}

function gamesMatchingPlayerId(playerIdStr: string) {
  const pid = Number.parseInt(playerIdStr, 10)
  if (!Number.isFinite(pid)) return []
  return games.filter((g) => {
    const G = g as {
      players?: { id?: number }[]
      pitchers?: { id?: number }[]
    }
    return (
      (G.players ?? []).some((p) => p.id === pid) ||
      (G.pitchers ?? []).some((p) => p.id === pid)
    )
  })
}

export function mockScoreboardApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url || ''
    if (!url.startsWith('/api/scoreboard/')) {
      return next()
    }

    const { pathname: rawPath, query } = parseUrl(url, true)
    const pathname = rawPath?.replace(/\/$/, '') || ''
    const method = req.method || 'GET'

    // GET /api/scoreboard/player/:playerId/games (개인 기록 페이지 전용)
    const playerGames = pathname.match(
      /^\/api\/scoreboard\/player\/([^/]+)\/games$/,
    )
    if (method === 'GET' && playerGames) {
      const playerId = decodeURIComponent(playerGames[1] ?? '')
      return json(res, 200, gamesMatchingPlayerId(playerId))
    }

    // GET /api/scoreboard/game/player/:playerId/games (프록시·baseURL과 동일 prefix)
    const nestedPlayerGames = pathname.match(
      /^\/api\/scoreboard\/game\/player\/([^/]+)\/games$/,
    )
    if (method === 'GET' && nestedPlayerGames) {
      const playerId = decodeURIComponent(nestedPlayerGames[1] ?? '')
      return json(res, 200, gamesMatchingPlayerId(playerId))
    }

    if (!url.startsWith('/api/scoreboard/game')) {
      return next()
    }

    const idFromPath = pathname.match(/^\/api\/scoreboard\/game\/(\d+)$/)
    const id = idFromPath ? Number(idFromPath[1]) : null

    try {
      // GET /api/scoreboard/game?ownerId=...
      if (method === 'GET' && id === null) {
        const ownerId = typeof query.ownerId === 'string' ? query.ownerId : ''
        const list = games.filter(
          (g) => (g as { ownerId?: string }).ownerId === ownerId,
        )
        return json(res, 200, list)
      }

      // GET /api/scoreboard/game/:id
      if (method === 'GET' && id !== null) {
        const game = games.find((g) => (g as { id?: number }).id === id)
        if (!game) return json(res, 404, { message: '찾을 수 없습니다.' })
        return json(res, 200, game)
      }

      // POST /api/scoreboard/game
      if (method === 'POST' && pathname === '/api/scoreboard/game') {
        const raw = await readBody(req)
        const body = parseJsonBody(raw)
        const game = {
          ...body,
          id: nextId++,
          homeScore: body.homeScore ?? 0,
          awayScore: body.awayScore ?? 0,
          innings: body.innings ?? [],
          players: body.players ?? [],
          pitchers: body.pitchers ?? [],
          date: body.date ?? new Date().toISOString(),
        }
        games.push(game)
        return json(res, 201, game)
      }

      // PUT /api/scoreboard/game/:id
      if (method === 'PUT' && id !== null) {
        const raw = await readBody(req)
        const body = parseJsonBody(raw)
        const idx = games.findIndex((g) => (g as { id?: number }).id === id)
        if (idx === -1) return json(res, 404, { message: '찾을 수 없습니다.' })
        const updated = { ...games[idx], ...body, id }
        games[idx] = updated
        return json(res, 200, updated)
      }

      // DELETE /api/scoreboard/game/:id
      if (method === 'DELETE' && id !== null) {
        const idx = games.findIndex((g) => (g as { id?: number }).id === id)
        if (idx === -1) return json(res, 404, { message: '찾을 수 없습니다.' })
        games.splice(idx, 1)
        return noContent(res)
      }

      return json(res, 404, { message: '찾을 수 없습니다.' })
    } catch (e) {
      console.error('[mock-api]', e)
      return json(res, 500, { message: '모의 API 오류' })
    }
  }
}
