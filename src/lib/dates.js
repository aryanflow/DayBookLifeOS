export const dkey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const lastNDays = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dkey(d));
  }
  return out;
};

export const daysAround = (back, fwd) => {
  const out = [];
  for (let i = -back; i <= fwd; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push(dkey(d));
  }
  return out;
};

export const shortDay = (key) =>
  new Date(key + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });

export const niceDate = (key) =>
  new Date(key + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const monthLabel = (m) =>
  new Date(m + "-15T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });

export const monthShort = (m) =>
  new Date(m + "-15T12:00:00").toLocaleDateString("en-US", { month: "short" });

export const fmtK = (v) =>
  v >= 100000 ? (v / 100000).toFixed(1) + "L" : v >= 1000 ? (v / 1000).toFixed(1) + "k" : v;

export const greeting = (name, isToday, day) => {
  if (!isToday) {
    return `Editing ${new Date(day + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })}`;
  }
  const hour = new Date().getHours();
  const first = name ? `, ${name.split(" ")[0]}` : "";
  if (hour < 12) return `Good morning${first}`;
  if (hour < 17) return `Good afternoon${first}`;
  return `Good evening${first}`;
};
