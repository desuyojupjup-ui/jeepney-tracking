/**
 * JeepTrack Live Fleet & Commuter Presence Relay (Vercel Serverless Function)
 * ---------------------------------------------------------------------------
 * GET  /api/live-fleet  -> { units: [{ unit, updatedAt }], commuters: [{ commuter, updatedAt }], serverTime }
 * POST /api/live-fleet  -> body { units?: Jeepney[], commuters?: OnlineCommuterPresence[] }
 */

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const UNITS_HASH_KEY = 'jeeptrack:live-fleet';
const COMMUTERS_HASH_KEY = 'jeeptrack:live-commuters';

const memoryUnits = globalThis.__jeeptrackLiveFleet || (globalThis.__jeeptrackLiveFleet = new Map());
const memoryCommuters = globalThis.__jeeptrackLiveCommuters || (globalThis.__jeeptrackLiveCommuters = new Map());

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

async function readHash(hashKey, memMap) {
  if (REDIS_URL && REDIS_TOKEN) {
    const flat = (await redis(['HGETALL', hashKey])) || [];
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
  return Array.from(memMap.values());
}

async function writeUnits(units, now) {
  if (units.length === 0) return;
  if (REDIS_URL && REDIS_TOKEN) {
    const args = ['HSET', UNITS_HASH_KEY];
    for (const unit of units) args.push(unit.id, JSON.stringify({ unit, updatedAt: now }));
    if (args.length > 2) await redis(args);
    return;
  }
  for (const unit of units) memoryUnits.set(unit.id, { unit, updatedAt: now });
}

async function writeCommuters(commuters, now) {
  if (commuters.length === 0) return;
  const online = commuters.filter((c) => c.status !== 'offline');
  const offline = commuters.filter((c) => c.status === 'offline');

  if (REDIS_URL && REDIS_TOKEN) {
    if (online.length > 0) {
      const args = ['HSET', COMMUTERS_HASH_KEY];
      for (const commuter of online) args.push(commuter.id, JSON.stringify({ commuter, updatedAt: now }));
      await redis(args);
    }
    if (offline.length > 0) {
      await redis(['HDEL', COMMUTERS_HASH_KEY, ...offline.map((c) => c.id)]);
    }
    return;
  }

  for (const commuter of online) memoryCommuters.set(commuter.id, { commuter, updatedAt: now });
  for (const commuter of offline) memoryCommuters.delete(commuter.id);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const [units, commuters] = await Promise.all([
        readHash(UNITS_HASH_KEY, memoryUnits),
        readHash(COMMUTERS_HASH_KEY, memoryCommuters),
      ]);
      res.status(200).send(JSON.stringify({ units, commuters, serverTime: Date.now() }));
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const incomingUnits = Array.isArray(body?.units) ? body.units.filter((u) => u && typeof u.id === 'string') : [];
      const incomingCommuters = Array.isArray(body?.commuters) ? body.commuters.filter((c) => c && typeof c.id === 'string') : [];
      const now = Date.now();
      await Promise.all([writeUnits(incomingUnits, now), writeCommuters(incomingCommuters, now)]);
      res.status(200).send(JSON.stringify({ ok: true, serverTime: now }));
      return;
    }

    res.status(405).send(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    res.status(500).send(JSON.stringify({ ok: false, error: String(err?.message || err) }));
  }
}
