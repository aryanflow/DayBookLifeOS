import { store } from "./storage";

export const SYNC_CONFIG_KEY = "db_sync_config";

const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function loadSyncConfig() {
  return store.get(SYNC_CONFIG_KEY, null);
}

export function saveSyncConfig(config) {
  if (config) store.set(SYNC_CONFIG_KEY, config);
  else store.remove(SYNC_CONFIG_KEY);
}

export function normalizeSyncKey(key) {
  return String(key || "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

export function formatSyncKey(key) {
  const n = normalizeSyncKey(key);
  if (n.length !== 24) return key;
  return n.match(/.{1,4}/g).join("-");
}

export function isValidSyncKey(key) {
  return normalizeSyncKey(key).length === 24;
}

export function generateSyncKey() {
  const groups = [];
  for (let g = 0; g < 6; g++) {
    let part = "";
    for (let i = 0; i < 4; i++) {
      part += KEY_CHARS[Math.floor(Math.random() * KEY_CHARS.length)];
    }
    groups.push(part);
  }
  return groups.join("-");
}

export function createDeviceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
