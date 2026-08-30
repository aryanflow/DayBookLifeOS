/** In-memory API stores for local Vite dev (mirrors Netlify functions). */
export function syncDevPlugin() {
  const mem = new Map();
  const logEvents = [];
  const blockedUsers = new Set();
  const devAdminKey = process.env.LOGS_ADMIN_KEY || process.env.VITE_LOGS_ADMIN_KEY || "dev-admin";

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
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Admin key required" }));
          return;
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
