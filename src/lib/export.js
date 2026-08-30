import { normalizeBackup } from "./migrate";
import { isUserNameTaken, uniqueUserName } from "./users";
import { dkey } from "./dates";

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function buildBackupPayload(app) {
  return {
    version: 2,
    users: app.users.map((u) => ({ ...u })),
    userData: { ...app.userData },
    exportedAt: dkey(),
  };
}

export function buildUserBackup(app, userId) {
  const user = app.users.find((u) => u.id === userId);
  if (!user) throw new Error("user not found");
  return {
    version: 2,
    users: [{ ...user }],
    userData: { [userId]: app.userData[userId] },
    exportedAt: dkey(),
  };
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportData(app, userId = null) {
  const payload = userId ? buildUserBackup(app, userId) : buildBackupPayload(app);
  const suffix = userId ? app.users.find((u) => u.id === userId)?.name?.split(" ")[0] || "user" : "all";
  downloadJSON(payload, `daybook-backup-${suffix}-${dkey()}.json`);
}

export function exportCSV(state, habits) {
  const { spends, meals, habitLog, water, sleep, notes, work } = state;
  const today = dkey();
  const lines = [];

  lines.push("SPENDING");
  lines.push("date,amount,category,note");
  spends
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => lines.push([s.date, s.amount, s.cat, esc(s.note)].join(",")));

  lines.push("");
  lines.push("MEALS");
  lines.push("date,meal,quality");
  meals
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((m) => lines.push([m.date, esc(m.name), m.quality].join(",")));

  lines.push("");
  lines.push("HABITS DONE");
  lines.push("date,habits_completed,habit_names");
  Object.keys(habitLog)
    .sort()
    .forEach((d) => {
      const names = (habitLog[d] || [])
        .map((id) => habits.find((h) => h.id === id)?.name || id)
        .join("; ");
      lines.push([d, (habitLog[d] || []).length, esc(names)].join(","));
    });

  lines.push("");
  lines.push("HEALTH & NOTES");
  lines.push("date,water_glasses,sleep_hours,mood,note");
  const allDates = [...new Set([...Object.keys(water), ...Object.keys(sleep), ...Object.keys(notes)])].sort();
  allDates.forEach((d) =>
    lines.push([d, water[d] ?? "", sleep[d] ?? "", notes[d]?.mood ?? "", esc(notes[d]?.text)].join(","))
  );

  lines.push("");
  lines.push("WORK TASKS");
  lines.push("created,task,status,done_on");
  (work.tasks || [])
    .slice()
    .sort((a, b) => a.id - b.id)
    .forEach((t) => lines.push([t.createdAt, esc(t.text), t.done ? "done" : "open", t.doneAt || ""].join(",")));

  lines.push("");
  lines.push("WORK NOTES");
  lines.push("updated,note,pinned");
  (work.notes || [])
    .slice()
    .sort((a, b) => a.id - b.id)
    .forEach((n) => lines.push([n.updatedAt, esc(n.text), n.pinned ? "yes" : ""]));

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `daybook-export-${today}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function parseBackupJSON(text) {
  const d = JSON.parse(text);
  const normalized = normalizeBackup(d);
  if (!normalized?.users?.length) throw new Error("not a backup");
  return normalized;
}

export function mergeBackup(existingApp, incomingApp) {
  const users = [...existingApp.users];
  const userData = { ...existingApp.userData };

  incomingApp.users.forEach((u) => {
    const idx = users.findIndex((x) => x.id === u.id);
    if (idx >= 0) {
      const name = isUserNameTaken(users, u.name, u.id)
        ? uniqueUserName(users, u.name, u.id)
        : u.name;
      users[idx] = { ...u, name };
    } else {
      const name = isUserNameTaken(users, u.name) ? uniqueUserName(users, u.name) : u.name;
      users.push({ ...u, name });
    }
  });

  Object.entries(incomingApp.userData || {}).forEach(([id, data]) => {
    userData[id] = data;
  });

  return { ...existingApp, users, userData };
}
