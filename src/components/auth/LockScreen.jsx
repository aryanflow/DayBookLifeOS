import { useState, useEffect, useCallback } from "react";
import { AuthShell } from "./AuthShell";
import { Backspace } from "../icons";
import { verifyPin } from "../../lib/auth";
import { PIN_MAX_ATTEMPTS, PIN_LOCKOUT_MS } from "../../constants";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";

export function LockScreen({ profile, onUnlock, onForgotPin, onBack }) {
  const { T } = useTheme();
  const [entry, setEntry] = useState("");
  const [wrong, setWrong] = useState(false);
  const [tries, setTries] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const lockedOut = now < lockoutUntil;
  const lockoutSecs = lockedOut ? Math.ceil((lockoutUntil - now) / 1000) : 0;

  useEffect(() => {
    if (!lockedOut) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockedOut]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const press = useCallback(
    (d) => {
      if (lockedOut) return;
      setEntry((entry) => {
        if (entry.length >= 4) return entry;
        const next = entry + d;
        if (next.length === 4) {
          verifyPin(next, profile.pin).then((ok) => {
            if (ok) setTimeout(onUnlock, 120);
            else {
              setWrong(true);
              setTries((t) => {
                const n = t + 1;
                if (n >= PIN_MAX_ATTEMPTS) setLockoutUntil(Date.now() + PIN_LOCKOUT_MS);
                return n;
              });
              setTimeout(() => {
                setEntry("");
                setWrong(false);
              }, 450);
            }
          });
        }
        return next;
      });
    },
    [lockedOut, profile.pin, onUnlock]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (lockedOut) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setEntry((s) => s.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, lockedOut]);

  const keyBtn = {
    ...fontHead,
    width: 72,
    height: 72,
    borderRadius: 99,
    border: `1.5px solid ${T.line}`,
    background: T.card,
    color: T.ink,
    fontSize: 24,
    fontWeight: 700,
    cursor: lockedOut ? "not-allowed" : "pointer",
    opacity: lockedOut ? 0.45 : 1,
  };

  return (
    <AuthShell>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...fontHead, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Daybook<span style={{ color: T.money }}>.</span>
        </div>
        <div style={{ color: T.inkSoft, fontSize: 15, fontWeight: 700, marginTop: 8 }}>
          {greet}, {profile?.name?.split(" ")[0] || "there"}
        </div>
        <div style={{ color: T.inkSoft, fontSize: 13, fontWeight: 600, marginTop: 2 }}>
          {lockedOut ? `Too many tries. Wait ${lockoutSecs}s` : "Enter your PIN to open your day"}
        </div>

        <div
          className={wrong ? "shake-x" : ""}
          style={{ display: "flex", justifyContent: "center", gap: 14, margin: "26px 0" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: 99,
                transition: "all .15s",
                background: wrong ? T.food : i < entry.length ? T.money : "transparent",
                border: `2px solid ${wrong ? T.food : i < entry.length ? T.money : T.dim}`,
              }}
            />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: 14, justifyContent: "center" }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} type="button" disabled={lockedOut} onClick={() => press(d)} style={keyBtn}>
              {d}
            </button>
          ))}
          <span />
          <button type="button" disabled={lockedOut} onClick={() => press("0")} style={keyBtn}>
            0
          </button>
          <button
            type="button"
            disabled={lockedOut}
            onClick={() => setEntry((s) => s.slice(0, -1))}
            aria-label="Delete last digit"
            style={{
              ...keyBtn,
              background: "none",
              border: "none",
              color: T.inkSoft,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Backspace size={24} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.inkSoft,
                fontSize: 13.5,
                fontWeight: 700,
                ...fontBody,
              }}
            >
              ← Switch person
            </button>
          )}
          {tries >= 3 && (
            <button
              type="button"
              onClick={onForgotPin}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.food,
                fontSize: 13.5,
                fontWeight: 700,
                ...fontBody,
              }}
            >
              Forgot PIN?
            </button>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
