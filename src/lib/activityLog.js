import { createDeviceId } from "./syncConfig";

const DEVICE_ID_KEY = "db_device_id";

function deviceId() {
  let id = null;
  try {
    id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = createDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
  } catch {
    id = createDeviceId();
  }
  return id;
}

function logsUrl() {
  if (import.meta.env.VITE_LOGS_API_URL) {
    return import.meta.env.VITE_LOGS_API_URL.replace(/\/$/, "");
  }
  if (typeof window === "undefined") return "";
  if (import.meta.env.DEV) return `${window.location.origin}/api/logs`;
  return `${window.location.origin}/.netlify/functions/logs`;
}

export function isActivityLogEnabled() {
  return !!logsUrl();
}

export function logActivity(action, { userName, userId, detail } = {}) {
  const url = logsUrl();
  if (!url || !userName) return;

  const payload = {
    ts: new Date().toISOString(),
    userName,
    userId: userId || null,
    action,
    detail: detail ?? null,
    deviceId: deviceId(),
    path: typeof window !== "undefined" ? window.location.pathname : null,
  };

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

export function installGlobalErrorLogging(getContext) {
  const onError = (event) => {
    const ctx = getContext();
    if (!ctx?.userName) return;
    logActivity("app.error", {
      userName: ctx.userName,
      userId: ctx.userId,
      detail: {
        ...(ctx.detail || {}),
        level: "error",
        message: event.message || "Unknown error",
        source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
      },
    });
  };

  const onRejection = (event) => {
    const ctx = getContext();
    if (!ctx?.userName) return;
    const reason = event.reason;
    logActivity("app.unhandled_rejection", {
      userName: ctx.userName,
      userId: ctx.userId,
      detail: {
        ...(ctx.detail || {}),
        level: "error",
        message: reason?.message || String(reason ?? "Unhandled rejection"),
        stack: reason?.stack?.split("\n").slice(0, 4).join(" | "),
      },
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

export function getLogsApiUrl() {
  return logsUrl();
}

export function getAdminKeyFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("key") || "";
}

export function loadStoredAdminKey() {
  try {
    return sessionStorage.getItem("db_logs_admin_key") || "";
  } catch {
    return "";
  }
}

export function saveAdminKey(key) {
  try {
    if (key) sessionStorage.setItem("db_logs_admin_key", key);
    else sessionStorage.removeItem("db_logs_admin_key");
  } catch {
    /* ignore */
  }
}

export async function fetchLogs({ adminKey, user, pin, limit = 200 }) {
  const base = logsUrl();
  if (!base) throw new Error("Logs API not configured");

  const params = new URLSearchParams({ limit: String(limit) });
  if (user) params.set("user", user);
  if (pin !== undefined && pin !== null) params.set("pin", pin);

  const headers = {};
  if (adminKey) headers["X-Admin-Key"] = adminKey;

  const res = await fetch(`${base}?${params}`, { headers });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not load logs");
  return data;
}

export async function deleteUserLogs({ adminKey, userName }) {
  const base = logsUrl();
  if (!base) throw new Error("Logs API not configured");

  const params = new URLSearchParams({ user: userName });
  const res = await fetch(`${base}?${params}`, {
    method: "DELETE",
    headers: { "X-Admin-Key": adminKey },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not delete user logs");
  return data;
}
