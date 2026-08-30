import { TABS } from "../../constants";
import { TabIcon, Lock, Gear, Cloud } from "../icons";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";
import { DaybookLogo } from "../ui/DaybookLogo";
import { getUserInitial } from "../../lib/users";

function tabToken(id) {
  if (id === "habits") return "habit";
  if (id === "money") return "money";
  if (id === "food") return "food";
  if (id === "work") return "work";
  return "accent";
}

function NavButton({ id, label, active, onClick, layout }) {
  const { T } = useTheme();
  const token = tabToken(id);
  const color = T[token];
  const soft = T[`${token}Soft`] || T.field;
  const isSide = layout === "side";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={isSide ? "side-nav-btn" : "bottom-nav-tab"}
      style={{ "--tab-color": color, "--tab-soft": soft }}
    >
      <TabIcon id={id} size={isSide ? 20 : 22} strokeWidth={active ? 2.4 : 1.7} />
      <span style={{ ...fontHead, fontSize: isSide ? 14 : undefined, fontWeight: active ? 800 : 600 }}>{label}</span>
    </button>
  );
}

export function SideNav({ tab, setTab, profileName, onLock, onSettings, syncEnabled, syncStatus }) {
  const first = profileName?.split(" ")[0] || "";
  const syncLabel = syncStatus === "syncing" ? "Syncing…" : syncEnabled ? "Auto-sync on" : "Turn on sync";

  return (
    <aside className="side-nav" aria-label="Sections">
      <div className="side-nav-brand">
        <DaybookLogo size={20} textSize={18} />
        {first && (
          <div className="user-chip side-nav-user">
            <span className="user-chip-avatar">{getUserInitial(profileName)}</span>
            {first}
          </div>
        )}
      </div>
      <nav className="side-nav-links">
        {TABS.map(({ id, label }) => (
          <NavButton key={id} id={id} label={label} active={tab === id} onClick={() => setTab(id)} layout="side" />
        ))}
      </nav>
      <div className="side-nav-footer">
        <button
          type="button"
          onClick={onSettings}
          className={`side-nav-sync ${syncEnabled ? "side-nav-sync--on" : "side-nav-sync--off"}`}
          aria-label={syncEnabled ? "Auto-sync is on. Open settings." : "Turn on sync in settings"}
        >
          <Cloud size={16} />
          <span>{syncLabel}</span>
        </button>
        <div className="side-nav-footer-actions">
          <button type="button" title="Log out" onClick={onLock} aria-label="Log out" className="side-nav-footer-btn">
            <Lock size={18} />
            <span>Lock</span>
          </button>
          <button type="button" title="Settings" onClick={onSettings} aria-label="Open settings" className="side-nav-footer-btn">
            <Gear size={18} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({ tab, setTab }) {
  return (
    <nav className="bottom-nav" aria-label="Sections">
      <div className="bottom-nav-inner">
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          {TABS.map(({ id, label }) => (
            <NavButton key={id} id={id} label={label} active={tab === id} onClick={() => setTab(id)} layout="bottom" />
          ))}
        </div>
      </div>
    </nav>
  );
}
