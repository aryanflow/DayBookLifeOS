# Daybook - Life OS

Your private daily Life OS. Habits, money, food, work, and wellness in one place - **local-first**, with **optional encrypted sync** across devices.

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
| **Privacy** | Local-first; sync is encrypted end-to-end | Cloud reads your data |
| **Speed** | Instant open, offline PWA | Login, sync waits |
| **Household** | Multiple profiles on one device | One account per install |
| **Cost** | Free static hosting + free-tier sync worker | Subscriptions |

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

### Encrypted sync (optional)

Settings → **Sync across devices**:

1. **Turn on sync** - get a 24-character sync code (save it somewhere safe)
2. On another phone or laptop, open Daybook → Settings → **Link this device** → paste the same code
3. Changes auto-sync every few seconds when online

- Data is **AES-GCM encrypted** in the browser before upload
- The sync server only stores ciphertext (included Cloudflare Worker + KV)
- **Last-write-wins** across devices - edit on one device at a time for now
- PINs stay hashed locally; sync code is the key to your cloud blob

Without a sync server configured, Daybook stays fully offline (JSON export still works).

## Deploy (frontend)

Static Vite build - deploy `dist/` anywhere.

### Netlify (recommended)

1. Push this repo to GitHub
2. [Netlify](https://app.netlify.com) → **Add new site** → Import the repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. (Optional) **Site settings → Environment variables** → `VITE_SYNC_API_URL` = your Worker URL

`netlify.toml` is already included.

### Vercel

```bash
npm i -g vercel
vercel
```

Framework: **Vite**, output: `dist`. Add `VITE_SYNC_API_URL` in project env if using sync.

### Cloudflare Pages

Build: `npm run build`, output: `dist`, same env var for sync.

## Deploy sync (Cloudflare Worker)

One-time setup (~5 minutes):

```bash
npm run sync:install
cd worker
npx wrangler login
npm run kv:create
```

Copy the KV namespace `id` from the command output into `worker/wrangler.jsonc` (replace `REPLACE_WITH_KV_NAMESPACE_ID`).

```bash
npm run sync:deploy
```

Note the Worker URL (e.g. `https://daybook-sync.your-name.workers.dev`).

Set that URL everywhere you build the frontend:

```bash
cp .env.example .env
# edit VITE_SYNC_API_URL=https://daybook-sync.your-name.workers.dev
npm run build
```

Or set `VITE_SYNC_API_URL` in Netlify/Vercel env vars and redeploy.

Local sync dev:

```bash
# terminal 1
npm run sync:dev

# terminal 2 - .env points at http://127.0.0.1:8787
npm run dev
```

## Version info

Every `npm run build` writes `public/versioninfo.txt` from the latest git commit:

- **https://your-site.netlify.app/versioninfo.txt** — plain text
- **https://your-site.netlify.app/version** — same file, friendly redirect
- **https://your-site.netlify.app/version** (React page) — formatted view

Includes app version, commit hash, commit message, author, and build time.

## Activity logs (admin)

Server-side activity log for logins, spends, meals, habits, sync, etc.

1. Set **`LOGS_ADMIN_KEY`** in Netlify → Site settings → Environment variables (pick a long random string)
2. Open **https://your-site.netlify.app/logs?key=YOUR_KEY** (or enter the key on `/logs`)
3. Filter by user, refresh, or **Remove** a user to delete their logs and block future entries from that name

Local dev: admin key defaults to `dev-admin` (see `.env.example`).

**Honest limits:** logs are metadata only (not full diary content). Removing a user from logs does not delete their local app data or encrypted sync blob on their device.

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
- **Sync code** encrypts your backup - treat it like a password
- If storage is blocked (private mode, quota), the app warns you and falls back to in-memory mode

## Project structure

```
src/
├── components/
│   ├── auth/       Welcome, user select, PIN, continue
│   ├── layout/     Header, nav, settings, toast
│   ├── ui/         Card, DayPulse, chips
│   └── views/      Today, Habits, Money, Food, Work, Trends
├── hooks/          Store, toast, habits, sync
├── lib/            Storage, dates, auth, export, sync crypto
├── theme/          Design tokens (light + dark)
└── styles/         Global CSS system
worker/             Cloudflare Worker for encrypted sync blobs
public/             Icons, PWA assets
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run sync:install` | Install Worker dependencies |
| `npm run sync:dev` | Run sync API locally |
| `npm run sync:deploy` | Deploy sync Worker to Cloudflare |
| `node scripts/generate-icons.mjs` | Rasterize Pure Dot SVG to PNG |

## Tech stack

- React 18 + Vite 6
- PWA via vite-plugin-pwa
- Optional sync: Cloudflare Workers + KV, client-side Web Crypto

## License

MIT
