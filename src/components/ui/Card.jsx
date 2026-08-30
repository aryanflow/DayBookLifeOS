import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";

export function Card({ children, style, className = "", highlight = false }) {
  return (
    <div className={`card ${highlight ? "card-highlight" : ""} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({ color, children, right }) {
  return (
    <div className="section-title">
      <div className="section-title-main" style={color ? { color } : undefined}>
        {children}
      </div>
      {right && <div className="section-title-right">{right}</div>}
    </div>
  );
}

export function Chip({ active, color, softColor, onClick, children }) {
  const { T } = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      className="chip"
      style={{
        fontFamily: "'Karla', sans-serif",
        fontSize: 13.5,
        fontWeight: 700,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1.5px solid ${active ? color : T.line}`,
        background: active ? softColor : T.field,
        color: active ? color : T.inkSoft,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: active ? `0 0 0 1px ${softColor}` : "none",
      }}
    >
      {children}
    </button>
  );
}

export function StatPill({ color, children }) {
  const { T } = useTheme();
  return (
    <span className="stat-pill" style={{ color: color || T.ink, borderColor: T.lineSoft }}>
      {children}
    </span>
  );
}

export function EmptyState({ children, icon = "✨" }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.85 }}>{icon}</div>
      {children}
    </div>
  );
}
