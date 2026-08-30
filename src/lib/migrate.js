import { store } from "./storage";
import { STORAGE_KEY, LEGACY_KEYS, DEFAULT_HABITS, DEFAULT_CURRENCY } from "../constants";
import { createUserId, emptyUserData } from "./users";

function emptyApp() {
  return { version: 2, users: [], activeUserId: null, userData: {} };
}

function migrateLegacy() {
  const profile = store.get("db_profile", null);
  if (!profile?.name) return null;

  const id = createUserId();
  const user = {
    id,
    name: profile.name,
    pin: profile.pin || null,
    createdAt: profile.createdAt || new Date().toISOString().slice(0, 10),
    currency: DEFAULT_CURRENCY,
    budget: store.get("db_budget", 1000),
    dark: store.get("db_dark", false),
  };

  const data = {
    habits: store.get("db_habits", DEFAULT_HABITS),
    habitLog: store.get("db_habitLog", {}),
    meals: store.get("db_meals", []),
    spends: store.get("db_spends", []),
    water: store.get("db_water", {}),
    sleep: store.get("db_sleep", {}),
    notes: store.get("db_notes", {}),
    work: store.get("db_work", { tasks: [], notes: [] }),
  };

  return {
    version: 2,
    users: [user],
    activeUserId: null,
    userData: { [id]: data },
  };
}

function migrateV1Backup(data) {
  if (data.version === 2) return data;
  if (!data.profile?.name) return null;

  const id = createUserId();
  const user = {
    id,
    name: data.profile.name,
    pin: data.profile.pin || null,
    createdAt: data.profile.createdAt || new Date().toISOString().slice(0, 10),
    currency: data.currency || DEFAULT_CURRENCY,
    budget: data.budget ?? 1000,
    dark: data.dark ?? false,
  };

  const userData = {
    habits: data.habits || DEFAULT_HABITS,
    habitLog: data.habitLog || {},
    meals: data.meals || [],
    spends: data.spends || [],
    water: data.water || {},
    sleep: data.sleep || {},
    notes: data.notes || {},
    work: data.work || { tasks: [], notes: [] },
  };

  return {
    version: 2,
    users: [user],
    activeUserId: null,
    userData: { [id]: userData },
  };
}

export function loadApp() {
  let app = store.get(STORAGE_KEY, null);

  if (!app) {
    app = migrateLegacy();
    if (app) {
      store.set(STORAGE_KEY, app);
      LEGACY_KEYS.forEach((k) => store.remove(k));
    } else {
      app = emptyApp();
    }
  }

  if (!app.version) app.version = 2;
  if (!app.users) app.users = [];
  if (!app.userData) app.userData = {};

  return app;
}

export function saveApp(app) {
  store.set(STORAGE_KEY, app);
}

export function clearApp() {
  store.remove(STORAGE_KEY);
  LEGACY_KEYS.forEach((k) => store.remove(k));
}

export function normalizeBackup(data) {
  if (data?.version === 2 && Array.isArray(data.users)) return data;
  return migrateV1Backup(data);
}

export function hasLegacyOrphanData() {
  if (store.get(STORAGE_KEY, null)) return false;
  return LEGACY_KEYS.some((k) => {
    if (k === "db_profile") return !!store.get(k, null);
    const v = store.get(k, null);
    if (v === null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  });
}
