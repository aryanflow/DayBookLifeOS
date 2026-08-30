import { useState, useEffect, useCallback, useMemo } from "react";
import { loadApp, saveApp, clearApp } from "../lib/migrate";
import { isPersistBlocked, store } from "../lib/storage";
import { STORAGE_KEY, LEGACY_KEYS } from "../constants";
import { createUser, emptyUserData, isUserNameTaken, normalizeUserName, uniqueUserName } from "../lib/users";
import { createDemoAccount, findDemoUser } from "../lib/demo";

export function useDaybookStore() {
  const [app, setApp] = useState(() => loadApp());
  const [pendingUserId, setPendingUserId] = useState(null);
  const [persistWarning, setPersistWarning] = useState(false);

  const activeUser = useMemo(
    () => app.users.find((u) => u.id === app.activeUserId) || null,
    [app.users, app.activeUserId]
  );

  const pendingUser = useMemo(
    () => app.users.find((u) => u.id === pendingUserId) || null,
    [app.users, pendingUserId]
  );

  const data = useMemo(() => {
    if (!app.activeUserId) return emptyUserData();
    return app.userData[app.activeUserId] || emptyUserData();
  }, [app.activeUserId, app.userData]);

  useEffect(() => {
    saveApp(app);
    setPersistWarning(isPersistBlocked());
  }, [app]);

  useEffect(() => {
    const dark = activeUser?.dark ?? false;
    document.documentElement.classList.toggle("dark", dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#0B0E14" : "#EEEAF4";
  }, [activeUser?.dark]);

  useEffect(() => {
    if (!activeUser?.pin) return;
    let hiddenAt = null;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000) {
        setApp((a) => ({ ...a, activeUserId: null }));
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [activeUser?.pin, activeUser?.id]);

  const updateUserData = useCallback(
    (fn) => {
      if (!app.activeUserId) return;
      setApp((a) => ({
        ...a,
        userData: {
          ...a.userData,
          [a.activeUserId]: fn(a.userData[a.activeUserId] || emptyUserData()),
        },
      }));
    },
    [app.activeUserId]
  );

  const setHabits = useCallback((v) => {
    updateUserData((d) => ({ ...d, habits: typeof v === "function" ? v(d.habits) : v }));
  }, [updateUserData]);

  const setHabitLog = useCallback((v) => {
    updateUserData((d) => ({ ...d, habitLog: typeof v === "function" ? v(d.habitLog) : v }));
  }, [updateUserData]);

  const setMeals = useCallback((v) => {
    updateUserData((d) => ({ ...d, meals: typeof v === "function" ? v(d.meals) : v }));
  }, [updateUserData]);

  const setSpends = useCallback((v) => {
    updateUserData((d) => ({ ...d, spends: typeof v === "function" ? v(d.spends) : v }));
  }, [updateUserData]);

  const setWater = useCallback((v) => {
    updateUserData((d) => ({ ...d, water: typeof v === "function" ? v(d.water) : v }));
  }, [updateUserData]);

  const setSleep = useCallback((v) => {
    updateUserData((d) => ({ ...d, sleep: typeof v === "function" ? v(d.sleep) : v }));
  }, [updateUserData]);

  const setNotes = useCallback((v) => {
    updateUserData((d) => ({ ...d, notes: typeof v === "function" ? v(d.notes) : v }));
  }, [updateUserData]);

  const setWork = useCallback((v) => {
    updateUserData((d) => ({ ...d, work: typeof v === "function" ? v(d.work) : v }));
  }, [updateUserData]);

  const setProfile = useCallback(
    (v) => {
      if (!app.activeUserId) return;
      setApp((a) => ({
        ...a,
        users: a.users.map((u) =>
          u.id === a.activeUserId ? { ...u, ...(typeof v === "function" ? v(u) : v) } : u
        ),
      }));
    },
    [app.activeUserId]
  );

  const setBudget = useCallback(
    (v) => {
      setProfile((u) => ({ budget: typeof v === "function" ? v(u.budget) : v }));
    },
    [setProfile]
  );

  const setDark = useCallback(
    (v) => {
      setProfile((u) => ({ dark: typeof v === "function" ? v(u.dark) : v }));
    },
    [setProfile]
  );

  const setCurrency = useCallback(
    (code) => {
      setProfile({ currency: code });
    },
    [setProfile]
  );

  const addUser = useCallback(({ name, pin, createdAt, currency, budget, dark }) => {
    let created = null;
    setApp((a) => {
      if (isUserNameTaken(a.users, name)) return a;
      const { user, data } = createUser({ name, pin, createdAt, currency, budget, dark });
      created = user;
      return {
        ...a,
        users: [...a.users, user],
        userData: { ...a.userData, [user.id]: data },
        activeUserId: user.id,
      };
    });
    if (!created) return { ok: false, error: "name_taken" };
    return { ok: true, user: created };
  }, []);

  const renameUser = useCallback((userId, name) => {
    const displayName = normalizeUserName(name);
    if (!displayName) return { ok: false, error: "empty" };
    let updated = false;
    setApp((a) => {
      if (isUserNameTaken(a.users, displayName, userId)) return a;
      updated = true;
      return {
        ...a,
        users: a.users.map((u) => (u.id === userId ? { ...u, name: displayName } : u)),
      };
    });
    if (!updated) return { ok: false, error: "name_taken" };
    return { ok: true };
  }, []);

  const addDemoUser = useCallback(() => {
    setApp((a) => {
      const existing = findDemoUser(a.users);
      if (existing) {
        return { ...a, activeUserId: existing.id };
      }
      const { user, data } = createDemoAccount();
      return {
        ...a,
        users: [...a.users, user],
        userData: { ...a.userData, [user.id]: data },
        activeUserId: user.id,
      };
    });
    setPendingUserId(null);
  }, []);

  const selectUser = useCallback((userId) => {
    setPendingUserId(userId);
  }, []);

  const loginUser = useCallback((userId) => {
    setApp((a) => ({ ...a, activeUserId: userId }));
    setPendingUserId(null);
  }, []);

  const cancelSelect = useCallback(() => setPendingUserId(null), []);

  const logout = useCallback(() => {
    setApp((a) => ({ ...a, activeUserId: null }));
    setPendingUserId(null);
  }, []);

  const deleteUser = useCallback((userId) => {
    let removed = null;
    setApp((a) => {
      const user = a.users.find((u) => u.id === userId);
      if (!user) return a;
      removed = { user, data: a.userData[userId] };
      const users = a.users.filter((u) => u.id !== userId);
      const userData = { ...a.userData };
      delete userData[userId];
      return {
        ...a,
        users,
        userData,
        activeUserId: a.activeUserId === userId ? null : a.activeUserId,
      };
    });
    setPendingUserId(null);
    return removed;
  }, []);

  const restoreUser = useCallback(({ user, data }) => {
    setApp((a) => ({
      ...a,
      users: [...a.users, user],
      userData: { ...a.userData, [user.id]: data },
      activeUserId: user.id,
    }));
    setPendingUserId(null);
  }, []);

  const eraseAll = useCallback(() => {
    const snapshot = {
      app: store.get(STORAGE_KEY, null),
      legacy: Object.fromEntries(LEGACY_KEYS.map((k) => [k, store.get(k, null)])),
    };
    clearApp();
    setApp({ version: 2, users: [], activeUserId: null, userData: {} });
    setPendingUserId(null);
    return snapshot;
  }, []);

  const restoreErase = useCallback((snapshot) => {
    if (snapshot?.app) store.set(STORAGE_KEY, snapshot.app);
    else store.remove(STORAGE_KEY);
    LEGACY_KEYS.forEach((k) => {
      const v = snapshot?.legacy?.[k];
      if (v != null) store.set(k, v);
      else store.remove(k);
    });
    setApp(loadApp());
    setPendingUserId(null);
  }, []);

  const importApp = useCallback((newApp) => {
    setApp(newApp);
    setPendingUserId(null);
  }, []);

  const profile = activeUser;
  const budget = activeUser?.budget ?? 1000;
  const dark = activeUser?.dark ?? false;
  const currency = activeUser?.currency ?? "INR";

  const state = {
    profile,
    habits: data.habits,
    habitLog: data.habitLog,
    meals: data.meals,
    spends: data.spends,
    budget,
    water: data.water,
    sleep: data.sleep,
    notes: data.notes,
    work: data.work,
    dark,
    currency,
    app,
  };

  return {
    app,
    users: app.users,
    activeUser,
    pendingUser,
    pendingUserId,
    profile,
    locked: !app.activeUserId,
    habits: data.habits,
    habitLog: data.habitLog,
    meals: data.meals,
    spends: data.spends,
    budget,
    dark,
    currency,
    water: data.water,
    sleep: data.sleep,
    notes: data.notes,
    work: data.work,
    setProfile,
    renameUser,
    setHabits,
    setHabitLog,
    setMeals,
    setSpends,
    setBudget,
    setDark,
    setCurrency,
    setWater,
    setSleep,
    setNotes,
    setWork,
    addUser,
    addDemoUser,
    selectUser,
    loginUser,
    cancelSelect,
    logout,
    deleteUser,
    restoreUser,
    eraseAll,
    restoreErase,
    importApp,
    persistWarning,
    state,
  };
}
