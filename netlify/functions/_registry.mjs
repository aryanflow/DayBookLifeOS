const REGISTRY_KEY = "registry";

export async function touchUserRegistry(store, { userId, userName, createdAt, pin, syncId, pinOnly = false }) {
  if (!userId || !userName) return;
  const registry = (await store.get(REGISTRY_KEY, { type: "json" })) || { users: {} };
  const existing = registry.users[userId] || {};
  registry.users[userId] = {
    userId,
    userName: String(userName).trim(),
    createdAt: existing.createdAt || createdAt || new Date().toISOString().slice(0, 10),
    lastActivityAt: pinOnly ? existing.lastActivityAt || new Date().toISOString() : new Date().toISOString(),
    pin: pin !== undefined
      ? pin === null && !pinOnly
        ? existing.pin ?? null
        : pin
      : existing.pin ?? null,
    syncId: syncId !== undefined ? syncId : existing.syncId ?? null,
  };
  await store.setJSON(REGISTRY_KEY, registry);
}

export async function findUserByName(store, userName) {
  const registry = (await store.get(REGISTRY_KEY, { type: "json" })) || { users: {} };
  const key = String(userName || "")
    .trim()
    .toLowerCase();
  return Object.values(registry.users).find((u) => u.userName.trim().toLowerCase() === key) || null;
}
