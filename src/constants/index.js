export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
];

export const DEFAULT_CURRENCY = "INR";

export function currencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || "₹";
}


export const TABS = [
  { id: "today", label: "Today" },
  { id: "habits", label: "Habits" },
  { id: "money", label: "Money" },
  { id: "food", label: "Food" },
  { id: "work", label: "Work" },
  { id: "trends", label: "Trends" },
];

export const MOODS = [
  { id: "great", emoji: "😄" },
  { id: "good", emoji: "🙂" },
  { id: "meh", emoji: "😐" },
  { id: "low", emoji: "😞" },
  { id: "rough", emoji: "😫" },
];

export const MOOD_EMOJI = {
  great: "😄",
  good: "🙂",
  meh: "😐",
  low: "😞",
  rough: "😫",
};

export const SPEND_CATS = [
  { id: "food", label: "Food", emoji: "🍜" },
  { id: "travel", label: "Travel", emoji: "🚕" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "bills", label: "Bills", emoji: "🧾" },
  { id: "fun", label: "Fun", emoji: "🎬" },
  { id: "other", label: "Other", emoji: "📦" },
];

export const MEAL_QUALITY = [
  { id: "healthy", label: "Healthy", emoji: "🥦", score: 2 },
  { id: "okay", label: "Okay", emoji: "🍚", score: 1 },
  { id: "junk", label: "Junk", emoji: "🍟", score: 0 },
];

export const DEFAULT_HABITS = [
  { id: "h1", name: "Wake up early", emoji: "🌅" },
  { id: "h2", name: "Exercise / walk", emoji: "🏃" },
  { id: "h3", name: "Read 20 min", emoji: "📚" },
  { id: "h4", name: "No junk food", emoji: "🥗" },
];

export const STORAGE_KEY = "db_app";

export const LEGACY_KEYS = [
  "db_profile",
  "db_habits",
  "db_habitLog",
  "db_meals",
  "db_spends",
  "db_budget",
  "db_dark",
  "db_water",
  "db_sleep",
  "db_notes",
  "db_work",
];

export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 30000;
