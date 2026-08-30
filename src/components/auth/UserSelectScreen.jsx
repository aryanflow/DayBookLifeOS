import { DaybookLogo } from "../ui/DaybookLogo";
import { AuthShell } from "./AuthShell";
import { getUserInitial } from "../../lib/users";
import { findDemoUser, DEMO_USER_NAME } from "../../lib/demo";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";

export function UserSelectScreen({ users, onSelect, onAddUser, onDemo }) {
  const { T } = useTheme();
  const hasDemo = !!findDemoUser(users);

  return (
    <AuthShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <DaybookLogo size={22} textSize={26} />
        <div style={{ color: T.inkSoft, fontSize: 15, fontWeight: 600, marginTop: 10 }}>Who's using Daybook?</div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onSelect(u.id)}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 99,
                background: T.moneySoft,
                color: T.money,
                display: "grid",
                placeItems: "center",
                ...fontHead,
                fontWeight: 800,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {getUserInitial(u.name)}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...fontHead, fontWeight: 800, fontSize: 16, color: T.ink }}>{u.name}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600, marginTop: 2 }}>
                {u.isDemo || u.name === DEMO_USER_NAME
                  ? "Sample data - no PIN"
                  : u.pin
                    ? "PIN protected"
                    : "No PIN set"}
              </div>
            </span>
            <span style={{ color: T.dim, fontSize: 18 }}>→</span>
          </button>
        ))}
      </div>

      {onDemo && !hasDemo && (
        <button
          type="button"
          onClick={onDemo}
          style={{
            ...fontHead,
            marginTop: 16,
            width: "100%",
            padding: "13px 0",
            borderRadius: 14,
            border: `1.5px solid ${T.money}`,
            background: T.moneySoft,
            color: T.money,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Login as Test - sample data
        </button>
      )}

      <button
        type="button"
        onClick={onAddUser}
        style={{
          ...fontHead,
          marginTop: 16,
          width: "100%",
          padding: "13px 0",
          borderRadius: 14,
          border: `1.5px dashed ${T.line}`,
          background: "transparent",
          color: T.inkSoft,
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        + Add another person
      </button>
    </AuthShell>
  );
}
