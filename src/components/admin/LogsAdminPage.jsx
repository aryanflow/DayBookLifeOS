import { useCallback, useEffect, useState } from "react";
import { useTheme, ThemeProvider } from "../../theme/ThemeContext";
import { fontBody, fontHead } from "../../theme/colors";
import {
  deleteUserLogs,
  fetchLogs,
  getAdminKeyFromUrl,
  loadStoredAdminKey,
  saveAdminKey,
} from "../../lib/activityLog";
import { VERSION_INFO } from "../../generated/version.js";
import { Trash2, RefreshCw } from "../icons";
import "../../styles/global.css";

const ACTION_LABELS = {
  "user.created": "Profile created",
  "user.login": "Logged in",
  "user.logout": "Logged out",
  "user.deleted": "Profile deleted",
  "user.renamed": "Renamed",
  "spend.added": "Logged spend",
  "meal.added": "Logged meal",
  "habit.toggled": "Toggled habit",
  "sync.enabled": "Turned on sync",
  "sync.linked": "Linked device",
  "backup.imported": "Restored backup",
};

function formatAction(action) {
  return ACTION_LABELS[action] || action;
}

function formatDetail(detail) {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  try {
    return Object.entries(detail)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
  } catch {
    return String(detail);
  }
}

function LogsAdminInner() {
  const { T } = useTheme();
  const [adminKey, setAdminKey] = useState(() => getAdminKeyFromUrl() || loadStoredAdminKey());
  const [keyInput, setKeyInput] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchLogs({ adminKey, user: userFilter || undefined });
      setEvents(data.events || []);
      setUsers(data.users || []);
      setBlocked(data.blocked || []);
      setTotal(data.total || 0);
      saveAdminKey(adminKey);
    } catch (e) {
      setError(e.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [adminKey, userFilter]);

  useEffect(() => {
    if (adminKey) load();
  }, [adminKey, userFilter, load]);

  const unlock = (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setAdminKey(keyInput.trim());
    setKeyInput("");
  };

  const removeUser = async (name) => {
    if (!adminKey) return;
    if (!window.confirm(`Remove all logs for "${name}" and block future logging from this name?`)) return;
    setLoading(true);
    setError("");
    try {
      await deleteUserLogs({ adminKey, userName: name });
      await load();
    } catch (e) {
      setError(e.message || "Could not remove user");
      setLoading(false);
    }
  };

  if (!adminKey) {
    return (
      <div className="admin-shell" style={{ ...fontBody, color: T.ink, background: T.paper, minHeight: "100dvh", padding: 24 }}>
        <div style={{ maxWidth: 400, margin: "80px auto" }}>
          <h1 style={{ ...fontHead, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Activity logs</h1>
          <p style={{ color: T.inkSoft, fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            Enter your admin key to view who logged in and what they tracked. Set <code style={{ fontSize: 13 }}>LOGS_ADMIN_KEY</code> in Netlify.
          </p>
          <form onSubmit={unlock} style={{ display: "grid", gap: 10 }}>
            <input
              className="field-input"
              type="password"
              placeholder="Admin key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="btn-primary" style={{ background: T.ink, color: T.paper }}>
              View logs
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 12, color: T.inkSoft }}>
            Tip: open <code>/logs?key=YOUR_KEY</code> once to skip this screen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ ...fontBody, color: T.ink, background: T.paper, minHeight: "100dvh", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ ...fontHead, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Activity logs</h1>
            <p style={{ color: T.inkSoft, fontSize: 13 }}>
              v{VERSION_INFO.version} · {VERSION_INFO.commit} · {total} events stored
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={load} disabled={loading} className="icon-btn" aria-label="Refresh logs">
              <RefreshCw size={16} />
            </button>
            <a href="/" style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.accent, alignSelf: "center" }}>
              ← Back to Daybook
            </a>
          </div>
        </div>

        <div className="card" style={{ padding: 14, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.inkSoft }}>
            Filter by user
            <select
              className="field-input"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ marginLeft: 8, minWidth: 160, display: "inline-block", width: "auto" }}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          {userFilter && (
            <button
              type="button"
              onClick={() => removeUser(userFilter)}
              disabled={loading}
              style={{
                ...fontHead,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${T.food}`,
                background: T.foodSoft,
                color: T.food,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} /> Remove {userFilter}
            </button>
          )}
        </div>

        {blocked.length > 0 && (
          <p style={{ fontSize: 12, color: T.inkSoft, marginBottom: 12 }}>
            Blocked from logging: {blocked.join(", ")}
          </p>
        )}

        {error && (
          <div style={{ color: T.food, fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{error}</div>
        )}

        {loading && events.length === 0 ? (
          <p style={{ color: T.inkSoft }}>Loading…</p>
        ) : events.length === 0 ? (
          <p style={{ color: T.inkSoft }}>No activity yet{userFilter ? ` for ${userFilter}` : ""}.</p>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="logs-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.field, textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>WHEN</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>USER</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>ACTION</th>
                  <th style={{ padding: "10px 12px", ...fontHead, fontSize: 11, color: T.inkSoft }}>DETAIL</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} style={{ borderTop: `1px solid ${T.line}` }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: T.inkSoft, verticalAlign: "top" }}>
                      {new Date(ev.ts).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, verticalAlign: "top" }}>{ev.userName}</td>
                    <td style={{ padding: "10px 12px", verticalAlign: "top" }}>{formatAction(ev.action)}</td>
                    <td style={{ padding: "10px 12px", color: T.inkSoft, verticalAlign: "top" }}>{formatDetail(ev.detail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!userFilter && users.length > 0 && (
          <div className="card" style={{ padding: 14, marginTop: 16 }}>
            <div style={{ ...fontHead, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Users in logs</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {users.map((u) => (
                <div
                  key={u}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: `1px solid ${T.line}`,
                    background: T.field,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {u}
                  <button
                    type="button"
                    onClick={() => removeUser(u)}
                    aria-label={`Remove logs for ${u}`}
                    style={{ border: "none", background: "none", cursor: "pointer", color: T.food, padding: 2, display: "inline-flex" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LogsAdminPage() {
  return (
    <ThemeProvider dark={false}>
      <LogsAdminInner />
    </ThemeProvider>
  );
}

export function VersionInfoPage() {
  return (
    <ThemeProvider dark={false}>
      <VersionInfoInner />
    </ThemeProvider>
  );
}

function VersionInfoInner() {
  const { T } = useTheme();
  const lines = [
    `Version: ${VERSION_INFO.version}`,
    `Commit: ${VERSION_INFO.commit}`,
    `Message: ${VERSION_INFO.message}`,
    `Author: ${VERSION_INFO.author}`,
    `Built: ${VERSION_INFO.builtAt}`,
  ];

  return (
      <div style={{ ...fontBody, color: T.ink, background: T.paper, minHeight: "100dvh", padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ ...fontHead, fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Daybook version</h1>
        <pre
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 14,
            lineHeight: 1.6,
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${T.line}`,
            background: T.field,
            whiteSpace: "pre-wrap",
          }}
        >
          {lines.join("\n")}
        </pre>
        <p style={{ marginTop: 16, fontSize: 13, color: T.inkSoft }}>
          Plain text also at <a href="/versioninfo.txt" style={{ color: T.accent }}>/versioninfo.txt</a>
        </p>
        <a href="/" style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.accent }}>
          ← Back to Daybook
        </a>
      </div>
  );
}
