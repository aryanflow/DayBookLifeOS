export const ACTION_LABELS = {
  "user.created": "Profile created",
  "user.create.failed": "Create profile failed",
  "user.login": "Logged in",
  "user.logout": "Logged out",
  "user.deleted": "Profile deleted",
  "user.renamed": "Renamed",
  "user.rename.failed": "Rename failed",
  "nav.tab.changed": "Changed tab",
  "nav.day.changed": "Changed day",
  "settings.opened": "Opened settings",
  "settings.theme.changed": "Changed theme",
  "settings.budget.changed": "Changed budget",
  "settings.currency.changed": "Changed currency",
  "spend.added": "Logged spend",
  "spend.updated": "Updated spend",
  "spend.deleted": "Deleted spend",
  "meal.added": "Logged meal",
  "meal.deleted": "Deleted meal",
  "habit.toggled": "Toggled habit",
  "habit.added": "Added habit",
  "habit.deleted": "Deleted habit",
  "habit.updated": "Updated habit",
  "habit.reordered": "Reordered habit",
  "body.water.updated": "Updated water",
  "body.sleep.updated": "Updated sleep",
  "journal.updated": "Updated journal",
  "journal.mood.updated": "Updated mood",
  "work.task.added": "Added task",
  "work.task.toggled": "Toggled task",
  "work.task.deleted": "Deleted task",
  "work.task.priority": "Changed task priority",
  "work.task.cleared_done": "Cleared old tasks",
  "work.note.added": "Added note",
  "work.note.updated": "Updated note",
  "work.note.deleted": "Deleted note",
  "work.note.pinned": "Pinned note",
  "pin.set": "PIN set",
  "pin.changed": "PIN changed",
  "pin.removed": "PIN removed",
  "pin.failed": "PIN failed",
  "sync.enabled": "Turned on sync",
  "sync.disabled": "Turned off sync",
  "sync.linked": "Linked device",
  "sync.pushed": "Pushed to cloud",
  "sync.pulled": "Pulled from cloud",
  "sync.failed": "Sync error",
  "sync.enable.failed": "Enable sync failed",
  "sync.link.failed": "Link device failed",
  "sync.manual.failed": "Manual sync failed",
  "sync.manual.success": "Manual sync ok",
  "backup.imported": "Restored backup",
  "backup.import.failed": "Backup import failed",
  "backup.exported": "Exported backup",
  "backup.exported.csv": "Exported CSV",
  "storage.warning": "Storage warning",
  "app.error": "App error",
  "app.unhandled_rejection": "Unhandled promise error",
};

export function formatAction(action) {
  return ACTION_LABELS[action] || action;
}

export function formatDetail(detail) {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  try {
    const entries = Object.entries(detail).filter(([, v]) => v != null && v !== "");
    const level = detail.level === "error" ? "ERROR · " : "";
    const body = entries
      .filter(([k]) => k !== "level")
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
    return level + body;
  } catch {
    return String(detail);
  }
}

export function LogsTable({ events, T }) {
  if (!events.length) return null;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table className="logs-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: T.field, textAlign: "left" }}>
            <th style={{ padding: "10px 12px", fontFamily: "'Sora', sans-serif", fontSize: 11, color: T.inkSoft }}>WHEN</th>
            <th style={{ padding: "10px 12px", fontFamily: "'Sora', sans-serif", fontSize: 11, color: T.inkSoft }}>ACTION</th>
            <th style={{ padding: "10px 12px", fontFamily: "'Sora', sans-serif", fontSize: 11, color: T.inkSoft }}>DETAIL</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} style={{ borderTop: `1px solid ${T.line}` }}>
              <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: T.inkSoft, verticalAlign: "top" }}>
                {new Date(ev.ts).toLocaleString()}
              </td>
              <td style={{ padding: "10px 12px", verticalAlign: "top" }}>{formatAction(ev.action)}</td>
              <td style={{ padding: "10px 12px", color: T.inkSoft, verticalAlign: "top", wordBreak: "break-word" }}>
                {formatDetail(ev.detail)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
