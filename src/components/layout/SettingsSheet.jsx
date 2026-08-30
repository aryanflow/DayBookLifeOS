import { useState, useEffect } from "react";
import { X, Sun, Moon, Lock, Download, Upload, LogOut, Cloud, RefreshCw, Copy } from "../icons";
import { hashPin, verifyPin, validatePin } from "../../lib/auth";
import { CURRENCIES, currencySymbol } from "../../constants";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";
import { isUserNameTaken, normalizeUserName } from "../../lib/users";
import { useActivityLog } from "../../hooks/useActivityLogger";
import { registerUserProfile } from "../../lib/userRegistry";

export function SettingsSheet({
  profile,
  setProfile,
  dark,
  setDark,
  budget,
  setBudget,
  currency,
  setCurrency,
  users,
  exportData,
  exportAllData,
  exportCSV,
  importData,
  onLogout,
  onDeleteUser,
  onRestoreUser,
  onClose,
  ping,
  renameUser,
  sync,
}) {
  const { T } = useTheme();
  const { log } = useActivityLog();
  const sym = currencySymbol(currency);
  const [name, setName] = useState(profile.name);
  const [bud, setBud] = useState(String(budget));
  const [pinMode, setPinMode] = useState(null);
  const [pinOld, setPinOld] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinNew2, setPinNew2] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [showSyncKey, setShowSyncKey] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  const saveName = () => {
    const n = normalizeUserName(name);
    if (!n) {
      setName(profile.name);
      ping("Name cannot be empty");
      return;
    }
    if (n === normalizeUserName(profile.name)) return;
    if (isUserNameTaken(users, n, profile.id)) {
      setName(profile.name);
      ping("That name is already taken - pick another");
      return;
    }
    const result = renameUser(profile.id, n);
    if (!result.ok) {
      setName(profile.name);
      log("user.rename.failed", { reason: result.error || "name_taken", name: n });
      ping("That name is already taken - pick another");
      return;
    }
    log("user.renamed", { from: profile.name, to: n });
    ping("Name updated");
  };

  const saveBudget = () => {
    const b = Math.max(0, parseInt(bud, 10) || 0);
    if (b !== budget) {
      setBudget(b);
      log("settings.budget.changed", { from: budget, to: b });
      ping("Daily budget updated");
    }
  };

  const applyPin = async () => {
    setPinErr("");
    setPinBusy(true);
    try {
      if (pinMode === "remove" || pinMode === "change") {
        const ok = await verifyPin(pinOld, profile.pin);
        if (!ok) {
          setPinErr("Current PIN is wrong");
          log("pin.failed", { action: pinMode });
          return;
        }
      }
      if (pinMode === "remove") {
        setProfile((p) => ({ ...p, pin: null }));
        setPinMode(null);
        log("pin.removed");
        registerUserProfile({ userId: profile.id, userName: profile.name, createdAt: profile.createdAt, pin: null, pinOnly: true });
        ping("PIN removed");
        return;
      }
      if (!validatePin(pinNew)) {
        setPinErr("PIN must be exactly 4 digits");
        return;
      }
      if (pinNew !== pinNew2) {
        setPinErr("PINs don't match - try again");
        return;
      }
      const hashed = await hashPin(pinNew);
      setProfile((p) => ({ ...p, pin: hashed }));
      setPinMode(null);
      setPinOld("");
      setPinNew("");
      setPinNew2("");
      log(profile.pin ? "pin.changed" : "pin.set");
      registerUserProfile({ userId: profile.id, userName: profile.name, createdAt: profile.createdAt, pin: pinNew, pinOnly: true });
      ping(profile.pin ? "PIN changed" : "PIN set");
    } finally {
      setPinBusy(false);
    }
  };

  const fieldClass = "field-input";
  const rowBtn = {
    ...fontHead,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "12px 0",
    borderRadius: 12,
    border: `1.5px solid ${T.line}`,
    background: T.field,
    color: T.ink,
    fontWeight: 800,
    fontSize: 13.5,
    cursor: "pointer",
  };

  const handleLogout = () => {
    onLogout();
    onClose();
    ping("Logged out - pick your profile to return");
  };

  const handleDelete = () => {
    const removed = onDeleteUser();
    if (removed) {
      onClose();
      ping(`${removed.user.name} removed`, () => onRestoreUser(removed));
    }
  };

  const syncStatusLabel = () => {
    if (!sync?.enabled) return "Optional - encrypted backup across your devices.";
    if (sync.status === "syncing") return "Syncing now…";
    if (sync.status === "offline") return "Offline - will sync when you're back online.";
    if (sync.status === "error") return sync.lastError || "Sync failed - tap Sync now to retry.";
    if (sync.config?.lastSyncedAt) {
      const t = new Date(sync.config.lastSyncedAt);
      return `Auto-sync on · Last saved ${t.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
    }
    return "Auto-sync on · waiting for first upload.";
  };

  const handleEnableSync = async () => {
    setSyncBusy(true);
    try {
      const result = await sync.enableSync();
      if (!result.ok) {
        log("sync.enable.failed", { reason: result.reason });
        ping(result.reason || "Could not turn on sync");
        return;
      }
      setShowSyncKey(true);
      ping("Sync is on - copy your code to other devices");
    } finally {
      setSyncBusy(false);
    }
  };

  const handleLinkSync = async () => {
    setSyncBusy(true);
    try {
      const result = await sync.linkDevice(linkCode);
      if (!result.ok) {
        log("sync.link.failed", { reason: result.reason });
        ping(result.reason || "Could not link device");
        return;
      }
      setLinkCode("");
      ping("Linked - pulled latest from cloud");
    } finally {
      setSyncBusy(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncBusy(true);
    try {
      const result = await sync.syncNow();
      if (!result.ok) {
        log("sync.manual.failed", { reason: result.reason || sync.lastError });
        ping(result.reason || sync.lastError || "Sync failed");
        return;
      }
      log("sync.manual.success", { pulled: !!result.pulled });
      if (result.pulled) ping("Updated from cloud");
      else ping("Saved to cloud");
    } finally {
      setSyncBusy(false);
    }
  };

  const copySyncKey = async () => {
    if (!sync?.syncKeyFormatted) return;
    try {
      await navigator.clipboard.writeText(sync.syncKeyFormatted);
      ping("Sync code copied");
    } catch {
      ping("Could not copy - select and copy the code manually");
    }
  };

  const handleDisableSync = () => {
    sync?.disableSync();
    setShowSyncKey(false);
    ping("Sync turned off on this device");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={onClose}
      className="settings-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.82)",
        zIndex: 60,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="fade-up settings-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "16px 18px calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ ...fontHead, fontSize: 19, fontWeight: 800 }}>Settings</div>
          <button type="button" onClick={onClose} aria-label="Close settings" style={{ border: `1px solid ${T.line}`, background: T.card, borderRadius: 10, padding: 7, cursor: "pointer", color: T.inkSoft, display: "inline-flex" }}>
            <X size={15} />
          </button>
        </div>

        <div className="settings-stack">
          <SettingsBlock label="Profile">
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} aria-label="Your name" />
            <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, marginTop: 6 }}>
              Daybook since {profile.createdAt} - {users.length} {users.length === 1 ? "person" : "people"} on this device
            </div>
          </SettingsBlock>

          <SettingsBlock label="Appearance">
            <button
              type="button"
              onClick={() => {
                setDark((d) => {
                  log("settings.theme.changed", { dark: !d });
                  return !d;
                });
              }}
              style={rowBtn}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? "Switch to light mode" : "Switch to dark mode"}
            </button>
          </SettingsBlock>

          <SettingsBlock label="Currency">
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                log("settings.currency.changed", { currency: e.target.value });
                ping("Currency updated");
              }}
              aria-label="Currency"
              className={fieldClass}
              style={{ cursor: "pointer" }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.label}
                </option>
              ))}
            </select>
          </SettingsBlock>

          <SettingsBlock label={`Daily budget (${sym})`}>
            <input className={fieldClass} value={bud} inputMode="numeric" onChange={(e) => setBud(e.target.value.replace(/\D/g, ""))} onBlur={saveBudget} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} aria-label="Daily budget" />
          </SettingsBlock>

          <SettingsBlock label="Sync across devices">
            {!sync?.enabled ? (
              <div style={{ display: "grid", gap: 8 }}>
                <p style={{ fontSize: 13, color: T.inkSoft, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                  One tap turns on auto-sync. Your data encrypts and uploads every few seconds - no manual saves.
                </p>
                <button type="button" onClick={handleEnableSync} disabled={syncBusy} style={{ ...rowBtn, opacity: syncBusy ? 0.7 : 1 }}>
                  <Cloud size={14} /> Turn on sync on this device
                </button>
                <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, textAlign: "center" }}>Already syncing elsewhere?</div>
                <input
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  placeholder="Paste sync code (XXXX-XXXX-…)"
                  aria-label="Sync code from another device"
                  className={fieldClass}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" onClick={handleLinkSync} disabled={syncBusy || !linkCode.trim()} style={{ ...rowBtn, opacity: syncBusy || !linkCode.trim() ? 0.7 : 1 }}>
                  Link this device
                </button>
                <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, lineHeight: 1.5 }}>{syncStatusLabel()}</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div
                  className={`sync-status sync-status--${sync.status === "synced" || sync.status === "idle" ? "ok" : sync.status}`}
                  style={{ color: sync.status === "error" ? T.food : T.inkSoft }}
                >
                  <span className="sync-status-dot" aria-hidden="true" />
                  <span>{syncStatusLabel()}</span>
                </div>
                <p style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                  Edits upload automatically within a few seconds. Use Sync now to force it, or link the same code on another device.
                </p>
                <div className="sync-code-box">
                  <code className="sync-code-text">{showSyncKey ? sync.syncKeyFormatted : "••••-••••-••••-••••-••••-••••"}</code>
                  <button
                    type="button"
                    className="sync-code-toggle"
                    onClick={() => setShowSyncKey((v) => !v)}
                    style={{ color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                  >
                    {showSyncKey ? "Hide" : "Show"}
                  </button>
                </div>
                <button type="button" onClick={copySyncKey} style={rowBtn}><Copy size={14} /> Copy sync code</button>
                <button type="button" onClick={handleSyncNow} disabled={syncBusy} style={rowBtn}><RefreshCw size={14} /> Sync now</button>
                <button
                  type="button"
                  onClick={handleDisableSync}
                  style={{ background: "none", border: "none", color: T.inkSoft, cursor: "pointer", fontWeight: 700, fontSize: 13, padding: "4px 0", textAlign: "center" }}
                >
                  Turn off sync on this device
                </button>
              </div>
            )}
          </SettingsBlock>

          <SettingsBlock label="PIN lock">
            {!pinMode ? (
              <div style={{ display: "grid", gap: 8 }}>
                {profile.pin ? (
                  <>
                    <button type="button" onClick={() => setPinMode("change")} style={rowBtn}><Lock size={14} /> Change PIN</button>
                    <button type="button" onClick={() => setPinMode("remove")} style={{ ...rowBtn, color: T.food }}>Remove PIN</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setPinMode("set")} style={rowBtn}><Lock size={14} /> Set a 4-digit PIN</button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {(pinMode === "change" || pinMode === "remove") && (
                  <input className={fieldClass} placeholder="Current PIN" inputMode="numeric" type="password" maxLength={4} value={pinOld} onChange={(e) => { setPinOld(e.target.value.replace(/\D/g, "")); setPinErr(""); }} />
                )}
                {pinMode !== "remove" && (
                  <>
                    <input className={fieldClass} placeholder="New 4-digit PIN" inputMode="numeric" type="password" maxLength={4} value={pinNew} onChange={(e) => { setPinNew(e.target.value.replace(/\D/g, "")); setPinErr(""); }} />
                    <input className={fieldClass} placeholder="Repeat new PIN" inputMode="numeric" type="password" maxLength={4} value={pinNew2} onChange={(e) => { setPinNew2(e.target.value.replace(/\D/g, "")); setPinErr(""); }} />
                  </>
                )}
                {pinErr && <div style={{ color: T.food, fontSize: 13, fontWeight: 700 }}>{pinErr}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={applyPin} disabled={pinBusy} style={{ ...rowBtn, background: T.ink, color: T.paper, border: "none", opacity: pinBusy ? 0.7 : 1 }}>
                    {pinMode === "remove" ? "Remove PIN" : "Save PIN"}
                  </button>
                  <button type="button" onClick={() => { setPinMode(null); setPinErr(""); setPinOld(""); setPinNew(""); setPinNew2(""); }} style={rowBtn}>Cancel</button>
                </div>
              </div>
            )}
          </SettingsBlock>

          <SettingsBlock label="Your data">
            <div style={{ display: "grid", gap: 8 }}>
              <button type="button" onClick={exportCSV} style={rowBtn}><Download size={14} /> Export CSV for Excel</button>
              <button type="button" onClick={exportData} style={rowBtn}><Download size={14} /> Backup my profile (JSON)</button>
              {users.length > 1 && (
                <button type="button" onClick={exportAllData} style={rowBtn}><Download size={14} /> Backup everyone (JSON)</button>
              )}
              <label style={{ ...rowBtn, display: "flex" }}>
                <Upload size={14} /> Restore from backup
                <input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => e.target.files[0] && importData(e.target.files[0])} />
              </label>
              <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, textAlign: "center" }}>
                {sync?.enabled
                  ? "Local-first with optional encrypted cloud sync. JSON backup still works offline."
                  : "Everything stays on this device unless you turn on sync."}
              </div>
            </div>
          </SettingsBlock>

          <SettingsBlock label="About">
            <div style={{ fontSize: 13, color: T.inkSoft, fontWeight: 600, lineHeight: 1.6 }}>
              <a href="/version" style={{ color: T.accent, fontWeight: 700 }}>Version info</a>
              {" · "}
              <a href="/logs" style={{ color: T.accent, fontWeight: 700 }}>Activity logs</a>
            </div>
          </SettingsBlock>

          <SettingsBlock label="Account">
            <div style={{ display: "grid", gap: 8 }}>
              <button type="button" onClick={handleLogout} style={rowBtn}><LogOut size={14} /> Switch person / log out</button>
              <button type="button" onClick={handleDelete} style={{ ...rowBtn, color: T.food }}>
                Delete my profile
              </button>
            </div>
          </SettingsBlock>
        </div>
      </div>
    </div>
  );
}

function SettingsBlock({ label: lbl, children }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="settings-block-label">{lbl}</div>
      {children}
    </div>
  );
}
