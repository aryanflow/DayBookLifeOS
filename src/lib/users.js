import { DEFAULT_HABITS, DEFAULT_CURRENCY } from "../constants";

export function createUserId() {
  return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Trim and collapse whitespace for consistent comparison. */
export function normalizeUserName(name) {
  return (name ?? "").trim().replace(/\s+/g, " ");
}

/** Case-insensitive name check; optional excludeUserId for renames. */
export function isUserNameTaken(users, name, excludeUserId = null) {
  const key = normalizeUserName(name).toLowerCase();
  if (!key) return false;
  return (users ?? []).some(
    (u) => u.id !== excludeUserId && normalizeUserName(u.name).toLowerCase() === key
  );
}

/** Pick a free display name when restoring or importing would collide. */
export function uniqueUserName(users, baseName, excludeUserId = null) {
  const root = normalizeUserName(baseName) || "Person";
  if (!isUserNameTaken(users, root, excludeUserId)) return root;
  let i = 2;
  while (isUserNameTaken(users, `${root} (${i})`, excludeUserId)) i += 1;
  return `${root} (${i})`;
}

export function emptyUserData() {
  return {
    habits: [...DEFAULT_HABITS],
    habitLog: {},
    meals: [],
    spends: [],
    water: {},
    sleep: {},
    notes: {},
    work: { tasks: [], notes: [] },
  };
}

export function createUser({ name, pin = null, createdAt, currency = DEFAULT_CURRENCY, budget = 1000, dark = false }) {
  const id = createUserId();
  const displayName = normalizeUserName(name);
  return {
    user: { id, name: displayName, pin, createdAt, currency, budget, dark },
    data: emptyUserData(),
  };
}

export function getUserInitial(name) {
  return (name?.trim()?.[0] || "?").toUpperCase();
}
