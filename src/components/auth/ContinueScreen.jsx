import { AuthShell } from "./AuthShell";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";

export function ContinueScreen({ profile, onContinue, onBack }) {
  const { T } = useTheme();
  const first = profile?.name?.split(" ")[0] || "there";

  return (
    <AuthShell>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ ...fontHead, fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Daybook<span style={{ color: T.money }}>.</span>
        </div>
        <div style={{ color: T.inkSoft, fontSize: 15, fontWeight: 600, marginTop: 10, lineHeight: 1.5 }}>
          Welcome back, {first}
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        style={{
          ...fontHead,
          width: "100%",
          padding: "14px 0",
          borderRadius: 14,
          border: "none",
          background: T.ink,
          color: T.paper,
          fontWeight: 800,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Open my Daybook
      </button>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            ...fontBody,
            marginTop: 16,
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.dim,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Switch person
        </button>
      )}

      <p
        style={{
          ...fontBody,
          textAlign: "center",
          marginTop: 16,
          fontSize: 12.5,
          color: T.dim,
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        No PIN on this profile - anyone can open it. Add a PIN in Settings for extra privacy.
      </p>
    </AuthShell>
  );
}
