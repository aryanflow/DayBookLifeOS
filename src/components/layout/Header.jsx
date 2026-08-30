import { useEffect, useRef } from "react";
import { Lock, Gear } from "../icons";
import { daysAround, shortDay } from "../../lib/dates";
import { TABS } from "../../constants";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";
import { DaybookLogo } from "../ui/DaybookLogo";
import { getUserInitial } from "../../lib/users";

export function Header({
  profile,
  tab,
  showUserChip = true,
  today,
  day,
  isToday,
  showDays,
  setShowDays,
  setViewDate,
  onLock,
  setShowSettings,
}) {
  const { T } = useTheme();
  const tabLabel = TABS.find((t) => t.id === tab)?.label || "Today";
  const dateStr = isToday
    ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <header className={`app-header ${tab === "today" ? "app-header--today" : ""}`}>
        <div style={{ minWidth: 0 }}>
          <div className="header-brand">
            <DaybookLogo size={20} textSize={20} />
          </div>
          <div className="header-mobile-tab">{tabLabel}</div>
          <div className="header-page-title" style={{ ...fontHead, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink, marginBottom: 2 }}>
            {tabLabel}
          </div>
          <button
            type="button"
            className="header-date-btn"
            onClick={() => setShowDays((s) => !s)}
            aria-label="Change day"
            aria-expanded={showDays}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              color: isToday ? T.inkSoft : T.money,
              fontWeight: 600,
              ...fontBody,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isToday ? dateStr : `${day > today ? "Planning" : "Editing"} - ${dateStr}`}
            <span
              aria-hidden="true"
              style={{
                fontSize: 8,
                opacity: 0.7,
                transform: showDays ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            >
              ▼
            </span>
          </button>
        </div>
        <div className="header-actions">
          {showUserChip && profile?.name && (
            <span className="user-chip header-user-chip" aria-hidden>
              <span className="user-chip-avatar">{getUserInitial(profile.name)}</span>
              {profile.name.split(" ")[0]}
            </span>
          )}
          <button type="button" title="Log out" onClick={onLock} aria-label="Log out" className="icon-btn">
            <Lock size={17} />
          </button>
          <button type="button" title="Settings" onClick={() => setShowSettings(true)} aria-label="Open settings" className="icon-btn">
            <Gear size={17} />
          </button>
        </div>
      </header>

      {showDays && (
        <DayStrip today={today} day={day} setViewDate={setViewDate} setShowDays={setShowDays} isToday={isToday} />
      )}
    </>
  );
}

function DayStrip({ today, day, setViewDate, setShowDays, isToday }) {
  const { T } = useTheme();
  const stripRef = useRef(null);

  useEffect(() => {
    const container = stripRef.current;
    const activeBtn = container?.querySelector(`[data-day="${day}"]`);
    if (!container || !activeBtn) return;
    const left = activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [day]);

  return (
    <div className="content-wrap" style={{ paddingTop: 4, paddingBottom: 8 }}>
      <div
        ref={stripRef}
        className="fade-up day-strip-scroll"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: 10,
          background: T.card,
          border: `1px solid ${T.line}`,
          borderRadius: 16,
          boxShadow: T.shadow,
        }}
      >
        {daysAround(14, 14).map((d) => {
          const active = d === day;
          const isT = d === today;
          const future = d > today;
          return (
            <button
              key={d}
              type="button"
              data-day={d}
              onClick={() => {
                setViewDate(d);
                setShowDays(false);
              }}
              style={{
                ...fontHead,
                flexShrink: 0,
                display: "grid",
                justifyItems: "center",
                gap: 2,
                padding: "8px 12px",
                borderRadius: 12,
                cursor: "pointer",
                border: `1.5px ${future && !active ? "dashed" : "solid"} ${active ? T.money : future ? T.line : "transparent"}`,
                background: active ? T.moneySoft : "transparent",
                color: active ? T.money : future ? T.dim : T.inkSoft,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700 }}>{isT ? "Today" : shortDay(d)}</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{d.slice(-2)}</span>
            </button>
          );
        })}
      </div>
      {!isToday && (
        <button
          type="button"
          onClick={() => {
            setViewDate(today);
            setShowDays(false);
          }}
          className="btn-primary"
          style={{ marginTop: 10, padding: "11px 0", fontSize: 13 }}
        >
          Back to today
        </button>
      )}
    </div>
  );
}
