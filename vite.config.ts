import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * JeepTrack Live Fleet & Commuter Presence Relay (dev + preview server)
 * ------------------------------------------------------------------
 * Exposes `/api/live-fleet` so drivers, students/faculty, and admins
 * across different browsers/devices share live PUJ telemetry AND
 * online waiting commuter (student/faculty) locations in real time.
 */
type LiveUnitEntry = { unit: { id: string; [key: string]: unknown }; updatedAt: number }
type LiveCommuterEntry = { commuter: { id: string; status?: string; [key: string]: unknown }; updatedAt: number }

function liveFleetRelay(): Plugin {
  const units = new Map<string, LiveUnitEntry>()
  const commuters = new Map<string, LiveCommuterEntry>()

  const handler = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url || !req.url.startsWith('/api/live-fleet')) return next()

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method === 'GET') {
      res.end(
        JSON.stringify({
          units: Array.from(units.values()),
          commuters: Array.from(commuters.values()),
          serverTime: Date.now(),
        })
      )
      return
    }

    if (req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
        if (body.length > 2_000_000) req.destroy()
      })
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}')
          const incomingUnits: unknown[] = Array.isArray(parsed?.units) ? parsed.units : []
          const incomingCommuters: unknown[] = Array.isArray(parsed?.commuters) ? parsed.commuters : []
          const now = Date.now()

          for (const raw of incomingUnits) {
            const unit = raw as LiveUnitEntry['unit']
            if (unit && typeof unit.id === 'string') {
              units.set(unit.id, { unit, updatedAt: now })
            }
          }

          for (const raw of incomingCommuters) {
            const commuter = raw as LiveCommuterEntry['commuter']
            if (commuter && typeof commuter.id === 'string') {
              if (commuter.status === 'offline') {
                commuters.delete(commuter.id)
              } else {
                commuters.set(commuter.id, { commuter, updatedAt: now })
              }
            }
          }

          res.end(JSON.stringify({ ok: true, serverTime: now }))
        } catch {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }))
        }
      })
      return
    }

    res.statusCode = 405
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
  }

  return {
    name: 'jeeptrack-live-fleet-relay',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), liveFleetRelay()],
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 800,
    },
  },
  preview: {
    host: true,
  },
})
