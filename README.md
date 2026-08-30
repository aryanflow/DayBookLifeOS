# Daybook - Life OS

Your private daily Life OS. Habits, money, food, work, and wellness in one place - **everything stays on your device**.

![Daybook icon](public/favicon.svg)

## Try it in 30 seconds

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and tap **Login as Test - sample data** to explore a fully populated demo profile.

## Why Daybook?

| | Daybook | Typical tracker apps |
|---|---------|---------------------|
| **Privacy** | No account, no server, no upload | Cloud required |
| **Speed** | Instant open, offline PWA | Login, sync waits |
| **Household** | Multiple profiles on one device | One account per install |
| **Cost** | Free to host (static site) | Subscriptions |

## Features

| Tab | Job (5 words) |
|-----|----------------|
| **Today** | Log your whole day fast |
| **Habits** | Track streaks and consistency |
| **Money** | Budget, charts, spending history |
| **Food** | Meal quality and eating score |
| **Work** | Tasks and searchable notes |
| **Trends** | See patterns unlock over time |

### Multi-user

- Each person gets their own habits, spending, meals, and notes
- Optional **4-digit PIN** per profile (device-only - not cloud auth)
- **Switch person** from the lock icon without deleting anyone's data
- **Backup my profile** or **Backup everyone** as JSON

### Design principles

Daybook is built local-first with explicit product rules (see `.cursor/rules/world-class-product-engineering.mdc`):

- Empty states invite action, never dead-end
- Destructive actions use **Undo** toasts, not confirmation dialogs (including erase-all on orphaned data)
- Charts look intentional at zero data
- Honest copy - no fake cloud sync promises

### Brand identity

**Pure Dot** - the amber period from **Daybook.** is the app icon: ink tile `#1A1528` + money accent dot `#B8760A`, optically centered. Headers use mark + wordmark; favicons use mark only. Alternate concepts live in `public/logo-concepts/`.

## Data & privacy

All data lives in your browser under the `db_app` localStorage key:

```json
{
  "version": 2,
  "users": [...],
  "activeUserId": "...",
  "userData": { "...": { habits, spends, meals, ... } }
}
```

- **Export** JSON or CSV from Settings before switching devices or clearing site data
- **PINs** are stored as hashes, never plain text
- If storage is blocked (private mode, quota), the app warns you and falls back to in-memory mode

## Deploy for free

Static Vite build - deploy `dist/` anywhere.

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Framework preset: **Vite**, output: `dist`

### Netlify

Build: `npm run build`, publish: `dist`

### Cloudflare Pages

Build: `npm run build`, output: `dist`

## Project structure

```
src/
├── components/
│   ├── auth/       Welcome, user select, PIN, continue
│   ├── layout/     Header, nav, settings, toast
│   ├── ui/         Card, DayPulse, chips
│   └── views/      Today, Habits, Money, Food, Work, Trends
├── hooks/          Store, toast, habits
├── lib/            Storage, dates, auth, export, demo seed
├── theme/          Design tokens (light + dark)
└── styles/         Global CSS system
public/
├── favicon.svg              Pure Dot mark (SVG, any size)
├── favicon-48.png           PNG fallback for older browsers
├── apple-touch-icon.png     iOS home screen (180px)
├── icon-512.png             PWA / OG image
├── icon-192.svg / icon-512.svg / icon-maskable.svg
└── logo-concepts/           Alternate marks (reference only)
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `node scripts/screenshot-audit.mjs` | Capture UI screenshots (needs Playwright) |
| `node scripts/generate-icons.mjs` | Rasterize Pure Dot SVG to PNG (needs Playwright) |

## Tech stack

- React 18 + Vite 6
- PWA via vite-plugin-pwa
- Zero backend - local-first by design

Real multi-device sync would need a backend (auth, conflict resolution, ops). Daybook intentionally ships the local version first.

## License

MIT
