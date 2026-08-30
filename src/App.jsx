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
import "./styles/global.css";

function DaybookApp({ store }) {
  const { toast, ping, dismiss } = useToast();
  const sync = useSync({ app: store.app, importApp: store.importApp });
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

  useEffect(() => {
    if (activeUser?.id && activeUser.id !== prevActiveId.current) {
      logActivity("user.login", { userName: activeUser.name, userId: activeUser.id });
    }
    prevActiveId.current = activeUser?.id ?? null;
  }, [activeUser?.id, activeUser?.name]);

  const handleLogout = useCallback(() => {
    if (profile?.name) {
      logActivity("user.logout", { userName: profile.name, userId: profile.id });
    }
    logout();
  }, [logout, profile]);

  const logSetSpends = useCallback(
    (fn) => {
      setSpends((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        if (profile && Array.isArray(next) && next.length > prev.length) {
          const added = next[next.length - 1];
          logActivity("spend.added", {
            userName: profile.name,
            userId: profile.id,
            detail: { amount: added.amount, note: added.note, cat: added.cat },
          });
        }
        return next;
      });
    },
    [setSpends, profile]
  );

  const logSetMeals = useCallback(
    (fn) => {
      setMeals((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        if (profile && Array.isArray(next) && next.length > prev.length) {
          const added = next[next.length - 1];
          logActivity("meal.added", {
            userName: profile.name,
            userId: profile.id,
            detail: { name: added.name, quality: added.quality },
          });
        }
        return next;
      });
    },
    [setMeals, profile]
  );

  const toggleHabit = useCallback(
    (id) => {
      baseToggleHabit(id);
      if (profile) {
        const habit = habits.find((h) => h.id === id);
        logActivity("habit.toggled", {
          userName: profile.name,
          userId: profile.id,
          detail: { habit: habit?.name || id },
        });
      }
    },
    [baseToggleHabit, habits, profile]
  );

  const handleRestore = (data) => {
    importApp(mergeBackup(app, data));
    const name = activeUser?.name || users[0]?.name;
    if (name) logActivity("backup.imported", { userName: name, userId: activeUser?.id || users[0]?.id });
    ping("Backup restored");
  };

  const handleImport = (file) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        handleRestore(parseBackupJSON(r.result));
      } catch {
        ping("That file didn't look like a Daybook backup");
      }
    };
    r.readAsText(file);
  };

  const handleAddUser = (u) => {
    const result = addUser(u);
    if (!result.ok) {
      ping("That name is already taken - pick another");
      return false;
    }
    logActivity("user.created", { userName: result.user.name, userId: result.user.id });
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
    <div className="app-shell" style={{ ...fontBody, color: T.ink }}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <SideNav
        tab={tab}
        setTab={setTab}
        profileName={profile.name}
        onLock={handleLogout}
        onSettings={() => setShowSettings(true)}
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
          setViewDate={setViewDate}
          onLock={handleLogout}
          setShowSettings={setShowSettings}
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
                goToday={() => setTab("today")}
              />
            )}
            {tab === "food" && (
              <FoodView meals={meals} setMeals={setMeals} today={today} ping={ping} goToday={() => setTab("today")} />
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
                goToday={() => setTab("today")}
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav tab={tab} setTab={setTab} />

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
          exportData={() => exportData(app, profile.id)}
          exportAllData={() => exportData(app)}
          exportCSV={() => {
            exportCSV(state, habits);
            ping("CSV exported - opens in Excel");
          }}
          importData={handleImport}
          onLogout={logout}
          onDeleteUser={() => {
            const removed = deleteUser(profile.id);
            if (removed) {
              logActivity("user.deleted", { userName: removed.user.name, userId: removed.user.id });
            }
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
