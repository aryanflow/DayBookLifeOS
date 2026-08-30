import { encryptApp, decryptApp } from "./syncCrypto";
import { normalizeBackup } from "./migrate";

function resolveApiBase() {
  const env = (import.meta.env.VITE_SYNC_API_URL || "").replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "";
}

export function isSyncAvailable() {
  return !!resolveApiBase();
}

export function getSyncApiUrl() {
  return resolveApiBase();
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function fetchRemote(syncId) {
  const base = resolveApiBase();
  const res = await fetch(`${base}/sync`, {
    method: "GET",
    headers: { "X-Sync-Id": syncId },
  });
  if (!res.ok) {
    const err = new Error("Could not reach sync server");
    err.status = res.status;
    throw err;
  }
  return parseJson(res);
}

export async function pushRemote(syncId, record) {
  const base = resolveApiBase();
  const res = await fetch(`${base}/sync`, {
    method: "PUT",
    headers: {
      "X-Sync-Id": syncId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  });

  const data = await parseJson(res);

  if (res.status === 409) {
    return { conflict: true, remote: data?.remote || null };
  }

  if (!res.ok) {
    const err = new Error(data?.error || "Sync upload failed");
    err.status = res.status;
    throw err;
  }

  return { conflict: false, ...data };
}

export async function encryptAndPush(syncKey, syncId, app, meta) {
  const encrypted = await encryptApp(syncKey, app);
  return pushRemote(syncId, {
    encrypted,
    updatedAt: meta.updatedAt,
    deviceId: meta.deviceId,
  });
}

export async function pullAndDecrypt(syncKey, remote) {
  if (!remote?.encrypted) return null;
  const app = await decryptApp(syncKey, remote.encrypted);
  return normalizeBackup(app);
}
