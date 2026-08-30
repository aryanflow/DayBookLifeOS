import { useState, useEffect } from "react";
import { Card, SectionTitle, Chip } from "../ui/Card";
import { DayPulse } from "../ui/DayPulse";
import { Plus } from "../icons";
import { SPEND_CATS, MEAL_QUALITY, MOODS } from "../../constants";
import { greeting } from "../../lib/dates";
import { useTheme } from "../../theme/ThemeContext";
import { fontHead, fontBody } from "../../theme/colors";

function bodyInsight(glasses, waterGoal, hours) {
  const waterLeft = Math.max(0, waterGoal - glasses);
  const parts = [];
  if (glasses >= waterGoal) parts.push("Water goal hit");
  else if (glasses >= waterGoal / 2) parts.push(`${waterLeft} glasses to go`);
  else parts.push(`${waterLeft} behind pace`);

  if (hours === null) parts.push("log sleep");
  else if (hours >= 7) parts.push("rested");
  else if (hours >= 6) parts.push("light sleep");
  else parts.push("short sleep");

  return parts.join(" · ");
}

export function TodayView({
  habits,
  doneToday,
  toggleHabit,
  habitPct,
  mealsToday,
  spendsToday,
  spendTotalToday,
  budget,
  setSpends,
  setMeals,
  today,
  isToday,
  ping,
  streak,
  water,
  setWater,
  sleep,
  setSleep,
  notes,
  setNotes,
  userName,
  currencySymbol: sym,
}) {
  const { T } = useTheme();
  const greet = greeting(userName, isToday, today);

  return (
    <div className="today-grid">
      <Card className="today-greet" highlight>
        <div className="today-greet-inner">
          <div
            className="today-greet-title"
            style={{ ...fontHead, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: !isToday ? T.money : T.ink }}
          >
            {greet}
          </div>
          <DayPulse
            compact
            habitPct={habitPct}
            mealCount={mealsToday.length}
            spendToday={spendTotalToday}
            budget={budget}
            currencySymbol={sym}
          />
        </div>
      </Card>

      <Card className="today-habits">
        <SectionTitle color={T.habit}>Tap what you did</SectionTitle>
        <div className="habit-chip-row">
          {habits.map((h) => {
            const done = doneToday.includes(h.id);
            const days = streak(h.id);
            return (
              <Chip key={h.id} active={done} color={T.habit} softColor={T.habitSoft} onClick={() => toggleHabit(h.id)}>
                {h.emoji} {h.name}
                {done && days >= 1 ? ` · ${days}d` : ""}
              </Chip>
            );
          })}
        </div>
      </Card>

      <QuickSpend
        className="today-spend"
        setSpends={setSpends}
        today={today}
        ping={ping}
        spendTotalToday={spendTotalToday}
        budget={budget}
        currencySymbol={sym}
      />
      <QuickMeal setMeals={setMeals} today={today} ping={ping} mealsToday={mealsToday} className="today-meal today-meal-card" />
      <BodyCard className="today-body" today={today} water={water} setWater={setWater} sleep={sleep} setSleep={setSleep} ping={ping} />
      <JournalCard today={today} notes={notes} setNotes={setNotes} ping={ping} className="today-journal" />
    </div>
  );
}

function BodyCard({ today, water, setWater, sleep, setSleep, ping, className = "" }) {
  const { T } = useTheme();
  const glasses = water[today] || 0;
  const hours = sleep[today] ?? null;
  const waterGoal = 8;
  const insight = bodyInsight(glasses, waterGoal, hours);

  return (
    <Card className={`today-body-card ${className}`.trim()}>
      <SectionTitle
        color={T.water}
        right={
          <span className="body-insight" style={{ ...fontBody, fontSize: 13, fontWeight: 600, color: T.inkSoft }}>
            {insight}
          </span>
        }
      >
        Body & mind
      </SectionTitle>
      <div className="water-row">
        <div className="water-glasses" role="group" aria-label="Water glasses today">
          {Array.from({ length: waterGoal }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const next = i + 1 === glasses ? i : i + 1;
                setWater((p) => ({ ...p, [today]: next }));
                if (next === waterGoal) ping("Water goal hit! 💧🎉");
              }}
              aria-label={`${i + 1} glass${i === 0 ? "" : "es"}${i < glasses ? ", filled" : ""}`}
              aria-pressed={i < glasses}
              className={`water-glass${i < glasses ? " water-glass--filled" : ""}`}
              style={{
                borderColor: i < glasses ? T.water : T.line,
                background: i < glasses ? "rgba(62,155,214,.22)" : "transparent",
              }}
            >
              {i < glasses ? "💧" : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="sleep-row">
        <span className="sleep-label" style={{ ...fontBody, color: T.inkSoft }}>
          😴 Slept
        </span>
        <div className="sleep-slider-wrap">
          <input
            type="range"
            min="3"
            max="12"
            step="0.5"
            value={hours ?? 7}
            onChange={(e) => setSleep((p) => ({ ...p, [today]: parseFloat(e.target.value) }))}
            aria-label="Hours slept"
            className="sleep-slider"
            style={{ accentColor: T.journal }}
            list="sleep-ticks"
          />
          <datalist id="sleep-ticks">
            <option value="4" label="4h" />
            <option value="6" label="6h" />
            <option value="8" label="8h" />
            <option value="10" label="10h" />
          </datalist>
          <div className="sleep-tick-labels" aria-hidden="true">
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
        </div>
        <span
          className="sleep-value"
          style={{
            ...fontHead,
            color: hours === null ? T.dim : hours >= 7 ? T.habit : hours >= 6 ? T.money : T.food,
          }}
        >
          {hours === null ? "-" : `${hours}h`}
        </span>
      </div>
    </Card>
  );
}

function JournalCard({ today, notes, setNotes, ping, className = "" }) {
  const { T } = useTheme();
  const entry = notes[today] || { text: "", mood: null };
  const [draft, setDraft] = useState(entry.text);
  useEffect(() => {
    setDraft((notes[today] || {}).text || "");
  }, [today, notes]);

  const save = () => {
    setNotes((p) => ({ ...p, [today]: { ...(p[today] || {}), text: draft.trim() } }));
    if (draft.trim()) ping("Day noted 📝");
  };

  return (
    <Card className={`today-journal-card ${className}`.trim()}>
      <SectionTitle color={T.journal}>How was today?</SectionTitle>
      <div className="mood-row" role="group" aria-label="Pick a mood">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() =>
              setNotes((p) => ({
                ...p,
                [today]: {
                  ...(p[today] || { text: "" }),
                  mood: p[today]?.mood === m.id ? null : m.id,
                },
              }))
            }
            aria-label={`Mood: ${m.id}`}
            aria-pressed={entry.mood === m.id}
            className={`mood-btn${entry.mood === m.id ? " mood-btn--active" : ""}`}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      <label className="journal-note-label" style={{ ...fontBody, color: T.inkSoft }}>
        A line about today
        <input
          className="field-input journal-note-input"
          placeholder="What stood out?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && (save(), e.target.blur())}
        />
      </label>
    </Card>
  );
}

function QuickSpend({ setSpends, today, ping, spendTotalToday, budget, currencySymbol: sym, className = "" }) {
  const { T } = useTheme();
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState("food");
  const [note, setNote] = useState("");

  const add = () => {
    const v = parseFloat(amt);
    if (!v || v <= 0) {
      ping("Enter an amount first");
      return;
    }
    setSpends((p) => [...p, { id: Date.now(), date: today, amount: v, cat, note: note.trim() }]);
    setAmt("");
    setNote("");
    ping(`${sym}${v} logged`);
  };

  const over = budget > 0 && spendTotalToday > budget;

  return (
    <Card className={`today-spend-card ${className}`.trim()}>
      <SectionTitle
        color={T.money}
        right={
          <span style={{ ...fontHead, fontSize: 14, fontWeight: 800, color: over ? T.food : T.ink }}>
            {sym}{spendTotalToday.toLocaleString()}{" "}
            <span style={{ color: T.inkSoft, fontWeight: 600 }}>/ {sym}{budget.toLocaleString()}</span>
          </span>
        }
      >
        Quick spend
      </SectionTitle>
      <div className="spend-input-row">
        <label className="field-label" style={{ ...fontBody, color: T.inkSoft }}>
          Amount
          <input
            inputMode="decimal"
            placeholder="0"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="field-input field-input--amount"
          />
        </label>
        <label className="field-label field-label--grow" style={{ ...fontBody, color: T.inkSoft }}>
          Note <span className="field-optional">(optional)</span>
          <input
            placeholder="What was it?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="field-input"
          />
        </label>
      </div>
      <div className="chip-row">
        {SPEND_CATS.map((c) => (
          <Chip key={c.id} active={cat === c.id} color={T.money} softColor={T.moneySoft} onClick={() => setCat(c.id)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-action btn-action--money btn-action--solid">
        <Plus size={18} /> Log spend
      </button>
    </Card>
  );
}

function QuickMeal({ setMeals, today, ping, mealsToday, className = "" }) {
  const { T } = useTheme();
  const [name, setName] = useState("");
  const [quality, setQuality] = useState("healthy");

  const add = () => {
    if (!name.trim()) {
      ping("What did you eat?");
      return;
    }
    setMeals((p) => [...p, { id: Date.now(), date: today, name: name.trim(), quality }]);
    setName("");
    ping("Meal logged");
  };

  return (
    <Card className={`today-meal-card-inner ${className}`.trim()}>
      <SectionTitle color={T.food} right={<span style={{ ...fontHead, fontSize: 14, fontWeight: 800 }}>{mealsToday.length} today</span>}>
        Quick meal
      </SectionTitle>
      <input
        placeholder="What did you eat?"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        className="field-input"
        style={{ marginBottom: 8, width: "100%" }}
      />
      <div className="chip-row chip-row--meal">
        {MEAL_QUALITY.map((q) => (
          <Chip key={q.id} active={quality === q.id} color={T.food} softColor={T.foodSoft} onClick={() => setQuality(q.id)}>
            {q.emoji} {q.label}
          </Chip>
        ))}
      </div>
      <button type="button" onClick={add} className="btn-action btn-action--food btn-action--solid">
        <Plus size={18} /> Log meal
      </button>
    </Card>
  );
}
