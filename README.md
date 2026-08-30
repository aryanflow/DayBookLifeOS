# Daybook Life OS

A private daily Life OS for habits, money, food, work, and wellness. Data stays on your device by default; optional encrypted sync keeps profiles aligned across browsers.

**Live app:** [daybookzero.netlify.app](https://daybookzero.netlify.app/)

![Today view](public/screenshots/desktop-today.png)

## Quick start

```bash
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173) and choose **Login as Test - sample data** to explore a populated demo profile.

## What you get

| Area | What it does |
|------|----------------|
| **Today** | Log mood, sleep, water, and quick notes for the day |
| **Habits** | Track streaks and daily completion |
| **Money** | Budget, spending history, and charts |
| **Food** | Meal quality and eating score |
| **Work** | Tasks and searchable notes |
| **Trends** | Patterns that unlock as you log more days |

### Profiles and PIN

- Multiple people can share one device, each with separate data
- Optional 4-digit PIN per profile for unlock and `/logs` access
- Switch profiles from the lock icon without deleting anyone's history
- Export one profile or everyone as JSON from Settings

### Encrypted sync

Settings → **Sync across devices**:

1. Turn on sync and save the 24-character sync code
2. On another device, link with the same code
3. Changes sync automatically when online

Data is AES-GCM encrypted in the browser before upload. Netlify Blobs store the ciphertext via `/.netlify/functions/sync`. Conflicts use last-write-wins.

## Deploy on Netlify

1. Push this repo to GitHub
2. [Netlify](https://app.netlify.com) → **Add new site** → import the repo
3. Build command: `npm run build` · Publish directory: `dist`
4. Add environment variable `LOGS_ADMIN_KEY` (long random secret for `/admin`)
5. Redeploy after adding env vars

`netlify.toml` wires up sync, logs, and admin functions.

### Routes

| URL | Access | Purpose |
|-----|--------|---------|
| `/` | Everyone | Main app |
| `/logs` | Profile name + PIN | Your activity log |
| `/admin?key=…` | Admin key | User registry, PINs, delete users |
| `/version` | Everyone | Build info (formatted page) |
| `/versioninfo.txt` | Everyone | Same info as plain text |

## Activity logs

**Users** open `/logs`, enter profile name and PIN, and see their own events (spends, habits, sync, errors).

**Admins** open `/admin` with `LOGS_ADMIN_KEY` to view all users, see PINs, and delete a user (logs, registry, and sync blob). The profile clears locally when that person next opens the app.

Local dev uses `dev-admin` as the default admin key.

Logs store metadata only, not full diary text.

## Data and privacy

Everything lives in browser `localStorage` under `db_app`. Export JSON or CSV from Settings anytime.

- PINs are hashed locally for unlock; plaintext PIN is stored in the admin registry only when set or changed (household recovery)
- Treat your sync code like a password
- Destructive deletes offer a 5-second undo toast

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with local API mocks |
| `npm run build` | Production build (generates version info first) |
| `npm run preview` | Preview the production build |

## Stack

React 18 · Vite 6 · PWA · Netlify Functions and Blobs

An optional Cloudflare Worker sync backend lives in `worker/` if you prefer KV over Netlify.

## License

MIT
