import { fontBody } from "../../theme/colors";

export function AuthShell({ children }) {
  return (
    <div className="auth-shell" style={{ ...fontBody, minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 400 }}>
        {children}
      </div>
    </div>
  );
}
