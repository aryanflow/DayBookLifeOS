import { useState } from "react";
import { Card, SectionTitle, EmptyState } from "../ui/Card";
import { Check, Plus, X, Trash2, Zap } from "../icons";
import { niceDate } from "../../lib/dates";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";

export function WorkView({ work, setWork, today, ping }) {
  const { T } = useTheme();
  const [taskDraft, setTaskDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [noteQuery, setNoteQuery] = useState("");

  const tasks = work.tasks || [];
  const wnotes = work.notes || [];
  const openTasks = tasks.filter((t) => !t.done);
  const doneTodayList = tasks.filter((t) => t.done && t.doneAt === today);
  const oldDone = tasks.filter((t) => t.done && t.doneAt !== today);

  const addTask = (pri = false) => {
    if (!taskDraft.trim()) {
      ping("Type a task first");
      return;
    }
    setWork((p) => ({
      ...p,
      tasks: [{ id: Date.now(), text: taskDraft.trim(), done: false, createdAt: today, pri }, ...(p.tasks || [])],
    }));
    setTaskDraft("");
    ping(pri ? "Priority task added ⚡" : "Task added");
  };
  const toggleTask = (id) => {
    setWork((p) => ({
      ...p,
      tasks: (p.tasks || []).map((t) =>
        t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? today : null } : t
      ),
    }));
  };
  const delTask = (id) => {
    const removed = tasks.find((t) => t.id === id);
    setWork((p) => ({ ...p, tasks: (p.tasks || []).filter((t) => t.id !== id) }));
    ping("Task deleted", () => setWork((p) => ({ ...p, tasks: [removed, ...(p.tasks || [])] })));
  };
  const togglePri = (id) =>
    setWork((p) => ({ ...p, tasks: (p.tasks || []).map((t) => (t.id === id ? { ...t, pri: !t.pri } : t)) }));
  const clearOldDone = () => {
    setWork((p) => ({ ...p, tasks: (p.tasks || []).filter((t) => !(t.done && t.doneAt !== today)) }));
    ping("Old completed tasks cleared");
  };

  const addNote = () => {
    if (!noteDraft.trim()) {
      ping("Type a note first");
      return;
    }
    setWork((p) => ({
      ...p,
      notes: [{ id: Date.now(), text: noteDraft.trim(), pinned: false, updatedAt: today }, ...(p.notes || [])],
    }));
    setNoteDraft("");
    ping("Note saved");
  };
  const togglePin = (id) =>
    setWork((p) => ({ ...p, notes: (p.notes || []).map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) }));
  const delNote = (id) => {
    const removed = wnotes.find((n) => n.id === id);
    setWork((p) => ({ ...p, notes: (p.notes || []).filter((n) => n.id !== id) }));
    ping("Note deleted", () => setWork((p) => ({ ...p, notes: [removed, ...(p.notes || [])] })));
  };
  const saveEdit = () => {
    if (editing === null) return;
    setWork((p) => ({
      ...p,
      notes: (p.notes || []).map((n) =>
        n.id === editing ? { ...n, text: editText.trim() || n.text, updatedAt: today } : n
      ),
    }));
    setEditing(null);
    ping("Note updated");
  };

  const sortedNotes = wnotes
    .filter((n) => !noteQuery.trim() || n.text.toLowerCase().includes(noteQuery.trim().toLowerCase()))
    .slice()
    .sort((a, b) => b.pinned - a.pinned || b.id - a.id);
  const field = { flex: 1, minWidth: 0, fontSize: 15, padding: "11px 12px", borderRadius: 14, border: `1.5px solid ${T.line}` };

  const TaskRow = ({ t, muted }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: muted ? 0.55 : 1 }}>
      <button
        type="button"
        onClick={() => toggleTask(t.id)}
        aria-label={t.done ? "Mark not done" : "Mark done"}
        style={{
          width: 26,
          height: 26,
          borderRadius: 9,
          border: `2px solid ${t.done ? T.work : t.pri ? T.food : T.line}`,
          background: t.done ? T.work : T.field,
          color: t.done ? T.onPrimary : T.ink,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          transition: "all .15s",
        }}
      >
        {t.done && <Check size={15} strokeWidth={3} />}
      </button>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontWeight: 700,
          fontSize: 14.5,
          textDecoration: t.done ? "line-through" : "none",
          color: t.done ? T.inkSoft : T.ink,
          overflowWrap: "anywhere",
        }}
      >
        {t.text}
      </span>
      {!t.done && (
        <button
          type="button"
          onClick={() => togglePri(t.id)}
          aria-pressed={!!t.pri}
          aria-label={t.pri ? "Remove priority" : "Mark as priority"}
          title={t.pri ? "Remove priority" : "Mark as priority"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            color: t.pri ? T.money : T.dim,
            display: "inline-flex",
          }}
        >
          <Zap size={15} />
        </button>
      )}
      <button
        type="button"
        onClick={() => delTask(t.id)}
        aria-label="Delete task"
        style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", padding: 2 }}
      >
        <X size={14} />
      </button>
    </div>
  );

  return (
    <>
      <Card>
        <SectionTitle
          color={T.work}
          right={
            <span style={{ ...fontHead, fontSize: 14, fontWeight: 800 }}>
              {openTasks.length} open{doneTodayList.length > 0 ? ` - ${doneTodayList.length} done today` : ""}
            </span>
          }
        >
          To-do
        </SectionTitle>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Add a task... (Enter to add)"
            value={taskDraft}
            onChange={(e) => setTaskDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask(e.shiftKey)}
            style={field}
          />
          <button
            type="button"
            onClick={() => addTask(false)}
            aria-label="Add task"
            style={{
              ...fontHead,
              padding: "0 16px",
              borderRadius: 14,
              border: "none",
              background: T.work,
              color: T.onPrimary,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        {openTasks.length === 0 && doneTodayList.length === 0 ? (
          <EmptyState icon="✅">
            Nothing on your plate yet.
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 6, fontWeight: 600 }}>
              Type a task above and press Enter.
            </div>
          </EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {openTasks
              .slice()
              .sort((a, b) => b.pri - a.pri || b.id - a.id)
              .map((t) => (
                <TaskRow key={t.id} t={t} />
              ))}
            {doneTodayList.map((t) => (
              <TaskRow key={t.id} t={t} muted />
            ))}
          </div>
        )}
        {oldDone.length > 0 && (
          <button
            type="button"
            onClick={clearOldDone}
            style={{
              ...fontBody,
              marginTop: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.inkSoft,
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            Clear {oldDone.length} older completed task{oldDone.length === 1 ? "" : "s"}
          </button>
        )}
      </Card>

      <Card>
        <SectionTitle color={T.work} right={<span style={{ ...fontHead, fontSize: 14, fontWeight: 800 }}>{wnotes.length} 📌</span>}>
          Notes
        </SectionTitle>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Jot something down..."
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            style={field}
          />
          <button
            type="button"
            onClick={addNote}
            aria-label="Save note"
            style={{
              ...fontHead,
              padding: "0 16px",
              borderRadius: 14,
              border: "none",
              background: T.work,
              color: T.onPrimary,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        {wnotes.length >= 5 && (
          <input
            placeholder="Search notes..."
            value={noteQuery}
            onChange={(e) => setNoteQuery(e.target.value)}
            aria-label="Search notes"
            style={{
              width: "100%",
              fontSize: 14,
              padding: "9px 12px",
              borderRadius: 12,
              border: `1.5px solid ${T.line}`,
              marginBottom: 10,
            }}
          />
        )}
        {sortedNotes.length === 0 ? (
          <EmptyState icon="📝">
            {noteQuery ? `No notes match "${noteQuery}".` : "No notes yet."}
            {!noteQuery && (
              <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 6, fontWeight: 600 }}>
                Meeting takeaways, ideas, links - jot anything above.
              </div>
            )}
          </EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sortedNotes.map((n) => (
              <div
                key={n.id}
                style={{
                  background: n.pinned ? T.workSoft : T.field,
                  border: `1.5px solid ${n.pinned ? T.work : T.line}`,
                  borderRadius: 14,
                  padding: "10px 12px",
                }}
              >
                {editing === n.id ? (
                  <input
                    value={editText}
                    autoFocus
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditing(null);
                    }}
                    style={{
                      width: "100%",
                      fontSize: 14.5,
                      padding: "6px 8px",
                      borderRadius: 10,
                      border: `1.5px solid ${T.work}`,
                    }}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setEditing(n.id);
                      setEditText(n.text);
                    }}
                    title="Tap to edit"
                    style={{ fontWeight: 700, fontSize: 14.5, cursor: "text", overflowWrap: "anywhere" }}
                  >
                    {n.text}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 700 }}>
                    {n.updatedAt === today ? "Today" : niceDate(n.updatedAt)}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => togglePin(n.id)}
                    aria-pressed={n.pinned}
                    aria-label={n.pinned ? "Unpin note" : "Pin note"}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      color: n.pinned ? T.work : T.dim,
                      fontWeight: 800,
                      ...fontBody,
                    }}
                  >
                    📌 {n.pinned ? "Pinned" : "Pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => delNote(n.id)}
                    aria-label="Delete note"
                    style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", padding: 2 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
