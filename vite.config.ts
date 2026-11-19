import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * JeepTrack Live Fleet Relay (dev + preview server)
 * ------------------------------------------------------------------
 * Browsers (Chrome, Edge, phones…) do NOT share localStorage or
 * BroadcastChannel, so a driver logged in on one browser/device was
 * invisible to students/faculty/admin on another browser/device.
 *
 * This tiny in-memory relay exposes `/api/live-fleet` so every client
 * can publish its jeepney state (status + GPS) and poll the latest
 * state of every unit. Production (Vercel) uses `api/live-fleet.js`.
 */
type LiveEntry = { unit: { id: string; [key: string]: unknown }; updatedAt: number }

function liveFleetRelay(): Plugin {
  const units = new Map<string, LiveEntry>()

  const handler = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url || !req.url.startsWith('/api/live-fleet')) return next()

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method === 'GET') {
      res.end(JSON.stringify({ units: Array.from(units.values()), serverTime: Date.now() }))
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
          const incoming: unknown[] = Array.isArray(parsed?.units) ? parsed.units : []
          const now = Date.now()
          for (const raw of incoming) {
            const unit = raw as LiveEntry['unit']
            if (unit && typeof unit.id === 'string') {
              units.set(unit.id, { unit, updatedAt: now })
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
