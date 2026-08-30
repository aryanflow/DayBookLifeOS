function adminUrl() {
  if (import.meta.env.VITE_ADMIN_API_URL) {
    return import.meta.env.VITE_ADMIN_API_URL.replace(/\/$/, "");
  }
  if (typeof window === "undefined") return "";
  if (import.meta.env.DEV) return `${window.location.origin}/api/admin`;
  return `${window.location.origin}/.netlify/functions/admin`;
}

export function isUserRegistryEnabled() {
  return !!adminUrl();
}

/** Register or update user in server registry (PIN stored for admin recovery). */
export function registerUserProfile({ userId, userName, createdAt, pin, syncId, pinOnly = false }) {
  const url = adminUrl();
  if (!url || !userId || !userName) return;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, userName, createdAt, pin, syncId, pinOnly }),
    keepalive: true,
  }).catch(() => {});
}

export async function checkUserDeleted(userId) {
  const url = adminUrl();
  if (!url || !userId) return false;
  const res = await fetch(`${url}?check=1&userId=${encodeURIComponent(userId)}`);
  const data = await res.json().catch(() => ({}));
  return !!data.deleted;
}

export async function verifyUserAccess({ userName, pin = "" }) {
  const url = adminUrl();
  if (!url) throw new Error("Registry not configured");
  const params = new URLSearchParams({ verify: "1", user: userName, pin });
  const res = await fetch(`${url}?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not verify");
  return data;
}

export async function fetchAdminUsers(adminKey) {
  const url = adminUrl();
  if (!url) throw new Error("Admin API not configured");
  const res = await fetch(`${url}?${new URLSearchParams({ key: adminKey })}`, {
    headers: { "X-Admin-Key": adminKey },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not load users");
  return data;
}

export async function deleteAdminUser({ adminKey, userId, userName }) {
  const url = adminUrl();
  if (!url) throw new Error("Admin API not configured");
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (userName) params.set("user", userName);
  const res = await fetch(`${url}?${params}`, {
    method: "DELETE",
    headers: { "X-Admin-Key": adminKey },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not delete user");
  return data;
}

export function getAdminApiUrl() {
  return adminUrl();
}
