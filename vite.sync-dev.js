/** In-memory sync store for local Vite dev (mirrors netlify/functions/sync.mjs). */
export function syncDevPlugin() {
  const mem = new Map();

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Sync-Id",
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

  return {
    name: "daybook-sync-dev",
    configureServer(server) {
      server.middlewares.use("/api/sync", async (req, res) => {
        Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

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

        if (req.method === "PUT") {
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
