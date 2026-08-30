const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Sync-Id",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function isValidSyncId(id) {
  return typeof id === "string" && /^[a-f0-9]{64}$/.test(id);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/sync" && url.pathname !== "/") {
      return json({ error: "Not found" }, 404);
    }

    if (url.pathname === "/") {
      return json({ ok: true, service: "daybook-sync" });
    }

    const syncId = request.headers.get("X-Sync-Id");
    if (!isValidSyncId(syncId)) {
      return json({ error: "Invalid sync id" }, 400);
    }

    if (request.method === "GET") {
      const raw = await env.SYNC_KV.get(syncId);
      if (!raw) return json(null);
      try {
        return json(JSON.parse(raw));
      } catch {
        return json({ error: "Corrupt sync record" }, 500);
      }
    }

    if (request.method === "PUT") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }

      if (!body?.encrypted || typeof body.updatedAt !== "number") {
        return json({ error: "Missing encrypted payload or updatedAt" }, 400);
      }

      const existingRaw = await env.SYNC_KV.get(syncId);
      if (existingRaw) {
        try {
          const existing = JSON.parse(existingRaw);
          if (existing.updatedAt > body.updatedAt) {
            return json({ conflict: true, remote: existing }, 409);
          }
        } catch {
          /* overwrite corrupt record */
        }
      }

      const record = {
        encrypted: body.encrypted,
        updatedAt: body.updatedAt,
        deviceId: body.deviceId || null,
      };

      await env.SYNC_KV.put(syncId, JSON.stringify(record));
      return json({ ok: true, updatedAt: record.updatedAt });
    }

    return json({ error: "Method not allowed" }, 405);
  },
};
