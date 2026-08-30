import { useState, useEffect } from "react";
import { X } from "../icons";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";

export function InstallBanner() {
  const { T } = useTheme();
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("db_install_dismissed") === "1");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed || !deferred) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem("db_install_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="content-wrap" style={{ paddingBottom: 8, paddingTop: 0 }}>
      <div
        className="fade-up"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: T.moneySoft,
          border: `1.5px solid ${T.money}`,
          borderRadius: 14,
        }}
      >
        <span style={{ fontSize: 22 }}>📲</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...fontHead, fontSize: 13, fontWeight: 800, color: T.ink }}>Install Daybook</div>
          <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Add to home screen for quick daily access</div>
        </div>
        <button
          type="button"
          onClick={install}
          style={{
            ...fontHead,
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: T.ink,
            color: T.paper,
            fontWeight: 800,
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install banner"
          style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 4 }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
