import { useTheme } from "../../theme/ThemeContext";
import { fontBody, fontHead } from "../../theme/colors";

export function DayPulse({
  habitPct,
  mealCount,
  spendToday,
  budget,
  currencySymbol = "₹",
  compact = false,
}) {
  const { T } = useTheme();
  const mealPct = Math.min(mealCount / 3, 1);
  const spendPct = budget > 0 ? spendToday / budget : 0;
  const spendOver = budget > 0 && spendToday > budget;

  const rings = [
    { pct: Math.min(habitPct, 1), raw: habitPct, color: T.habit, label: "Habits" },
    { pct: mealPct, raw: mealPct, color: T.food, label: "Meals" },
  ];

  const allZero = habitPct === 0 && mealCount === 0 && spendToday === 0;
  const perfectDay = habitPct >= 1 && mealCount > 0 && !spendOver;

  const size = compact ? 120 : 148;
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 148;
  const baseR = 60 * scale;
  const ringStep = 16 * scale;
  const strokeW = 8 * scale;

  const spendCopy = () => {
    if (budget <= 0) return "No budget set";
    if (spendToday === 0) return `${currencySymbol}0 of ${currencySymbol}${budget.toLocaleString()} · on track`;
    if (spendOver) {
      return `${currencySymbol}${spendToday.toLocaleString()} of ${currencySymbol}${budget.toLocaleString()} · over`;
    }
    return `${currencySymbol}${spendToday.toLocaleString()} of ${currencySymbol}${budget.toLocaleString()} · on track`;
  };

  const formatPct = (raw) => (raw > 0 ? `${Math.round(raw * 100)}%` : "-");

  return (
    <div className="day-pulse">
      <div className="day-pulse-layout">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Today's habit and meal progress"
          className="day-pulse-ring"
        >
          {rings.map((a, i) => {
            const r = baseR - i * ringStep;
            const c = 2 * Math.PI * r;
            return (
              <g key={a.label}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.line} strokeWidth={strokeW} opacity={0.7} />
                {a.pct >= 0.02 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    strokeDasharray={`${c * a.pct} ${c}`}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    className="pulse-arc"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="day-pulse-legend">
          {rings.map((a) => (
            <div key={a.label} className="pulse-legend-row">
              <span className="pulse-legend-label" style={{ ...fontBody, color: T.inkSoft }}>
                {a.label}
              </span>
              <div className="pulse-legend-bar">
                <div
                  className="pulse-legend-fill"
                  style={{
                    width: `${Math.min(a.raw, 1) * 100}%`,
                    background: a.color,
                  }}
                />
              </div>
              <span
                className="pulse-legend-value"
                style={{
                  ...fontHead,
                  color: a.raw > 0 ? T.ink : T.dim,
                }}
              >
                {formatPct(a.raw)}
              </span>
            </div>
          ))}
          <div className="pulse-legend-row pulse-legend-row--spend">
            <span className="pulse-legend-label" style={{ ...fontBody, color: T.inkSoft }}>
              Spend
            </span>
            <div className="pulse-legend-bar">
              <div
                className="pulse-legend-fill"
                style={{
                  width: budget > 0 ? `${Math.min(spendPct, 1) * 100}%` : "0%",
                  background: spendOver ? T.food : T.money,
                }}
              />
            </div>
            <span
              className="pulse-legend-spend-copy"
              style={{
                ...fontHead,
                color: spendOver ? T.food : spendToday > 0 ? T.ink : T.dim,
              }}
            >
              {spendCopy()}
            </span>
          </div>
        </div>
      </div>
      {spendOver && (
        <div className="day-pulse-alert" style={{ background: T.foodSoft, color: T.food }}>
          Over daily budget by {currencySymbol}{(spendToday - budget).toLocaleString()}
        </div>
      )}
      {allZero && (
        <p className="day-pulse-hint" style={{ color: T.inkSoft }}>
          Fresh day - log a habit or entry below to fill the rings.
        </p>
      )}
      {perfectDay && !allZero && (
        <p className="day-pulse-hint day-pulse-hint--good" style={{ color: T.habit }}>
          All habits done - great start today
        </p>
      )}
    </div>
  );
}
