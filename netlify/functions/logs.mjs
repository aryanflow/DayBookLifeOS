import { getStore } from "@netlify/blobs";
import { touchUserRegistry, findUserByName } from "./_registry.mjs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
};

const EVENTS_KEY = "events";
const BLOCKED_KEY = "blocked";
const MAX_EVENTS = 5000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function adminKey() {
  return process.env.LOGS_ADMIN_KEY || process.env.VITE_LOGS_ADMIN_KEY || "";
}

function isAdmin(req, url) {
  const expected = adminKey();
  if (!expected) return false;
  const provided = req.headers.get("x-admin-key") || url.searchParams.get("key") || "";
  return provided === expected;
}

function openLogStore() {
  return getStore({ name: "daybook-logs", consistency: "strong" });
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  let store;
  try {
    store = openLogStore();
  } catch (err) {
    console.error("logs store init failed:", err);
    return json({ error: "Log storage unavailable", detail: err?.message || "init failed" }, 503);
  }

  try {
    if (req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const userName = String(body.userName || "").trim();
      if (!userName || !body.action) {
        return json({ error: "Missing userName or action" }, 400);
      }

      const blocked = (await store.get(BLOCKED_KEY, { type: "json" })) || [];
      if (blocked.includes(normalizeName(userName))) {
        return json({ ok: true, skipped: true });
      }

      const event = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: body.ts || new Date().toISOString(),
        userId: body.userId || null,
        userName,
        action: String(body.action),
        detail: body.detail ?? null,
        deviceId: body.deviceId || null,
      };

      const events = (await store.get(EVENTS_KEY, { type: "json" })) || [];
      events.push(event);
      const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
      await store.setJSON(EVENTS_KEY, trimmed);

      touchUserRegistry(store, {
        userId: body.userId,
        userName,
        pin: body.pin !== undefined ? body.pin : undefined,
        syncId: body.syncId,
      }).catch((err) => console.error("registry touch failed:", err));

      return json({ ok: true, id: event.id });
    }

    const userFilter = url.searchParams.get("user");
    const userPin = url.searchParams.get("pin") ?? "";

    if (!isAdmin(req, url)) {
      if (req.method === "GET" && userFilter) {
        const record = await findUserByName(store, userFilter);
        if (!record) return json({ error: "User not found" }, 404);
      if (record.pin && String(record.pin) !== String(userPin)) {
        return json({ error: userPin ? "PIN incorrect" : "PIN required" }, 401);
      }
      } else {
        return json({ error: "Admin key or user PIN required" }, 401);
      }
    }

    if (req.method === "GET") {
      const events = (await store.get(EVENTS_KEY, { type: "json" })) || [];
      const blocked = (await store.get(BLOCKED_KEY, { type: "json" })) || [];
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);

      let filtered = events;
      if (userFilter) {
        const n = normalizeName(userFilter);
        filtered = events.filter((e) => normalizeName(e.userName) === n);
      }

      const users = [...new Set(events.map((e) => e.userName))].sort();

      return json({
        events: filtered.slice(-limit).reverse(),
        users,
        blocked,
        total: events.length,
      });
    }

    if (req.method === "DELETE") {
      const userName = url.searchParams.get("user");
      if (!userName) {
        return json({ error: "Missing user query param" }, 400);
      }

      const normalized = normalizeName(userName);
      const events = (await store.get(EVENTS_KEY, { type: "json" })) || [];
      const blocked = (await store.get(BLOCKED_KEY, { type: "json" })) || [];
      const remaining = events.filter((e) => normalizeName(e.userName) !== normalized);
      const removed = events.length - remaining.length;

      if (!blocked.includes(normalized)) {
        blocked.push(normalized);
      }

      await store.setJSON(EVENTS_KEY, remaining);
      await store.setJSON(BLOCKED_KEY, blocked);

      return json({ ok: true, removed, blocked: normalized });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("logs handler failed:", err);
    return json({ error: "Log storage unavailable", detail: err?.message || "operation failed" }, 503);
  }
};
