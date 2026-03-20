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

export function mockScoreboardApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url || ''
    if (!url.startsWith('/api/scoreboard/game')) {
      return next()
    }

    const { pathname, query } = parseUrl(url, true)
    const method = req.method || 'GET'
    const idFromPath = pathname?.match(/^\/api\/scoreboard\/game\/(\d+)$/)
    const id = idFromPath ? Number(idFromPath[1]) : null

    try {
      // GET /api/scoreboard/game?ownerId=...
      if (method === 'GET' && id === null) {
        const ownerId = typeof query.ownerId === 'string' ? query.ownerId : ''
        const list = games.filter((g) => (g as { ownerId?: string }).ownerId === ownerId)
        return json(res, 200, list)
      }

      // GET /api/scoreboard/game/:id
      if (method === 'GET' && id !== null) {
        const game = games.find((g) => (g as { id?: number }).id === id)
        if (!game) return json(res, 404, { message: 'Not found' })
        return json(res, 200, game)
      }

      // POST /api/scoreboard/game
      if (method === 'POST' && pathname === '/api/scoreboard/game') {
        const raw = await readBody(req)
        const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
        const game = {
          ...body,
          id: nextId++,
          homeScore: body.homeScore ?? 0,
          awayScore: body.awayScore ?? 0,
          innings: body.innings ?? [],
          players: body.players ?? [],
          date: body.date ?? new Date().toISOString(),
        }
        games.push(game)
        return json(res, 201, game)
      }

      // PUT /api/scoreboard/game/:id
      if (method === 'PUT' && id !== null) {
        const raw = await readBody(req)
        const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
        const idx = games.findIndex((g) => (g as { id?: number }).id === id)
        if (idx === -1) return json(res, 404, { message: 'Not found' })
        const updated = { ...games[idx], ...body, id }
        games[idx] = updated
        return json(res, 200, updated)
      }

      // DELETE /api/scoreboard/game/:id
      if (method === 'DELETE' && id !== null) {
        const idx = games.findIndex((g) => (g as { id?: number }).id === id)
        if (idx === -1) return json(res, 404, { message: 'Not found' })
        games.splice(idx, 1)
        return noContent(res)
      }

      return json(res, 404, { message: 'Not found' })
    } catch (e) {
      console.error('[mock-api]', e)
      return json(res, 500, { message: 'Mock API error' })
    }
  }
}
