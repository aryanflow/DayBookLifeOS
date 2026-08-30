import { useState } from "react";
import { Card, SectionTitle } from "../ui/Card";
import { Check, Trash2 } from "../icons";
import { lastNDays } from "../../lib/dates";
import { useTheme } from "../../theme/ThemeContext";
import { useActivityLog } from "../../hooks/useActivityLogger";

export function HabitsView({ habits, setHabits, habitLog, toggleHabit, doneToday, streak, ping }) {
  const { T } = useTheme();
  const { log } = useActivityLog();
  const [newName, setNewName] = useState("");
  const days = lastNDays(7);

  const add = () => {
    if (!newName.trim()) return;
    setHabits((p) => [...p, { id: "h" + Date.now(), name: newName.trim(), emoji: "✨" }]);
    log("habit.added", { name: newName.trim() });
    setNewName("");
  };

  return (
    <>
      <Card>
        <SectionTitle color={T.habit}>Your habits</SectionTitle>
        <div>
          {habits.map((h) => {
            const done = doneToday.includes(h.id);
            const s = streak(h.id);
            return (
              <div key={h.id} className="habit-row">
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
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {h.emoji} {h.name}
                    </span>
                    {s >= 2 && <span className="streak-badge">{s}d streak</span>}
                  </div>
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
