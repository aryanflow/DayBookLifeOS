import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Sync-Id",
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

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const syncId = req.headers.get("x-sync-id");
  if (!isValidSyncId(syncId)) {
    return json({ error: "Invalid sync id" }, 400);
  }

  let store;
  try {
    store = getStore({ name: "daybook-sync", consistency: "strong" });
  } catch (err) {
    console.error("sync store init failed:", err);
    return json({ error: "Sync storage unavailable", detail: err?.message || "init failed" }, 503);
  }

  try {
    if (req.method === "GET") {
      const data = await store.get(syncId, { type: "json" });
      return json(data ?? null);
    }

    if (req.method === "POST" || req.method === "PUT") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }

      if (!body?.encrypted || typeof body.updatedAt !== "number") {
        return json({ error: "Missing encrypted payload or updatedAt" }, 400);
      }

      const existing = await store.get(syncId, { type: "json" });
      if (existing?.updatedAt > body.updatedAt) {
        return json({ conflict: true, remote: existing }, 409);
      }

      const record = {
        encrypted: body.encrypted,
        updatedAt: body.updatedAt,
        deviceId: body.deviceId || null,
      };

      await store.setJSON(syncId, record);
      return json({ ok: true, updatedAt: record.updatedAt });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("sync handler failed:", err);
    return json({ error: "Sync storage unavailable", detail: err?.message || "operation failed" }, 503);
  }
};
