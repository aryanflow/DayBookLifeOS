import { useCallback, useEffect, useState } from "react";
import { useTheme, ThemeProvider } from "../../theme/ThemeContext";
import { fontBody, fontHead } from "../../theme/colors";
import { deleteAdminUser, fetchAdminUsers } from "../../lib/userRegistry";
import { fetchLogs, getAdminKeyFromUrl, loadStoredAdminKey, saveAdminKey } from "../../lib/activityLog";
import { LogsTable } from "./logFormat";
import { VERSION_INFO } from "../../generated/version.js";
import { Trash2, RefreshCw } from "../icons";
import "../../styles/global.css";

function AdminInner() {
  const { T } = useTheme();
  const [adminKey, setAdminKey] = useState(() => getAdminKeyFromUrl() || loadStoredAdminKey());
  const [keyInput, setKeyInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewLogs, setViewLogs] = useState(null);
  const [logEvents, setLogEvents] = useState([]);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminUsers(adminKey);
      setUsers(data.users || []);
      saveAdminKey(adminKey);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (adminKey) load();
  }, [adminKey, load]);

  const unlock = (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setAdminKey(keyInput.trim());
    setKeyInput("");
  };

  const removeUser = async (user) => {
    if (!adminKey) return;
    if (!window.confirm(`Remove "${user.userName}" completely?\n\nThis deletes their activity logs, registry entry, and cloud sync blob. Local data on their device is cleared next time they open the app.`)) return;
    setLoading(true);
    setError("");
    try {
      await deleteAdminUser({ adminKey, userId: user.userId, userName: user.userName });
      if (viewLogs?.userId === user.userId) {
        setViewLogs(null);
        setLogEvents([]);
      }
      await load();
    } catch (e) {
      setError(e.message || "Could not remove user");
      setLoading(false);
    }
  };

  const openLogs = async (user) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLogs({ adminKey, user: user.userName, limit: 200 });
      setViewLogs(user);
      setLogEvents(data.events || []);
    } catch (e) {
      setError(e.message || "Could not load logs");
    } finally {
      setLoading(false);
    }
  };

  if (!adminKey) {
    return (
      <div className="admin-shell" style={{ ...fontBody, color: T.ink, background: T.paper, minHeight: "100dvh", padding: 24 }}>
        <div style={{ maxWidth: 400, margin: "80px auto" }}>
          <h1 style={{ ...fontHead, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Admin</h1>
          <p style={{ color: T.inkSoft, fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            Manage Daybook users, PINs, and remove profiles entirely. Set <code style={{ fontSize: 13 }}>LOGS_ADMIN_KEY</code> in Netlify.
          </p>
          <form onSubmit={unlock} style={{ display: "grid", gap: 10 }}>
            <input className="field-input" type="password" placeholder="Admin key" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} autoComplete="off" />
            <button type="submit" className="btn-primary" style={{ background: T.ink, color: T.paper }}>Unlock admin</button>
          </form>
          <p style={{ marginTop: 16, fontSize: 12, color: T.inkSoft }}>Tip: open <code>/admin?key=YOUR_KEY</code> once to skip this screen.</p>
          <a href="/" style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.accent, display: "inline-block", marginTop: 12 }}>← Back to Daybook</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ ...fontBody, color: T.ink, background: T.paper, minHeight: "100dvh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ ...fontHead, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Admin</h1>
            <p style={{ color: T.inkSoft, fontSize: 13 }}>
              v{VERSION_INFO.version} · {VERSION_INFO.commit} · {users.length} users
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={load} disabled={loading} className="icon-btn" aria-label="Refresh"><RefreshCw size={16} /></button>
            <a href="/logs" style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.accent }}>User logs →</a>
            <a href="/" style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.accent }}>← Daybook</a>
          </div>
        </div>

        {error && <div style={{ color: T.food, fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{error}</div>}

        {loading && users.length === 0 ? (
          <p style={{ color: T.inkSoft }}>Loading…</p>
        ) : users.length === 0 ? (
          <p style={{ color: T.inkSoft }}>No users registered yet. Users appear after they log in with logging enabled.</p>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "auto" }}>
            <table className="logs-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ background: T.field, textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>USER</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>CREATED</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>LAST ACTIVE</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>PIN</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>EVENTS</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} style={{ borderTop: `1px solid ${T.line}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{u.userName}</td>
                    <td style={{ padding: "10px 12px", color: T.inkSoft }}>{u.createdAt || "—"}</td>
                    <td style={{ padding: "10px 12px", color: T.inkSoft, whiteSpace: "nowrap" }}>
                      {u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>
                      {u.pin ? u.pin : <span style={{ color: T.dim, fontWeight: 600 }}>none</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: T.inkSoft }}>{u.eventCount ?? 0}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <button type="button" onClick={() => openLogs(u)} style={{ ...fontHead, fontSize: 12, fontWeight: 700, color: T.accent, background: "none", border: "none", cursor: "pointer", marginRight: 8 }}>
                        Logs
                      </button>
                      <button type="button" onClick={() => removeUser(u)} aria-label={`Remove ${u.userName}`} style={{ background: "none", border: "none", cursor: "pointer", color: T.food, display: "inline-flex", verticalAlign: "middle" }}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewLogs && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ ...fontHead, fontSize: 17, fontWeight: 800, marginBottom: 10 }}>
              Activity: {viewLogs.userName}
              {viewLogs.pin ? ` · PIN ${viewLogs.pin}` : ""}
            </h2>
            {logEvents.length === 0 ? (
              <p style={{ color: T.inkSoft }}>No events.</p>
            ) : (
              <LogsTable events={logEvents} T={T} />
            )}
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>
          PINs are stored in the admin registry when users set or change them (for household recovery). Removing a user deletes server logs and sync data; their device clears the profile on next app open.
        </p>
      </div>
    </div>
  );
}

export function AdminPage() {
  return (
    <ThemeProvider dark={false}>
      <AdminInner />
    </ThemeProvider>
  );
}
