import { useState } from "react";
import { AuthShell } from "./AuthShell";
import { parseBackupJSON } from "../../lib/export";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";

export function OrphanedDataScreen({ onRestore, onErase }) {
  const { T } = useTheme();
  const [restoreErr, setRestoreErr] = useState("");

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

  const rowBtn = {
    ...fontHead,
    display: "block",
    width: "100%",
    padding: "13px 0",
    borderRadius: 14,
    border: `1.5px solid ${T.line}`,
    background: T.field,
    color: T.ink,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "center",
  };

  return (
    <AuthShell>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <div style={{ ...fontHead, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Daybook data found</div>
        <div style={{ ...fontBody, fontSize: 14, color: T.inkSoft, fontWeight: 600, lineHeight: 1.55 }}>
          This device has Daybook data but no active profile. Restore your backup to sign back in, or erase everything to
          start fresh.
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ ...rowBtn, display: "block" }}>
          Restore from backup
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && handleRestoreFile(e.target.files[0])}
          />
        </label>
        {restoreErr && <div style={{ color: T.food, fontSize: 13, fontWeight: 700, textAlign: "center" }}>{restoreErr}</div>}
        <button type="button" onClick={onErase} style={{ ...rowBtn, color: T.food, borderColor: T.food }}>
          Erase everything
        </button>
        <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, textAlign: "center" }}>
          Erasing shows an undo toast - nothing is permanent until you dismiss it.
        </div>
      </div>
    </AuthShell>
  );
}
