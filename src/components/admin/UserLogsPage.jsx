import { useCallback, useState } from "react";
import { useTheme, ThemeProvider } from "../../theme/ThemeContext";
import { fontBody, fontHead } from "../../theme/colors";
import { fetchLogs } from "../../lib/activityLog";
import { verifyUserAccess } from "../../lib/userRegistry";
import { LogsTable } from "./logFormat";
import { RefreshCw } from "../icons";
import "../../styles/global.css";

function UserLogsInner() {
  const { T } = useTheme();
  const [userName, setUserName] = useState("");
  const [pin, setPin] = useState("");
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchLogs({ user: session.userName, pin: session.pin ?? "", limit: 300 });
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [session]);

  const unlock = async (e) => {
    e.preventDefault();
    const name = userName.trim();
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const verified = await verifyUserAccess({ userName: name, pin });
      if (verified.pinRequired && !pin) {
        throw new Error("PIN required for this profile");
      }
      const sess = { userName: verified.userName, pin };
      setSession(sess);
      const data = await fetchLogs({ user: verified.userName, pin, limit: 300 });
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Could not sign in to logs");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="admin-shell" style={{ ...fontBody, color: T.ink, background: T.paper, minHeight: "100dvh", padding: 24 }}>
        <div style={{ maxWidth: 400, margin: "80px auto" }}>
          <h1 style={{ ...fontHead, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>My activity</h1>
          <p style={{ color: T.inkSoft, fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            View your Daybook activity log. Enter your profile name and PIN (if you set one).
          </p>
          <form onSubmit={unlock} style={{ display: "grid", gap: 10 }}>
            <input className="field-input" placeholder="Your name" value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="username" />
            <input className="field-input" type="password" inputMode="numeric" maxLength={4} placeholder="4-digit PIN (if set)" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} autoComplete="current-password" />
            <button type="submit" className="btn-primary" style={{ background: T.ink, color: T.paper }} disabled={loading}>
              {loading ? "Loading…" : "View my logs"}
            </button>
          </form>
          {error && <p style={{ color: T.food, fontWeight: 700, marginTop: 12, fontSize: 14 }}>{error}</p>}
          <p style={{ marginTop: 16, fontSize: 12, color: T.inkSoft }}>
            Admin? Go to <a href="/admin" style={{ color: T.accent }}>/admin</a>
          </p>
          <a href="/" style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.accent, display: "inline-block", marginTop: 12 }}>
            ← Back to Daybook
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ ...fontBody, color: T.ink, background: T.paper, minHeight: "100dvh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ ...fontHead, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{session.userName}&apos;s activity</h1>
            <p style={{ color: T.inkSoft, fontSize: 13 }}>
              {events.length} recent events · {total} total stored
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={() => load()} disabled={loading} className="icon-btn" aria-label="Refresh">
              <RefreshCw size={16} />
            </button>
            <button type="button" onClick={() => { setSession(null); setEvents([]); }} style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.inkSoft, background: "none", border: "none", cursor: "pointer" }}>
              Sign out
            </button>
            <a href="/" style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.accent }}>← Daybook</a>
          </div>
        </div>

        {error && <div style={{ color: T.food, fontWeight: 700, marginBottom: 12 }}>{error}</div>}
        {loading && events.length === 0 ? (
          <p style={{ color: T.inkSoft }}>Loading…</p>
        ) : events.length === 0 ? (
          <p style={{ color: T.inkSoft }}>No activity logged yet for this profile.</p>
        ) : (
          <LogsTable events={events} T={T} />
        )}
      </div>
    </div>
  );
}

export function UserLogsPage() {
  return (
    <ThemeProvider dark={false}>
      <UserLogsInner />
    </ThemeProvider>
  );
}
