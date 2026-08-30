import { useState } from "react";
import { AuthShell } from "./AuthShell";
import { DaybookLogo } from "../ui/DaybookLogo";
import { Lock } from "../icons";
import { hashPin, validatePin } from "../../lib/auth";
import { parseBackupJSON } from "../../lib/export";
import { dkey } from "../../lib/dates";
import { DEFAULT_CURRENCY } from "../../constants";
import { isUserNameTaken, normalizeUserName } from "../../lib/users";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";

export function WelcomeScreen({ onDone, onRestore, onDemo, title = "Get started", existingUsers = [] }) {
  const { T } = useTheme();
  const [name, setName] = useState("");
  const [wantPin, setWantPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreErr, setRestoreErr] = useState("");

  const start = async () => {
    const trimmed = normalizeUserName(name);
    if (!trimmed) {
      setErr("Enter your name to continue");
      return;
    }
    if (isUserNameTaken(existingUsers, trimmed)) {
      setErr("That name is already on this device - pick another");
      return;
    }
    if (wantPin) {
      if (!validatePin(pin)) {
        setErr("PIN must be exactly 4 digits");
        return;
      }
      if (pin !== pin2) {
        setErr("PINs don't match");
        return;
      }
    }
    setBusy(true);
    try {
      const hashed = wantPin ? await hashPin(pin) : null;
      onDone({
        name: trimmed,
        pin: hashed,
        pinPlain: wantPin ? pin : null,
        createdAt: dkey(),
        currency: DEFAULT_CURRENCY,
        budget: 1000,
        dark: false,
      });
    } catch {
      setErr("Could not save PIN. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreFile = (file) => {
    setRestoreErr("");
    const r = new FileReader();
    r.onload = () => {
      try {
        onRestore(parseBackupJSON(r.result));
      } catch {
        setRestoreErr("That file isn't a Daybook backup.");
      }
    };
    r.readAsText(file);
  };

  const field = { className: "field-input" };

  return (
    <AuthShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <DaybookLogo size={22} textSize={28} />
        <div style={{ color: T.inkSoft, fontSize: 15, fontWeight: 600, marginTop: 12, lineHeight: 1.55, textAlign: "center" }}>
          Your day, in one place.
          <br />
          Private - everything stays on this device.
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 16 }}>
        <input
          placeholder="Your first name"
          value={name}
          autoFocus
          aria-label="Your name"
          onChange={(e) => {
            setName(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && !wantPin && !busy && start()}
          {...field}
        />

        <button
          type="button"
          onClick={() => {
            setWantPin((w) => !w);
            setErr("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: T.inkSoft,
            textAlign: "left",
          }}
        >
          <span
            style={{
              width: 40,
              height: 24,
              borderRadius: 99,
              background: wantPin ? T.habit : T.line,
              position: "relative",
              transition: "background .2s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: wantPin ? 19 : 3,
                width: 18,
                height: 18,
                borderRadius: 99,
                background: T.onPrimary,
                transition: "left .2s",
              }}
            />
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            <Lock size={13} /> Optional 4-digit PIN
          </span>
        </button>

        {wantPin && (
          <div className="fade-up" style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Choose PIN"
              inputMode="numeric"
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setErr("");
              }}
              {...field}
            />
            <input
              placeholder="Confirm PIN"
              inputMode="numeric"
              type="password"
              maxLength={4}
              value={pin2}
              onChange={(e) => {
                setPin2(e.target.value.replace(/\D/g, ""));
                setErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && !busy && start()}
              {...field}
            />
          </div>
        )}

        {err && <div style={{ color: T.food, fontSize: 13.5, fontWeight: 700 }}>{err}</div>}

        <button type="button" onClick={start} disabled={busy} className="btn-primary" style={{ opacity: busy ? 0.7 : 1 }}>
          {title}
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        {onDemo && (
          <button
            type="button"
            onClick={onDemo}
            style={{
              ...fontHead,
              width: "100%",
              padding: "13px 0",
              borderRadius: 14,
              border: `1.5px solid ${T.money}`,
              background: T.moneySoft,
              color: T.money,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            Login as Test - sample data
          </button>
        )}
        {!showRestore ? (
          <button
            type="button"
            onClick={() => setShowRestore(true)}
            style={{
              ...fontBody,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.dim,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Restore from backup
          </button>
        ) : (
          <div
            className="fade-up"
            style={{
              background: T.card,
              border: `1px solid ${T.line}`,
              borderRadius: 16,
              padding: 16,
              display: "grid",
              gap: 10,
              textAlign: "left",
            }}
          >
            <label
              style={{
                ...fontHead,
                display: "block",
                textAlign: "center",
                padding: "12px 0",
                borderRadius: 12,
                border: `1.5px solid ${T.line}`,
                background: T.field,
                color: T.ink,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Choose backup file
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={(e) => e.target.files[0] && handleRestoreFile(e.target.files[0])}
              />
            </label>
            {restoreErr && <div style={{ color: T.food, fontSize: 13, fontWeight: 700 }}>{restoreErr}</div>}
            <button
              type="button"
              onClick={() => {
                setShowRestore(false);
                setRestoreErr("");
              }}
              style={{
                ...fontBody,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.dim,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
