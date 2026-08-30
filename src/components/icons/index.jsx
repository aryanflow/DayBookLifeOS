export const Icon = ({ d, size = 20, strokeWidth = 2, extra = null }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    {extra}
  </svg>
);

export const Sun = (p) => (
  <Icon
    {...p}
    d={[
      "M12 2v2",
      "M12 20v2",
      "M4.93 4.93l1.41 1.41",
      "M17.66 17.66l1.41 1.41",
      "M2 12h2",
      "M20 12h2",
      "M6.34 17.66l-1.41 1.41",
      "M19.07 4.93l-1.41 1.41",
    ]}
    extra={<circle cx="12" cy="12" r="4" />}
  />
);
export const Flame = (p) => (
  <Icon
    {...p}
    d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 1.072-1.222 2.5-2 3.5-4 .786 2.367.5 4.5 0 6 .5-.5 1.5-1 2-2.5.667 1.667 1 3.4 1 5a5.5 5.5 0 1 1-11 0c0-1.7.7-3.2 1.5-4.5.5 1.5 1 2.5 1.5 5.5z"
  />
);
export const Wallet = (p) => (
  <Icon {...p} d={["M21 12V7H5a2 2 0 0 1 0-4h14v4", "M3 5v14a2 2 0 0 0 2 2h16v-5", "M18 12a2 2 0 0 0 0 4h4v-4Z"]} />
);
export const Utensils = (p) => (
  <Icon
    {...p}
    d={[
      "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2",
      "M7 2v20",
      "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
    ]}
  />
);
export const TrendingUp = (p) => <Icon {...p} d={["M22 7l-8.5 8.5-5-5L2 17", "M16 7h6v6"]} />;
export const Check = (p) => <Icon {...p} d="M20 6L9 17l-5-5" />;
export const Plus = (p) => <Icon {...p} d={["M5 12h14", "M12 5v14"]} />;
export const X = (p) => <Icon {...p} d={["M18 6L6 18", "M6 6l12 12"]} />;
export const Trash2 = (p) => (
  <Icon
    {...p}
    d={[
      "M3 6h18",
      "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
      "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      "M10 11v6",
      "M14 11v6",
    ]}
  />
);
export const Download = (p) => (
  <Icon {...p} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]} />
);
export const Upload = (p) => (
  <Icon {...p} d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]} />
);
export const Moon = (p) => <Icon {...p} d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />;
export const Lock = (p) => (
  <Icon {...p} d={["M7 11V7a5 5 0 0 1 10 0v4"]} extra={<rect x="3" y="11" width="18" height="11" rx="2" />} />
);
export const Backspace = (p) => (
  <Icon {...p} d={["M21 5H9l-7 7 7 7h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z", "M18 9l-6 6", "M12 9l6 6"]} />
);
export const Briefcase = (p) => (
  <Icon
    {...p}
    d={["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"]}
    extra={<rect x="2" y="6" width="20" height="14" rx="2" />}
  />
);
export const Gear = (p) => (
  <Icon
    {...p}
    d={[
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
    ]}
    extra={<circle cx="12" cy="12" r="3" />}
  />
);
export const Zap = (p) => <Icon {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
export const LogOut = (p) => (
  <Icon {...p} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />
);

const TAB_ICONS = {
  today: Sun,
  habits: Flame,
  money: Wallet,
  food: Utensils,
  work: Briefcase,
  trends: TrendingUp,
};

export function TabIcon({ id, ...props }) {
  const Cmp = TAB_ICONS[id] || Sun;
  return <Cmp {...props} />;
}
