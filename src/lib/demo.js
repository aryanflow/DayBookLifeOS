import { DEFAULT_HABITS, DEFAULT_CURRENCY, MOODS } from "../constants";
import { dkey, lastNDays } from "./dates";
import { normalizeUserName } from "./users";

export const DEMO_USER_NAME = "Test";

const HABIT_IDS = DEFAULT_HABITS.map((h) => h.id);
const SPEND_SAMPLES = [
  { cat: "food", note: "Lunch at cafe", amount: 220 },
  { cat: "food", note: "Groceries", amount: 450 },
  { cat: "travel", note: "Metro pass", amount: 80 },
  { cat: "travel", note: "Cab home", amount: 160 },
  { cat: "shopping", note: "House supplies", amount: 380 },
  { cat: "bills", note: "Phone bill", amount: 399 },
  { cat: "bills", note: "Electricity", amount: 650 },
  { cat: "fun", note: "Movie night", amount: 320 },
  { cat: "fun", note: "Concert tickets", amount: 890 },
  { cat: "other", note: "Gift for friend", amount: 350 },
  { cat: "food", note: "Coffee", amount: 120 },
  { cat: "food", note: "Dinner out", amount: 480 },
];

const MEAL_SAMPLES = [
  { name: "Oats and fruit", quality: "healthy" },
  { name: "Dal rice", quality: "okay" },
  { name: "Grilled chicken salad", quality: "healthy" },
  { name: "Burger and fries", quality: "junk" },
  { name: "Smoothie bowl", quality: "healthy" },
  { name: "Pasta", quality: "okay" },
  { name: "Sushi platter", quality: "healthy" },
  { name: "Street food", quality: "junk" },
];

const NOTE_SAMPLES = [
  "Solid day - got a lot done.",
  "Felt tired but pushed through.",
  "Great workout this morning.",
  "Slow start, better evening.",
  "Productive deep work session.",
  "Needed a rest day.",
  "Caught up with friends.",
  "Focused and calm.",
];

function pick(arr, i) {
  return arr[i % arr.length];
}

export function buildDemoData() {
  const days = lastNDays(35);
  const today = dkey();
  const habitLog = {};
  const spends = [];
  const meals = [];
  const water = {};
  const sleep = {};
  const notes = {};
  let spendId = 1;
  let mealId = 1;

  days.forEach((day, dayIdx) => {
    const isToday = day === today;
    const dow = new Date(day + "T12:00:00").getDay();
    const isWeekend = dow === 0 || dow === 6;
    const completionRate = isWeekend ? 0.45 : 0.72 + (dayIdx % 5) * 0.05;

    const done = HABIT_IDS.filter((_, i) => (dayIdx + i) % 10 < completionRate * 10);
    if (isToday) {
      habitLog[day] = HABIT_IDS.slice(0, 2);
    } else if (done.length) {
      habitLog[day] = done;
    }

    water[day] = isToday ? 5 : 4 + ((dayIdx * 3) % 7);
    sleep[day] = isToday ? 7 : 6 + ((dayIdx * 2) % 5) * 0.5;

    if (dayIdx % 2 === 0 || isToday) {
      const mood = pick(MOODS, dayIdx).id;
      notes[day] = {
        mood,
        text: isToday ? "Sample day with demo data" : pick(NOTE_SAMPLES, dayIdx),
      };
    }

    const spendCount = isToday ? 2 : isWeekend ? 1 : dayIdx % 3 === 0 ? 2 : 1;
    for (let s = 0; s < spendCount; s++) {
      const sample = pick(SPEND_SAMPLES, dayIdx + s);
      const scale = isWeekend ? 0.7 : dayIdx % 5 === 0 ? 1.15 : 0.85;
      spends.push({
        id: spendId++,
        date: day,
        amount: Math.round((sample.amount + (dayIdx % 3) * 30) * scale),
        cat: sample.cat,
        note: sample.note,
      });
    }

    const mealCount = isToday ? 2 : 2 + (dayIdx % 2);
    for (let m = 0; m < mealCount; m++) {
      const sample = pick(MEAL_SAMPLES, dayIdx + m);
      meals.push({
        id: mealId++,
        date: day,
        name: sample.name,
        quality: sample.quality,
      });
    }
  });

  const work = {
    tasks: [
      { id: 1, text: "Finish quarterly report", done: false, priority: "high", createdAt: days[days.length - 5] },
      { id: 2, text: "Reply to client emails", done: true, priority: "medium", createdAt: days[days.length - 3], doneAt: days[days.length - 2] },
      { id: 3, text: "Plan next sprint", done: false, priority: "medium", createdAt: days[days.length - 2] },
      { id: 4, text: "Review design mockups", done: true, priority: "low", createdAt: days[days.length - 7], doneAt: days[days.length - 4] },
      { id: 5, text: "Book dentist appointment", done: false, priority: "low", createdAt: today },
    ],
    notes: [
      { id: 1, text: "Ideas for side project: habit tracker widget", pinned: true, updatedAt: days[days.length - 4] },
      { id: 2, text: "Meeting notes - launch timeline moved to Q4", pinned: false, updatedAt: days[days.length - 6] },
      { id: 3, text: "Books to read: Atomic Habits, Deep Work", pinned: false, updatedAt: days[days.length - 10] },
    ],
  };

  return {
    habits: [...DEFAULT_HABITS],
    habitLog,
    meals,
    spends,
    water,
    sleep,
    notes,
    work,
  };
}

export function createDemoAccount() {
  const startDay = lastNDays(30)[0];
  const user = {
    id: "u_demo_test",
    name: DEMO_USER_NAME,
    pin: null,
    createdAt: startDay,
    currency: DEFAULT_CURRENCY,
    budget: 1000,
    dark: true,
    isDemo: true,
  };
  return { user, data: buildDemoData() };
}

export function findDemoUser(users) {
  const key = DEMO_USER_NAME.toLowerCase();
  return users.find((u) => u.isDemo || normalizeUserName(u.name).toLowerCase() === key) || null;
}
