import { useState, useCallback, useEffect, useRef } from "react";
import { useTheme, ThemeProvider } from "./theme/ThemeContext";
import { useDaybookStore } from "./hooks/useDaybookStore";
import { useToast } from "./hooks/useToast";
import { useSync } from "./hooks/useSync";
import { useHabitStreak, useToggleHabit } from "./hooks/useHabits";
import { WelcomeScreen } from "./components/auth/WelcomeScreen";
import { UserSelectScreen } from "./components/auth/UserSelectScreen";
import { LockScreen } from "./components/auth/LockScreen";
import { ContinueScreen } from "./components/auth/ContinueScreen";
import { OrphanedDataScreen } from "./components/auth/OrphanedDataScreen";
import { Header } from "./components/layout/Header";
import { BottomNav, SideNav } from "./components/layout/BottomNav";
import { SettingsSheet } from "./components/layout/SettingsSheet";
import { Toast } from "./components/layout/Toast";
import { InstallBanner } from "./components/layout/InstallBanner";
import { TodayView } from "./components/views/TodayView";
import { HabitsView } from "./components/views/HabitsView";
import { MoneyView } from "./components/views/MoneyView";
import { FoodView } from "./components/views/FoodView";
import { WorkView } from "./components/views/WorkView";
import { TrendsView } from "./components/views/TrendsView";
import { dkey } from "./lib/dates";
import { exportData, exportCSV, parseBackupJSON, mergeBackup } from "./lib/export";
import { hasLegacyOrphanData } from "./lib/migrate";
import { currencySymbol } from "./constants";
import { fontBody } from "./theme/colors";
import { logActivity } from "./lib/activityLog";
import { registerUserProfile, checkUserDeleted } from "./lib/userRegistry";
import { ActivityLogProvider } from "./hooks/useActivityLogger";
import "./styles/global.css";

function DaybookApp({ store }) {
  const { toast, ping, dismiss } = useToast();
  const [tab, setTab] = useState("today");
  const [showSettings, setShowSettings] = useState(false);
  const [viewDate, setViewDate] = useState(dkey());
  const [showDays, setShowDays] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const {
    app,
    users,
    activeUser,
    pendingUser,
    profile,
    habits,
    setHabits,
    habitLog,
    setHabitLog,
    meals,
    setMeals,
    spends,
    setSpends,
    budget,
    setBudget,
    dark,
    setDark,
    currency,
    water,
    setWater,
    sleep,
    setSleep,
    notes,
    setNotes,
    work,
    setWork,
    setProfile,
    renameUser,
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
  } = store;

  const { T } = useTheme();
  const sym = currencySymbol(currency);
  const today = dkey();
  const day = viewDate;
  const isToday = day === today;
  const doneToday = habitLog[day] || [];
  const habitPct = habits.length ? doneToday.length / habits.length : 0;
  const mealsToday = meals.filter((m) => m.date === day);
  const spendsToday = spends.filter((s) => s.date === day);
  const spendTotalToday = spendsToday.reduce((a, s) => a + s.amount, 0);

  const streak = useHabitStreak(habitLog);
  const baseToggleHabit = useToggleHabit(habitLog, setHabitLog, day);
  const prevActiveId = useRef(null);
  const prevPersistWarning = useRef(false);

  const logCtx = useCallback(
    (action, detail) => {
      if (!profile?.name) return;
      logActivity(action, {
        userName: profile.name,
        userId: profile.id,
        detail: { tab, day, isToday, ...(detail || {}) },
      });
    },
    [profile, tab, day, isToday]
  );

  const logErr = useCallback(
    (action, error, detail) => {
      logCtx(action, {
        ...(detail || {}),
        level: "error",
        message: error?.message || String(error),
        stack: error?.stack?.split("\n").slice(0, 4).join(" | "),
      });
    },
    [logCtx]
  );

  const sync = useSync({ app: store.app, importApp: store.importApp, logEvent: logCtx, logError: logErr });

  useEffect(() => {
    if (persistWarning && !prevPersistWarning.current && profile?.name) {
      logCtx("storage.warning", { message: "local persistence blocked or failed" });
    }
    prevPersistWarning.current = persistWarning;
  }, [persistWarning, profile?.name, logCtx]);

  useEffect(() => {
    if (activeUser?.id && activeUser.id !== prevActiveId.current) {
      logCtx("user.login");
      registerUserProfile({
        userId: activeUser.id,
        userName: activeUser.name,
        createdAt: activeUser.createdAt,
        pin: null,
      });
    }
    prevActiveId.current = activeUser?.id ?? null;
  }, [activeUser?.id, activeUser?.name, activeUser?.createdAt, logCtx]);

  useEffect(() => {
    if (!activeUser?.id) return undefined;
    let cancelled = false;
    checkUserDeleted(activeUser.id).then((deleted) => {
      if (cancelled || !deleted) return;
      const removed = deleteUser(activeUser.id);
      if (removed) {
        ping(`${removed.user.name} was removed by admin`, () => restoreUser(removed));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeUser?.id, deleteUser, restoreUser, ping]);

  const handleLogout = useCallback(() => {
    if (profile?.name) logCtx("user.logout");
    logout();
  }, [logout, profile, logCtx]);

  const changeTab = useCallback(
    (next) => {
      if (next !== tab) logCtx("nav.tab.changed", { from: tab, to: next });
      setTab(next);
    },
    [tab, logCtx]
  );

  const changeViewDate = useCallback(
    (next) => {
      if (next !== day) logCtx("nav.day.changed", { from: day, to: next });
      setViewDate(next);
    },
    [day, logCtx]
  );

  const openSettings = useCallback(() => {
    logCtx("settings.opened");
    setShowSettings(true);
  }, [logCtx]);

  const logSetSpends = useCallback(
    (fn) => {
      setSpends((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        if (profile && Array.isArray(next) && next.length > prev.length) {
          const added = next[next.length - 1];
          logCtx("spend.added", { amount: added.amount, note: added.note, cat: added.cat, date: added.date });
        }
        return next;
      });
    },
    [setSpends, profile, logCtx]
  );

  const logSetMeals = useCallback(
    (fn) => {
      setMeals((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        if (profile && Array.isArray(next) && next.length > prev.length) {
          const added = next[next.length - 1];
          logCtx("meal.added", { name: added.name, quality: added.quality, date: added.date });
        }
        return next;
      });
    },
    [setMeals, profile, logCtx]
  );

  const toggleHabit = useCallback(
    (id) => {
      const wasDone = doneToday.includes(id);
      baseToggleHabit(id);
      if (profile) {
        const habit = habits.find((h) => h.id === id);
        logCtx("habit.toggled", { habit: habit?.name || id, done: !wasDone });
      }
    },
    [baseToggleHabit, habits, profile, doneToday, logCtx]
  );

  const handleRestore = (data) => {
    try {
      importApp(mergeBackup(app, data));
      const name = activeUser?.name || users[0]?.name;
      if (name) logCtx("backup.imported");
      ping("Backup restored");
    } catch (e) {
      logErr("backup.import.failed", e);
      ping("That file didn't look like a Daybook backup");
    }
  };

  const handleImport = (file) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        handleRestore(parseBackupJSON(r.result));
      } catch (e) {
        logErr("backup.import.failed", e, { stage: "parse" });
        ping("That file didn't look like a Daybook backup");
      }
    };
    r.onerror = () => logErr("backup.import.failed", new Error("Could not read file"), { stage: "read" });
    r.readAsText(file);
  };

  const handleAddUser = (u) => {
    const result = addUser(u);
    if (!result.ok) {
      logCtx("user.create.failed", { reason: result.error || "name_taken", name: u.name });
      ping("That name is already taken - pick another");
      return false;
    }
    logCtx("user.created", { name: result.user.name });
    registerUserProfile({
      userId: result.user.id,
      userName: result.user.name,
      createdAt: result.user.createdAt,
      pin: u.pinPlain ?? null,
    });
    return true;
  };

  if (showAddUser) {
    return (
      <WelcomeScreen
        title="Add person"
        existingUsers={users}
        onDone={(u) => {
          if (handleAddUser(u)) setShowAddUser(false);
        }}
        onRestore={handleRestore}
        onDemo={addDemoUser}
      />
    );
  }

  if (users.length === 0) {
    if (hasLegacyOrphanData()) {
      return (
        <OrphanedDataScreen
          onRestore={handleRestore}
          onErase={() => {
            const snapshot = eraseAll();
            ping("All Daybook data erased", () => restoreErase(snapshot));
          }}
        />
      );
    }
    return (
      <WelcomeScreen
        onDone={(u) => handleAddUser(u)}
        existingUsers={users}
        onRestore={handleRestore}
        onDemo={addDemoUser}
      />
    );
  }

  if (pendingUser) {
    if (pendingUser.pin) {
      return (
        <LockScreen
          profile={pendingUser}
          onUnlock={() => loginUser(pendingUser.id)}
          onForgotPin={() => {
            const removed = deleteUser(pendingUser.id);
            if (removed) ping(`${removed.user.name} removed`, () => restoreUser(removed));
          }}
          onBack={cancelSelect}
        />
      );
    }
    return (
      <ContinueScreen
        profile={pendingUser}
        onContinue={() => loginUser(pendingUser.id)}
        onBack={cancelSelect}
      />
    );
  }

  if (!activeUser) {
    return (
      <UserSelectScreen
        users={users}
        onSelect={selectUser}
        onAddUser={() => setShowAddUser(true)}
        onDemo={addDemoUser}
      />
    );
  }

  return (
    <ActivityLogProvider profile={profile} meta={{ tab, day, isToday }}>
      <div className="app-shell" style={{ ...fontBody, color: T.ink }}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <SideNav
          tab={tab}
          setTab={changeTab}
          profileName={profile.name}
          onLock={handleLogout}
          onSettings={openSettings}
          syncEnabled={sync.enabled}
          syncStatus={sync.status}
        />

        <div
          className={`app-main ${tab === "money" || tab === "trends" ? "app-main-wide" : ""} ${tab === "today" ? "app-main-today" : ""} ${tab === "habits" || tab === "food" || tab === "work" ? "app-main-focus" : ""}`}
        >
          <Header
            profile={profile}
            tab={tab}
            showUserChip={tab !== "today"}
            today={today}
            day={day}
            isToday={isToday}
            showDays={showDays}
            setShowDays={setShowDays}
            setViewDate={changeViewDate}
            onLock={handleLogout}
            setShowSettings={openSettings}
          />

        <InstallBanner />

        {persistWarning && (
          <div className="persist-banner" role="status">
            Storage unavailable - your changes may not survive a refresh. Export a backup in Settings.
          </div>
        )}

        <main id="main-content" className={`main-content ${tab === "money" || tab === "trends" ? "main-content-wide" : ""}`}>
          <div key={tab} className={`view-enter view-${tab}`}>
            {tab === "today" && (
              <TodayView
                habits={habits}
                doneToday={doneToday}
                toggleHabit={toggleHabit}
                habitPct={habitPct}
                mealsToday={mealsToday}
                spendTotalToday={spendTotalToday}
                budget={budget}
                currencySymbol={sym}
                setSpends={logSetSpends}
                setMeals={logSetMeals}
                today={day}
                isToday={isToday}
                ping={ping}
                streak={streak}
                water={water}
                setWater={setWater}
                sleep={sleep}
                setSleep={setSleep}
                notes={notes}
                setNotes={setNotes}
                userName={profile.name}
              />
            )}
            {tab === "habits" && (
              <HabitsView
                habits={habits}
                setHabits={setHabits}
                habitLog={habitLog}
                toggleHabit={toggleHabit}
                doneToday={doneToday}
                streak={streak}
                ping={ping}
              />
            )}
            {tab === "money" && (
              <MoneyView
                spends={spends}
                setSpends={setSpends}
                today={today}
                budget={budget}
                currencySymbol={sym}
                ping={ping}
                goToday={() => changeTab("today")}
              />
            )}
            {tab === "food" && (
              <FoodView meals={meals} setMeals={setMeals} today={today} ping={ping} goToday={() => changeTab("today")} />
            )}
            {tab === "work" && <WorkView work={work} setWork={setWork} today={today} ping={ping} />}
            {tab === "trends" && (
              <TrendsView
                spends={spends}
                meals={meals}
                habits={habits}
                habitLog={habitLog}
                budget={budget}
                currencySymbol={sym}
                water={water}
                sleep={sleep}
                notes={notes}
                goToday={() => changeTab("today")}
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav tab={tab} setTab={changeTab} />

      {showSettings && (
        <SettingsSheet
          profile={profile}
          setProfile={setProfile}
          dark={dark}
          setDark={setDark}
          budget={budget}
          setBudget={setBudget}
          currency={currency}
          setCurrency={store.setCurrency}
          users={users}
          exportData={() => {
            exportData(app, profile.id);
            logCtx("backup.exported", { scope: "user" });
          }}
          exportAllData={() => {
            exportData(app);
            logCtx("backup.exported", { scope: "all" });
          }}
          exportCSV={() => {
            exportCSV(state, habits);
            logCtx("backup.exported.csv");
            ping("CSV exported - opens in Excel");
          }}
          importData={handleImport}
          onLogout={logout}
          onDeleteUser={() => {
            const removed = deleteUser(profile.id);
            if (removed) logCtx("user.deleted", { name: removed.user.name });
            return removed;
          }}
          onRestoreUser={restoreUser}
          onClose={() => setShowSettings(false)}
          ping={ping}
          renameUser={renameUser}
          sync={sync}
        />
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
    </ActivityLogProvider>
  );
}

export default function App() {
  const store = useDaybookStore();
  // Per-user dark mode applies only after login - keeps auth screens consistent
  const themeDark = store.activeUser ? store.dark : false;
  return (
    <ThemeProvider dark={themeDark}>
      <DaybookApp store={store} />
    </ThemeProvider>
  );
}
