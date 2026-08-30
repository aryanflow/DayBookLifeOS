const memStore = {};
let persistBlocked = false;

export function isPersistBlocked() {
  return persistBlocked;
}

export const store = {
  get(k, fallback) {
    try {
      const v = window.localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch {
      persistBlocked = true;
      return memStore[k] !== undefined ? memStore[k] : fallback;
    }
  },
  set(k, v) {
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
      persistBlocked = false;
    } catch {
      persistBlocked = true;
      memStore[k] = v;
    }
  },
  remove(k) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      persistBlocked = true;
      delete memStore[k];
    }
  },
  clear(keys) {
    keys.forEach((k) => store.remove(k));
  },
};
