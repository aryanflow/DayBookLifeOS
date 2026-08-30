import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";

export function EditableAmount({ value, onSave, size = 15, currencySymbol = "$" }) {
  const { T } = useTheme();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));

  const commit = () => {
    const n = parseInt(v, 10);
    if (n > 0 && n !== value) onSave(n);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setV(String(value));
          setEditing(true);
        }}
        title="Tap to edit amount"
        aria-label={`Edit amount ${currencySymbol}${value}`}
        style={{
          ...fontHead,
          fontWeight: 800,
          fontSize: size,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: T.ink,
          padding: 0,
          borderBottom: `1px dashed ${T.dim}`,
        }}
      >
        {currencySymbol}{value.toLocaleString()}
      </button>
    );
  }

  return (
    <input
      autoFocus
      inputMode="numeric"
      value={v}
      onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      aria-label="Edit amount"
      style={{
        ...fontHead,
        fontWeight: 800,
        fontSize: size,
        width: 72,
        padding: "3px 6px",
        borderRadius: 8,
        border: `1.5px solid ${T.money}`,
        textAlign: "right",
      }}
    />
  );
}
