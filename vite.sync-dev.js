/** In-memory API stores for local Vite dev (mirrors Netlify functions). */
export function syncDevPlugin() {
  const mem = new Map();
  const logEvents = [];
  const blockedUsers = new Set();
  const registry = { users: {} };
  const deletedIds = new Set();
  const devAdminKey = process.env.LOGS_ADMIN_KEY || process.env.VITE_LOGS_ADMIN_KEY || "dev-admin";

  const adminCors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
  };

  const touchRegistry = (body) => {
    const existing = registry.users[body.userId] || {};
    registry.users[body.userId] = {
      userId: body.userId,
      userName: body.userName,
      createdAt: existing.createdAt || body.createdAt || new Date().toISOString().slice(0, 10),
      lastActivityAt: body.pinOnly ? existing.lastActivityAt || new Date().toISOString() : new Date().toISOString(),
      pin: body.pin !== undefined
        ? body.pin === null && !body.pinOnly
          ? existing.pin ?? null
          : body.pin
        : existing.pin ?? null,
      syncId: body.syncId !== undefined ? body.syncId : existing.syncId ?? null,
    };
  };

  const findByName = (name) => {
    const key = normalizeName(name);
    return Object.values(registry.users).find((u) => normalizeName(u.userName) === key) || null;
  };

  const syncCors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Sync-Id",
  };

  const logsCors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
  };

  const isValidSyncId = (id) => typeof id === "string" && /^[a-f0-9]{64}$/.test(id);

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        try {
          resolve(data ? JSON.parse(data) : null);
        } catch {
          reject(new Error("Invalid JSON"));
        }
      });
      req.on("error", reject);
    });

  const normalizeName = (name) => String(name || "").trim().toLowerCase();

  return {
    name: "daybook-sync-dev",
    configureServer(server) {
      server.middlewares.use("/api/logs", async (req, res) => {
        Object.entries(logsCors).forEach(([k, v]) => res.setHeader(k, v));

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url, "http://localhost");
        const adminHeader = req.headers["x-admin-key"] || url.searchParams.get("key");

        if (req.method === "POST") {
          let body;
          try {
            body = await readBody(req);
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
            return;
          }

          const userName = String(body?.userName || "").trim();
          if (!userName || !body?.action) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing userName or action" }));
            return;
          }

          if (blockedUsers.has(normalizeName(userName))) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, skipped: true }));
            return;
          }

          if (body.userId) touchRegistry(body);

          logEvents.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ts: body.ts || new Date().toISOString(),
            userId: body.userId || null,
            userName,
            action: body.action,
            detail: body.detail ?? null,
            deviceId: body.deviceId || null,
          });

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (adminHeader !== devAdminKey) {
          const userFilter = url.searchParams.get("user");
          const userPin = url.searchParams.get("pin") ?? "";
          if (req.method === "GET" && userFilter) {
            const record = findByName(userFilter);
            if (!record) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "User not found" }));
              return;
            }
            if (record.pin && String(record.pin) !== String(userPin)) {
              res.statusCode = 401;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: userPin ? "PIN incorrect" : "PIN required" }));
              return;
            }
          } else {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Admin key or user PIN required" }));
            return;
          }
        }

        if (req.method === "GET") {
          const userFilter = url.searchParams.get("user");
          let filtered = logEvents;
          if (userFilter) {
            const n = normalizeName(userFilter);
            filtered = logEvents.filter((e) => normalizeName(e.userName) === n);
          }
          const users = [...new Set(logEvents.map((e) => e.userName))].sort();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              events: filtered.slice(-200).reverse(),
              users,
              blocked: [...blockedUsers],
              total: logEvents.length,
            })
          );
          return;
        }

        if (req.method === "DELETE") {
          const userName = url.searchParams.get("user");
          if (!userName) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing user" }));
            return;
          }
          const n = normalizeName(userName);
          const before = logEvents.length;
          for (let i = logEvents.length - 1; i >= 0; i--) {
            if (normalizeName(logEvents[i].userName) === n) logEvents.splice(i, 1);
          }
          blockedUsers.add(n);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, removed: before - logEvents.length, blocked: n }));
          return;
        }

        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
      });

      server.middlewares.use("/api/admin", async (req, res) => {
        Object.entries(adminCors).forEach(([k, v]) => res.setHeader(k, v));
        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url, "http://localhost");
        const adminHeader = req.headers["x-admin-key"] || url.searchParams.get("key");

        if (req.method === "POST") {
          let body;
          try {
            body = await readBody(req);
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid JSON" }));
            return;
          }
          if (!body?.userId || !body?.userName) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Missing userId or userName" }));
            return;
          }
          if (deletedIds.has(body.userId)) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: "User removed by admin", deleted: true }));
            return;
          }
          touchRegistry(body);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (req.method === "GET" && url.searchParams.get("check")) {
          const userId = url.searchParams.get("userId");
          res.statusCode = 200;
          res.end(JSON.stringify({ deleted: deletedIds.has(userId) }));
          return;
        }

        if (req.method === "GET" && url.searchParams.get("verify")) {
          const record = findByName(url.searchParams.get("user"));
          if (!record) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "User not found" }));
            return;
          }
          const pin = url.searchParams.get("pin") ?? "";
          if (record.pin) {
            if (!String(pin)) {
              res.statusCode = 401;
              res.end(JSON.stringify({ error: "PIN required" }));
              return;
            }
            if (String(record.pin) !== String(pin)) {
              res.statusCode = 401;
              res.end(JSON.stringify({ error: "PIN incorrect" }));
              return;
            }
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, userId: record.userId, userName: record.userName, pinRequired: !!record.pin }));
          return;
        }

        if (adminHeader !== devAdminKey) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: "Admin key required" }));
          return;
        }

        if (req.method === "GET") {
          const users = Object.values(registry.users)
            .filter((u) => !deletedIds.has(u.userId))
            .map((u) => ({
              ...u,
              eventCount: logEvents.filter((e) => e.userId === u.userId).length,
            }));
          res.statusCode = 200;
          res.end(JSON.stringify({ users, total: users.length, deletedIds: [...deletedIds] }));
          return;
        }

        if (req.method === "DELETE") {
          const userId = url.searchParams.get("userId");
          const record = userId ? registry.users[userId] : findByName(url.searchParams.get("user"));
          if (!record) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "User not found" }));
            return;
          }
          delete registry.users[record.userId];
          deletedIds.add(record.userId);
          blockedUsers.add(normalizeName(record.userName));
          for (let i = logEvents.length - 1; i >= 0; i--) {
            if (logEvents[i].userId === record.userId) logEvents.splice(i, 1);
          }
          if (record.syncId) mem.delete(record.syncId);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, userId: record.userId, userName: record.userName }));
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
      });

      server.middlewares.use("/api/sync", async (req, res) => {
        Object.entries(syncCors).forEach(([k, v]) => res.setHeader(k, v));

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const syncId = req.headers["x-sync-id"];
        if (!isValidSyncId(syncId)) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid sync id" }));
          return;
        }

        if (req.method === "GET") {
          const data = mem.get(syncId) ?? null;
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
          return;
        }

        if (req.method === "POST" || req.method === "PUT") {
          let body;
          try {
            body = await readBody(req);
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
            return;
          }

          if (!body?.encrypted || typeof body.updatedAt !== "number") {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing encrypted payload or updatedAt" }));
            return;
          }

          const existing = mem.get(syncId);
          if (existing?.updatedAt > body.updatedAt) {
            res.statusCode = 409;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ conflict: true, remote: existing }));
            return;
          }

          const record = {
            encrypted: body.encrypted,
            updatedAt: body.updatedAt,
            deviceId: body.deviceId || null,
          };
          mem.set(syncId, record);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, updatedAt: record.updatedAt }));
          return;
        }

        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
      });
    },
  };
}
