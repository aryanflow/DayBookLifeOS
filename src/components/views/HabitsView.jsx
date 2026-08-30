import { useState } from "react";
import { Card, SectionTitle } from "../ui/Card";
import { Check, Trash2 } from "../icons";
import { lastNDays } from "../../lib/dates";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";
import { useActivityLog } from "../../hooks/useActivityLogger";
import { HABIT_EMOJIS } from "../../constants/habits";

export function HabitsView({ habits, setHabits, habitLog, toggleHabit, doneToday, streak, ping }) {
  const { T } = useTheme();
  const { log } = useActivityLog();
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("✨");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const days = lastNDays(7);

  const add = () => {
    if (!newName.trim()) return;
    setHabits((p) => [...p, { id: "h" + Date.now(), name: newName.trim(), emoji: newEmoji }]);
    log("habit.added", { name: newName.trim(), emoji: newEmoji });
    setNewName("");
  };

  const saveEdit = (h) => {
    const name = editName.trim() || h.name;
    setHabits((p) => p.map((x) => (x.id === h.id ? { ...x, name } : x)));
    log("habit.updated", { name });
    setEditingId(null);
  };

  const setEmoji = (id, emoji) => {
    setHabits((p) => p.map((x) => (x.id === id ? { ...x, emoji } : x)));
    log("habit.updated", { emoji });
  };

  const move = (index, dir) => {
    const next = index + dir;
    if (next < 0 || next >= habits.length) return;
    setHabits((p) => {
      const copy = [...p];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
    log("habit.reordered", { from: index, to: next });
  };

  return (
    <>
      <Card>
        <SectionTitle color={T.habit}>Your habits</SectionTitle>
        <div>
          {habits.map((h, index) => {
            const done = doneToday.includes(h.id);
            const s = streak(h.id);
            return (
              <div key={h.id} className="habit-row">
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="icon-btn" style={{ padding: 4, fontSize: 10 }}>↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === habits.length - 1} aria-label="Move down" className="icon-btn" style={{ padding: 4, fontSize: 10 }}>↓</button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHabit(h.id)}
                  aria-label={`Mark ${h.name} ${done ? "not done" : "done"}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    border: `2px solid ${done ? T.habit : T.line}`,
                    background: done ? T.habit : T.field,
                    color: T.onPrimary,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    transition: "all .15s",
                  }}
                >
                  {done && <Check size={18} strokeWidth={3} />}
                </button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    <div className="habit-emoji-picker" role="group" aria-label={`Emoji for ${h.name}`}>
                      {HABIT_EMOJIS.slice(0, 8).map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setEmoji(h.id, em)}
                          aria-label={`Set emoji ${em}`}
                          aria-pressed={h.emoji === em}
                          style={{
                            border: `1.5px solid ${h.emoji === em ? T.habit : T.line}`,
                            background: h.emoji === em ? T.habitSoft : T.field,
                            borderRadius: 8,
                            padding: "2px 5px",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editingId === h.id ? (
                    <input
                      className="field-input"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveEdit(h)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(h);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      style={{ marginBottom: 6 }}
                    />
                  ) : (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", cursor: "text" }}
                      onClick={() => {
                        setEditingId(h.id);
                        setEditName(h.name);
                      }}
                      title="Tap to rename"
                    >
                      <span style={{ fontWeight: 700, fontSize: 15 }}>
                        {h.emoji} {h.name}
                      </span>
                      {s >= 2 && <span className="streak-badge">{s}d streak</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 3, marginTop: 8, alignItems: "center" }}>
                    {days.map((d) => (
                      <span
                        key={d}
                        aria-label={`${new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}${(habitLog[d] || []).includes(h.id) ? ", done" : ""}`}
                        style={{
                          flex: 1,
                          maxWidth: 18,
                          height: 6,
                          borderRadius: 99,
                          background: (habitLog[d] || []).includes(h.id) ? T.habit : T.line,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const removed = h;
                    setHabits((p) => p.filter((x) => x.id !== h.id));
                    log("habit.deleted", { name: removed.name });
                    ping(`Deleted "${h.name}"`, () => setHabits((p) => [...p, removed]));
                  }}
                  aria-label={`Delete ${h.name}`}
                  className="icon-btn"
                  style={{ padding: 7 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <SectionTitle color={T.habit}>Add a habit</SectionTitle>
        <div className="habit-emoji-picker" style={{ marginBottom: 10 }} role="group" aria-label="Pick emoji for new habit">
          {HABIT_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setNewEmoji(em)}
              aria-pressed={newEmoji === em}
              style={{
                border: `1.5px solid ${newEmoji === em ? T.habit : T.line}`,
                background: newEmoji === em ? T.habitSoft : T.field,
                borderRadius: 10,
                padding: "6px 8px",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              {em}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="field-input"
            placeholder="e.g. Meditate 10 min"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={add} className="btn-action btn-action--habit" style={{ width: "auto", padding: "0 20px" }}>
            Add
          </button>
        </div>
      </Card>
    </>
  );
}
