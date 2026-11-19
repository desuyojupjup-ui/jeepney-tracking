/**
 * JeepTrack Live Fleet Relay (Vercel Serverless Function)
 * ------------------------------------------------------------------
 * GET  /api/live-fleet  -> { units: [{ unit, updatedAt }], serverTime }
 * POST /api/live-fleet  -> body { units: Jeepney[] } (upsert)
 *
 * Storage:
 *  - If Vercel KV / Upstash Redis env vars are configured
 *    (KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL +
 *    UPSTASH_REDIS_REST_TOKEN) the fleet is stored in Redis so every
 *    serverless instance shares the same live state (recommended).
 *  - Otherwise falls back to warm-instance memory (best effort).
 */

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const HASH_KEY = 'jeeptrack:live-fleet';

const memoryStore = globalThis.__jeeptrackLiveFleet || (globalThis.__jeeptrackLiveFleet = new Map());

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function readAll() {
  if (REDIS_URL && REDIS_TOKEN) {
    const flat = (await redis(['HGETALL', HASH_KEY])) || [];
    const entries = [];
    for (let i = 1; i < flat.length; i += 2) {
      try {
        entries.push(JSON.parse(flat[i]));
      } catch {
        /* ignore corrupt entry */
      }
    }
    return entries;
  }
  return Array.from(memoryStore.values());
}

async function writeUnits(units, now) {
  if (REDIS_URL && REDIS_TOKEN) {
    const args = ['HSET', HASH_KEY];
    for (const unit of units) args.push(unit.id, JSON.stringify({ unit, updatedAt: now }));
    if (args.length > 2) await redis(args);
    return;
  }
  for (const unit of units) memoryStore.set(unit.id, { unit, updatedAt: now });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const units = await readAll();
      res.status(200).send(JSON.stringify({ units, serverTime: Date.now() }));
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const incoming = Array.isArray(body?.units) ? body.units : [];
      const valid = incoming.filter((u) => u && typeof u.id === 'string');
      const now = Date.now();
      await writeUnits(valid, now);
      res.status(200).send(JSON.stringify({ ok: true, serverTime: now }));
      return;
    }

    res.status(405).send(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    res.status(500).send(JSON.stringify({ ok: false, error: String(err?.message || err) }));
  }
}

