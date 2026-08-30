import { dkey } from "../lib/dates";

export function useHabitStreak(habitLog) {
  return (id) => {
    let n = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const done = (habitLog[dkey(d)] || []).includes(id);
      if (done) n++;
      else if (i === 0) continue;
      else break;
    }
    return n;
  };
}

export function useToggleHabit(habitLog, setHabitLog, day) {
  return (id) => {
    setHabitLog((prev) => {
      const cur = prev[day] || [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, [day]: next };
    });
  };
}
