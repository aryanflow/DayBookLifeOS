import { getStore } from "@netlify/blobs";
import { touchUserRegistry, findUserByName } from "./_registry.mjs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
};

const REGISTRY_KEY = "registry";
const EVENTS_KEY = "events";
const BLOCKED_KEY = "blocked";
const DELETED_IDS_KEY = "deletedIds";

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

function openStore() {
  return getStore({ name: "daybook-logs", consistency: "strong" });
}

function openSyncStore() {
  return getStore({ name: "daybook-sync", consistency: "strong" });
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

async function loadRegistry(store) {
  return (await store.get(REGISTRY_KEY, { type: "json" })) || { users: {} };
}

async function saveRegistry(store, registry) {
  await store.setJSON(REGISTRY_KEY, registry);
}

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  let store;
  try {
    store = openStore();
  } catch (err) {
    console.error("admin store init failed:", err);
    return json({ error: "Admin storage unavailable", detail: err?.message || "init failed" }, 503);
  }

  try {
    if (req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const userId = String(body.userId || "").trim();
      const userName = String(body.userName || "").trim();
      if (!userId || !userName) {
        return json({ error: "Missing userId or userName" }, 400);
      }

      const deletedIds = (await store.get(DELETED_IDS_KEY, { type: "json" })) || [];
      if (deletedIds.includes(userId)) {
        return json({ error: "User removed by admin", deleted: true }, 403);
      }

      await touchUserRegistry(store, {
        userId,
        userName,
        createdAt: body.createdAt,
        pin: body.pin !== undefined ? body.pin : undefined,
        syncId: body.syncId,
        pinOnly: body.pinOnly === true,
      });

      return json({ ok: true });
    }

    if (req.method === "GET" && url.searchParams.get("check")) {
      const userId = url.searchParams.get("userId");
      if (!userId) return json({ error: "Missing userId" }, 400);
      const deletedIds = (await store.get(DELETED_IDS_KEY, { type: "json" })) || [];
      return json({ deleted: deletedIds.includes(userId) });
    }

    if (req.method === "GET" && url.searchParams.get("verify")) {
      const userName = url.searchParams.get("user");
      const pin = url.searchParams.get("pin") ?? "";
      if (!userName) return json({ error: "Missing user" }, 400);

      const record = await findUserByName(store, userName);
      if (!record) return json({ error: "User not found in registry" }, 404);

      const deletedIds = (await store.get(DELETED_IDS_KEY, { type: "json" })) || [];
      if (deletedIds.includes(record.userId)) {
        return json({ error: "User removed by admin", deleted: true }, 403);
      }

      if (record.pin) {
        if (!String(pin)) return json({ error: "PIN required" }, 401);
        if (String(record.pin) !== String(pin)) return json({ error: "PIN incorrect" }, 401);
      }

      return json({ ok: true, userId: record.userId, userName: record.userName, pinRequired: !!record.pin });
    }

    if (!isAdmin(req, url)) {
      return json({ error: "Admin key required" }, 401);
    }

    if (req.method === "GET") {
      const registry = await loadRegistry(store);
      const events = (await store.get(EVENTS_KEY, { type: "json" })) || [];
      const deletedIds = (await store.get(DELETED_IDS_KEY, { type: "json" })) || [];

      const users = Object.values(registry.users)
        .filter((u) => !deletedIds.includes(u.userId))
        .map((u) => {
          const userEvents = events.filter((e) => e.userId === u.userId || normalizeName(e.userName) === normalizeName(u.userName));
          const lastFromEvents = userEvents.length ? userEvents[userEvents.length - 1].ts : null;
          return {
            ...u,
            lastActivityAt: u.lastActivityAt || lastFromEvents,
            eventCount: userEvents.length,
          };
        })
        .sort((a, b) => (b.lastActivityAt || "").localeCompare(a.lastActivityAt || ""));

      return json({ users, total: users.length, deletedIds });
    }

    if (req.method === "DELETE") {
      const userId = url.searchParams.get("userId");
      const userName = url.searchParams.get("user");
      if (!userId && !userName) {
        return json({ error: "Missing userId or user" }, 400);
      }

      const registry = await loadRegistry(store);
      let target = userId ? registry.users[userId] : null;
      if (!target && userName) {
        target = Object.values(registry.users).find((u) => normalizeName(u.userName) === normalizeName(userName));
      }
      if (!target) return json({ error: "User not found" }, 404);

      const id = target.userId;
      const normalized = normalizeName(target.userName);

      delete registry.users[id];
      await saveRegistry(store, registry);

      const deletedIds = (await store.get(DELETED_IDS_KEY, { type: "json" })) || [];
      if (!deletedIds.includes(id)) deletedIds.push(id);
      await store.setJSON(DELETED_IDS_KEY, deletedIds);

      const blocked = (await store.get(BLOCKED_KEY, { type: "json" })) || [];
      if (!blocked.includes(normalized)) blocked.push(normalized);
      await store.setJSON(BLOCKED_KEY, blocked);

      const events = (await store.get(EVENTS_KEY, { type: "json" })) || [];
      const remaining = events.filter((e) => e.userId !== id && normalizeName(e.userName) !== normalized);
      const removedEvents = events.length - remaining.length;
      await store.setJSON(EVENTS_KEY, remaining);

      let syncRemoved = false;
      if (target.syncId) {
        try {
          const syncStore = openSyncStore();
          await syncStore.delete(target.syncId);
          syncRemoved = true;
        } catch (err) {
          console.error("sync blob delete failed:", err);
        }
      }

      return json({
        ok: true,
        userId: id,
        userName: target.userName,
        removedEvents,
        syncRemoved,
      });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("admin handler failed:", err);
    return json({ error: "Admin storage unavailable", detail: err?.message || "operation failed" }, 503);
  }
}
