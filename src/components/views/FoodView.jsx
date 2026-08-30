import { Card, SectionTitle, EmptyState } from "../ui/Card";
import { X } from "../icons";
import { MEAL_QUALITY } from "../../constants";
import { lastNDays } from "../../lib/dates";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";
import { useActivityLog } from "../../hooks/useActivityLogger";

export function FoodView({ meals, setMeals, today, ping, goToday }) {
  const { T } = useTheme();
  const { log } = useActivityLog();
  const days = lastNDays(7);
  const week = meals.filter((m) => days.includes(m.date));
  const counts = MEAL_QUALITY.map((q) => week.filter((m) => m.quality === q.id).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const score = total
    ? Math.round(
        (week.reduce((a, m) => a + (MEAL_QUALITY.find((q) => q.id === m.quality)?.score || 0), 0) / (total * 2)) * 100
      )
    : null;
  const todayList = meals.filter((m) => m.date === today).slice().reverse();
  const qOf = (id) => MEAL_QUALITY.find((q) => q.id === id) || MEAL_QUALITY[1];
  const qColor = { healthy: T.habit, okay: T.money, junk: T.food };

  return (
    <>
      <Card>
        <SectionTitle color={T.food}>Eating score - last 7 days</SectionTitle>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <span style={{ ...fontHead, fontSize: 38, fontWeight: 800 }}>{score === null ? "-" : `${score}%`}</span>
          <span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 700 }}>
            {score === null
              ? "log meals to see your score"
              : score >= 70
                ? "eating well 🌱"
                : score >= 40
                  ? "room to improve"
                  : "lots of junk lately 👀"}
          </span>
        </div>
        {total > 0 && (
          <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", gap: 2 }}>
            {MEAL_QUALITY.map(
              (q, i) =>
                counts[i] > 0 && (
                  <div key={q.id} title={`${q.label}: ${counts[i]}`} style={{ flex: counts[i], background: qColor[q.id] }} />
                )
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          {MEAL_QUALITY.map((q, i) => (
            <span key={q.id} style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft }}>
              {q.emoji} {q.label} - {counts[i]}
            </span>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle color={T.food}>Today's plate</SectionTitle>
        {todayList.length === 0 ? (
          <EmptyState icon="🍽️">
            No meals logged today.
            <button type="button" className="btn-action btn-action--food" style={{ marginTop: 14 }} onClick={goToday}>
              Log a meal on Today
            </button>
          </EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {todayList.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{qOf(m.quality).emoji}</span>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: qColor[m.quality],
                    background:
                      m.quality === "healthy" ? T.habitSoft : m.quality === "okay" ? T.moneySoft : T.foodSoft,
                    padding: "3px 10px",
                    borderRadius: 99,
                  }}
                >
                  {qOf(m.quality).label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const removed = m;
                    setMeals((p) => p.filter((x) => x.id !== m.id));
                    log("meal.deleted", { name: m.name, date: m.date, quality: m.quality });
                    ping(`Removed ${m.name}`, () => setMeals((p) => [...p, removed]));
                  }}
                  aria-label="Delete meal"
                  style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", padding: 2 }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
