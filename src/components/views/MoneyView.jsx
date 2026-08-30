import { useState } from "react";
import { Card, SectionTitle, Chip, EmptyState } from "../ui/Card";
import { EditableAmount } from "../ui/EditableAmount";
import { X } from "../icons";
import { SPEND_CATS } from "../../constants";
import { lastNDays, shortDay, niceDate, monthLabel, monthShort, fmtK } from "../../lib/dates";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";

const RANGES = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "12m", label: "Monthly - 12 months" },
];

function SpendLineChart({ bars, rangeMax, budget, range, T }) {
  if (bars.length < 2) return null;

  const w = 400;
  const h = 80;
  const padX = 4;
  const padY = 12;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;
  const max = Math.max(rangeMax, budget > 0 && range !== "12m" ? budget : 0, 1);

  const points = bars.map((b, i) => ({
    x: padX + (i / (bars.length - 1)) * chartW,
    y: padY + chartH - (b.value / max) * chartH,
    value: b.value,
    key: b.key,
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${padY + chartH} L ${points[0].x.toFixed(1)} ${padY + chartH} Z`;
  const budgetY = budget > 0 && range !== "12m" ? padY + chartH - (budget / max) * chartH : null;

  return (
    <div className="spend-line-chart">
      <div className="spend-line-chart-header">
        <span style={{ ...fontHead, fontSize: 13, fontWeight: 700, color: T.inkSoft }}>Spending trend</span>
        {budgetY !== null && (
          <span className="spend-line-budget-legend">
            <span className="spend-line-budget-dash" style={{ borderColor: T.food }} />
            Daily budget
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden preserveAspectRatio="none" className="spend-line-svg">
        {budgetY !== null && (
          <line
            x1={padX}
            y1={budgetY}
            x2={w - padX}
            y2={budgetY}
            stroke={T.food}
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity={0.7}
          />
        )}
        <path d={area} fill={T.moneySoft} opacity={0.55} />
        <path d={line} fill="none" stroke={T.money} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r={range === "30d" ? 2 : 3.5}
            fill={T.money}
            stroke={T.card}
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
}

export function MoneyView({ spends, setSpends, today, budget, currencySymbol: sym, ping, goToday }) {
  const { T } = useTheme();
  const todayList = spends.filter((s) => s.date === today).slice().reverse();
  const catOf = (id) => SPEND_CATS.find((c) => c.id === id) || SPEND_CATS[5];

  const months = [...new Set(spends.map((s) => s.date.slice(0, 7)))].sort().reverse();
  const curMonth = today.slice(0, 7);
  if (!months.includes(curMonth)) months.unshift(curMonth);
  const [histMonth, setHistMonth] = useState(curMonth);
  const [histCat, setHistCat] = useState("all");
  const histAll = spends.filter((s) => s.date.startsWith(histMonth));
  const hist = (histCat === "all" ? histAll : histAll.filter((s) => s.cat === histCat))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const histTotal = hist.reduce((a, s) => a + s.amount, 0);
  const monthTotal = histAll.reduce((a, s) => a + s.amount, 0);
  const histByDate = hist.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});

  const [range, setRange] = useState("7d");
  const [showRanges, setShowRanges] = useState(false);

  let bars;
  if (range === "12m") {
    const ms = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      ms.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    bars = ms.map((m) => {
      const daysInM = new Date(parseInt(m.slice(0, 4)), parseInt(m.slice(5, 7)), 0).getDate();
      const v = spends.filter((s) => s.date.startsWith(m)).reduce((a, s) => a + s.amount, 0);
      return {
        key: m,
        label: monthShort(m),
        value: v,
        isNow: m === today.slice(0, 7),
        over: budget > 0 && v > budget * daysInM,
      };
    });
  } else {
    const n = range === "30d" ? 30 : 7;
    bars = lastNDays(n).map((d, i) => ({
      key: d,
      value: spends.filter((s) => s.date === d).reduce((a, s) => a + s.amount, 0),
      label: n === 7 ? shortDay(d) : i % 5 === 0 || d === today ? d.slice(-2) : "",
      isNow: d === today,
      over: false,
    }));
    bars.forEach((b) => {
      b.over = budget > 0 && b.value > budget;
    });
  }
  const rangeTotal = bars.reduce((a, b) => a + b.value, 0);
  const rangeMax = Math.max(...bars.map((b) => b.value), 1);

  return (
    <>
      <Card className="money-chart-card">
        <SectionTitle color={T.money}>
          <button
            type="button"
            onClick={() => setShowRanges((s) => !s)}
            aria-expanded={showRanges}
            aria-label="Change chart period"
            style={{
              ...fontHead,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              color: T.money,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {RANGES.find((r) => r.id === range).label}
            <span
              style={{
                fontSize: 9,
                transform: showRanges ? "rotate(180deg)" : "none",
                transition: "transform .15s",
              }}
            >
              ▼
            </span>
          </button>
        </SectionTitle>
        <p className="money-budget-readonly" style={{ ...fontHead, fontSize: 13, fontWeight: 600, color: T.inkSoft, marginBottom: 12 }}>
          Daily budget {sym}{budget.toLocaleString()} · edit in Settings
        </p>
        {showRanges && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, animation: "toastIn .15s ease" }}>
            {RANGES.map((r) => (
              <Chip
                key={r.id}
                active={range === r.id}
                color={T.money}
                softColor={T.moneySoft}
                onClick={() => {
                  setRange(r.id);
                  setShowRanges(false);
                }}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <span style={{ ...fontHead, fontSize: 30, fontWeight: 800 }}>{sym}{rangeTotal.toLocaleString()}</span>
          <span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 700 }}>
            - avg {sym}{Math.round(rangeTotal / bars.length).toLocaleString()}/{range === "12m" ? "month" : "day"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: range === "7d" ? 8 : 3, height: 110 }}>
          {bars.map((b) => (
            <div
              key={b.key}
              aria-label={`${b.key}: ${sym}${b.value.toLocaleString()}`}
              style={{ flex: 1, display: "grid", justifyItems: "center", gap: 4, alignSelf: "end", minWidth: 0 }}
            >
              {range !== "30d" && (
                <span style={{ ...fontHead, fontSize: 10, fontWeight: 700, color: T.inkSoft, whiteSpace: "nowrap" }}>
                  {b.value > 0 ? `${sym}${fmtK(b.value)}` : ""}
                </span>
              )}
              <div
                style={{
                  width: "100%",
                  maxWidth: range === "7d" ? 40 : 24,
                  borderRadius: range === "30d" ? 4 : 8,
                  height: Math.max((b.value / rangeMax) * 70, 4),
                  background: b.isNow ? T.money : b.over ? T.food : T.barSoft,
                  transition: "height .4s ease",
                }}
              />
              <span
                style={{
                  fontSize: range === "7d" ? 11 : 9.5,
                  fontWeight: 700,
                  color: b.isNow ? T.ink : T.inkSoft,
                  whiteSpace: "nowrap",
                }}
              >
                {b.label}
              </span>
            </div>
          ))}
        </div>
        <SpendLineChart bars={bars} rangeMax={rangeMax} budget={budget} range={range} T={T} />
      </Card>
      <Card>
        <SectionTitle color={T.money}>Today's entries</SectionTitle>
        {todayList.length === 0 ? (
          <EmptyState icon="💳">Nothing logged today yet. Add a spend from the Today tab or below.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {todayList.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{catOf(s.cat).emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.note || catOf(s.cat).label}
                  </div>
                  <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>{catOf(s.cat).label}</div>
                </div>
                <EditableAmount
                  value={s.amount}
                  onSave={(v) => {
                    setSpends((p) => p.map((x) => (x.id === s.id ? { ...x, amount: v } : x)));
                    ping("Amount updated");
                  }}
                  size={15}
                  currencySymbol={sym}
                />
                <button
                  type="button"
                  onClick={() => {
                    const removed = s;
                    setSpends((p) => p.filter((x) => x.id !== s.id));
                    ping(`Deleted ${sym}${s.amount.toLocaleString()}`, () => setSpends((p) => [...p, removed]));
                  }}
                  aria-label="Delete entry"
                  style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", padding: 2 }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="money-history-card">
        <SectionTitle
          color={T.money}
          right={
            <select
              value={histMonth}
              onChange={(e) => setHistMonth(e.target.value)}
              aria-label="Choose month"
              style={{
                ...fontHead,
                fontSize: 13,
                fontWeight: 800,
                padding: "5px 8px",
                borderRadius: 10,
                border: `1.5px solid ${T.line}`,
                background: T.field,
                color: T.ink,
                cursor: "pointer",
              }}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          }
        >
          History
        </SectionTitle>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
          <span style={{ ...fontHead, fontSize: 26, fontWeight: 800 }}>{sym}{histTotal.toLocaleString()}</span>
          {histCat !== "all" && (
            <span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 700 }}>of {sym}{monthTotal.toLocaleString()} total</span>
          )}
          <span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 700 }}>
            - {hist.length} entr{hist.length === 1 ? "y" : "ies"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Chip active={histCat === "all"} color={T.money} softColor={T.moneySoft} onClick={() => setHistCat("all")}>
            All
          </Chip>
          {SPEND_CATS.map((c) => (
            <Chip
              key={c.id}
              active={histCat === c.id}
              color={T.money}
              softColor={T.moneySoft}
              onClick={() => setHistCat(c.id)}
            >
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
        {hist.length === 0 ? (
          <EmptyState icon="📊">
            No spending logged for this month{histCat !== "all" ? " in this category" : ""}.
          </EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 12, maxHeight: 340, overflowY: "auto" }}>
            {Object.keys(histByDate).map((d) => (
              <div key={d}>
                <div
                  style={{
                    ...fontHead,
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: T.inkSoft,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  {d === today ? "Today" : niceDate(d)} - {sym}{histByDate[d].reduce((a, s) => a + s.amount, 0).toLocaleString()}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {histByDate[d].map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{catOf(s.cat).emoji}</span>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontWeight: 700,
                          fontSize: 14,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.note || catOf(s.cat).label}
                      </div>
                      <EditableAmount
                        value={s.amount}
                        onSave={(v) => {
                          setSpends((p) => p.map((x) => (x.id === s.id ? { ...x, amount: v } : x)));
                          ping("Amount updated");
                        }}
                        size={14}
                        currencySymbol={sym}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const removed = s;
                          setSpends((p) => p.filter((x) => x.id !== s.id));
                          ping(`Deleted ${sym}${s.amount.toLocaleString()}`, () => setSpends((p) => [...p, removed]));
                        }}
                        aria-label="Delete entry"
                        style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", padding: 2 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
