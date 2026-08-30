import { encryptApp, decryptApp } from "./syncCrypto";
import { normalizeBackup } from "./migrate";

function resolveSyncUrl() {
  const env = (import.meta.env.VITE_SYNC_API_URL || "").replace(/\/$/, "");
  if (env) return `${env}/sync`;
  if (typeof window !== "undefined") {
    // Dev: Vite middleware. Prod: call the function directly (avoids _redirects / PUT on static files).
    if (import.meta.env.DEV) return `${window.location.origin}/api/sync`;
    return `${window.location.origin}/.netlify/functions/sync`;
  }
  return "";
}

export function isSyncAvailable() {
  return !!resolveSyncUrl();
}

export function getSyncApiUrl() {
  return resolveSyncUrl().replace(/\/sync$/, "");
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 80);
    const err = new Error(
      preview.startsWith("<!")
        ? "Sync API not reachable - redeploy with Netlify Functions enabled"
        : preview || "Sync server returned an invalid response"
    );
    err.status = res.status;
    throw err;
  }
}

export async function fetchRemote(syncId) {
  const url = resolveSyncUrl();
  const res = await fetch(url, {
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
  const url = resolveSyncUrl();
  const res = await fetch(url, {
    method: "POST",
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
