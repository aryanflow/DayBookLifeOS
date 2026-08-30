import { useTheme } from "../../theme/ThemeContext";
import { fontBody, fontHead } from "../../theme/colors";

export function Toast({ toast, onDismiss }) {
  const { T } = useTheme();
  if (!toast) return null;

  return (
    <div
      role="status"
      className="toast-in"
      style={{
        position: "fixed",
        bottom: 92,
        left: "50%",
        transform: "translateX(-50%)",
        background: T.ink,
        color: T.paper,
        padding: "10px 18px",
        borderRadius: 999,
        ...fontBody,
        fontWeight: 700,
        fontSize: 14,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        gap: 12,
        whiteSpace: "nowrap",
      }}
    >
      {toast.msg}
      {toast.undo && (
        <button
          type="button"
          onClick={() => {
            toast.undo();
            onDismiss();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.money,
            ...fontHead,
            fontWeight: 800,
            fontSize: 14,
            padding: 0,
            textDecoration: "underline",
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}
