import { Card, SectionTitle } from "../ui/Card";
import { SPEND_CATS, MOOD_EMOJI, MOODS } from "../../constants";
import { lastNDays, shortDay, niceDate } from "../../lib/dates";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";

const WATER_GOAL = 8;
const SLEEP_CHART_MAX = 10;
const BAR_CHART_H = 44;

function barHeight(value, max, chartH = BAR_CHART_H) {
  if (!value || value <= 0) return 4;
  return Math.max(6, Math.round((value / max) * chartH));
}

export function TrendsView({ spends, meals, habits, habitLog, budget, currencySymbol: sym, water, sleep, notes, goToday }) {
  const { T } = useTheme();
  const days = lastNDays(28);
  const days7 = days.slice(-7);
  const spendByDay = days7.map((d) => spends.filter((s) => s.date === d).reduce((a, s) => a + s.amount, 0));
  const catTotals = SPEND_CATS.map((c) => ({
    ...c,
    total: spends.filter((s) => days7.includes(s.date) && s.cat === c.id).reduce((a, s) => a + s.amount, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const catMax = Math.max(...catTotals.map((c) => c.total), 1);
  const consistency = days7.map((d) => (habits.length ? (habitLog[d] || []).length / habits.length : 0));
  const avgConsistency = Math.round((consistency.reduce((a, b) => a + b, 0) / 7) * 100);

  const activeDays = new Set([
    ...Object.keys(habitLog).filter((d) => (habitLog[d] || []).length),
    ...spends.map((s) => s.date),
    ...meals.map((m) => m.date),
    ...Object.keys(water || {}).filter((d) => water[d] > 0),
    ...Object.keys(sleep || {}).filter((d) => sleep[d] > 0),
    ...Object.keys(notes || {}).filter((d) => notes[d]?.text || notes[d]?.mood),
  ]).size;

  if (activeDays < 3) {
    return (
      <Card>
        <SectionTitle color={T.habit}>Trends</SectionTitle>
        <div style={{ textAlign: "center", padding: "18px 8px" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>📈</div>
          <div style={{ ...fontHead, fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
            Charts unlock after 3 days of logging
          </div>
          <div style={{ fontSize: 13.5, color: T.inkSoft, fontWeight: 600, marginBottom: 14 }}>
            {activeDays === 0 ? "Log anything today to get started." : `${activeDays} of 3 days done - keep going.`}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ width: 26, height: 8, borderRadius: 99, background: i < activeDays ? T.habit : T.line }}
              />
            ))}
          </div>
          <button type="button" onClick={goToday} className="btn-primary trends-unlock-btn">
            Log today
          </button>
        </div>
      </Card>
    );
  }

  const waterByDay = days7.map((d) => (water || {})[d] || 0);
  const sleepByDay = days7.map((d) => (sleep || {})[d] || 0);
  const sleepLogged = sleepByDay.filter((v) => v > 0);
  const avgSleep = sleepLogged.length ? sleepLogged.reduce((a, b) => a + b, 0) / sleepLogged.length : 0;
  const moodTrail = days7.map((d) => ({ d, mood: (notes || {})[d]?.mood || null }));
  const anyBody = waterByDay.some((v) => v > 0) || sleepLogged.length > 0;
  const anyMood = moodTrail.some((m) => m.mood);

  return (
    <>
      <Card className="trends-heatmap-card">
        <SectionTitle
          color={T.habit}
          right={<span style={{ ...fontHead, fontWeight: 800, fontSize: 15 }}>{avgConsistency}% avg</span>}
        >
          Habit consistency - 4 weeks
        </SectionTitle>
        <div className="heatmap-wrap">
          <div className="heatmap-grid" role="img" aria-label="Habit consistency heatmap, last 4 weeks">
            {days.map((d) => {
              const pct = habits.length ? (habitLog[d] || []).length / habits.length : 0;
              const label = `${niceDate(d)}: ${Math.round(pct * 100)}% habits done`;
              return (
                <div
                  key={d}
                  className="heatmap-cell"
                  aria-label={label}
                  style={{
                    background: pct === 0 ? T.line : pct < 0.5 ? T.habitSoft2 : pct < 1 ? T.habitMid : T.habit,
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="heatmap-axis">
          <span>{niceDate(days[0])}</span>
          <span>today</span>
        </div>
      </Card>

      {anyBody && (
        <Card>
          <SectionTitle
            color={T.habit}
            right={
              avgSleep > 0 ? (
                <span style={{ ...fontHead, fontWeight: 800, fontSize: 14 }}>{avgSleep.toFixed(1)}h avg sleep</span>
              ) : null
            }
          >
            Body - 7 days
          </SectionTitle>
          <div className="body-trend-charts">
            <div>
              <div className="body-trend-label">💧 Water (glasses)</div>
              <div className="body-bar-chart" role="img" aria-label="Water intake last 7 days">
                {waterByDay.map((v, i) => (
                  <div key={days7[i]} className="body-bar-col">
                    <div
                      className="body-bar"
                      style={{
                        height: barHeight(v, WATER_GOAL),
                        background: v > 0 ? T.water : T.line,
                      }}
                      aria-label={`${shortDay(days7[i])}: ${v} glasses`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="body-trend-label">😴 Sleep (hours)</div>
              <div className="body-bar-chart" role="img" aria-label="Sleep last 7 days">
                {sleepByDay.map((v, i) => (
                  <div key={days7[i]} className="body-bar-col">
                    <div
                      className="body-bar"
                      style={{
                        height: barHeight(v, SLEEP_CHART_MAX),
                        background: v >= 7 ? T.habit : v > 0 ? T.money : T.line,
                      }}
                      aria-label={`${shortDay(days7[i])}: ${v > 0 ? `${v}h` : "not logged"}`}
                    />
                  </div>
                ))}
              </div>
              <div className="body-bar-days">
                {days7.map((d) => (
                  <span key={d} className={d === days7[6] ? "body-bar-day body-bar-day--today" : "body-bar-day"}>
                    {shortDay(d).slice(0, 2)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {anyMood && (
        <Card>
          <SectionTitle color={T.food}>Mood trail - 7 days</SectionTitle>
          <div className="mood-trail">
            {moodTrail.map(({ d, mood }) => (
              <div key={d} className="mood-trail-day">
                <div className={`mood-trail-slot${mood ? " mood-trail-slot--logged" : ""}`} aria-label={mood ? `Mood: ${mood}` : "Not logged"}>
                  {mood ? MOOD_EMOJI[mood] || MOODS[1].emoji : MOODS[1].emoji}
                </div>
                <span className={`mood-trail-label${d === days7[6] ? " mood-trail-label--today" : ""}`}>
                  {shortDay(d).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle color={T.money}>Where the money went - 7 days</SectionTitle>
        {catTotals.length === 0 ? (
          <button type="button" onClick={goToday} className="trends-empty-cta">
            + Log a spend to see the breakdown
          </button>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {catTotals.map((c) => (
              <div key={c.id}>
                <div className="cat-row-header">
                  <span>
                    {c.emoji} {c.label}
                  </span>
                  <span style={{ ...fontHead, fontWeight: 800 }}>{sym}{c.total.toLocaleString()}</span>
                </div>
                <div className="cat-bar-track">
                  <div className="cat-bar-fill" style={{ width: `${(c.total / catMax) * 100}%`, background: T.money }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="trends-summary-card">
        <SectionTitle color={T.food}>The week in one line</SectionTitle>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, fontWeight: 600, color: T.inkSoft }}>
          You spent <b style={{ color: T.ink }}>{sym}{spendByDay.reduce((a, b) => a + b, 0).toLocaleString()}</b> this week
          {budget > 0 && (
            <>
              {" "}
              ({spendByDay.filter((v) => v > budget).length} day
              {spendByDay.filter((v) => v > budget).length === 1 ? "" : "s"} over budget)
            </>
          )}
          , logged <b style={{ color: T.ink }}>{meals.filter((m) => days7.includes(m.date)).length} meals</b>,
          {avgSleep > 0 && (
            <>
              {" "}
              slept <b style={{ color: T.ink }}>{avgSleep.toFixed(1)}h</b> a night on average,
            </>
          )}{" "}
          and kept habits at <b style={{ color: T.ink }}>{avgConsistency}%</b> consistency.
        </p>
      </Card>
    </>
  );
}
