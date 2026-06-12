# World Cup 2026 Fantasy League

A public, zero-auth fantasy league site for the team-draft format: friends own countries, countries earn points from real results, and the leaderboard updates live during matches.

**Stack (all free tiers):** Next.js on Vercel · Supabase (Postgres + Realtime) · cron-job.org · scores from the open worldcup26.ir API.

## How it works

```
cron-job.org (every 2 min) ──▶ /api/sync ──▶ worldcup26.ir/get/games
                                   │
                                   ▼ upsert
                            Supabase `matches`
                                   │ Realtime push (+60s poll fallback)
                                   ▼
                       Leaderboard in everyone's browser
```

Fantasy points are computed **client-side** from raw match data, so changing scoring rules or rosters never requires touching the database — edit `lib/config.ts` and redeploy.

## Setup (~15 minutes)

### 1. Supabase
1. Create a free project at supabase.com.
2. SQL Editor → paste and run `supabase/schema.sql`.
3. Project Settings → API: copy the **URL**, **anon key**, and **service_role key**.

### 2. Configure your league
Edit `lib/config.ts`:
- `LEAGUE_NAME` — whatever you call it
- `ROSTERS` — each friend and their drafted countries
- `SCORING` — tweak point values if your league disagrees

Team names must match the score feed exactly. After your first sync, open `/api/teams` on the deployed site to see the exact spellings (playoff placeholder slots resolve to real countries in the live feed).

### 3. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → New Project → import the repo (defaults are fine).
3. Add environment variables (copy names from `.env.example`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SYNC_SECRET`.
4. Deploy. Your site is live at `https://your-app.vercel.app` — share that link.

### 4. Schedule the score sync
Vercel's free plan only allows daily crons, so use cron-job.org (free):
1. Create a job pointing at `https://your-app.vercel.app/api/sync?secret=YOUR_SYNC_SECRET`.
2. Schedule it every 1–2 minutes. Matches run roughly 12:00–23:00 ET daily through July 19; restrict the job to those hours if you want to be tidy.
3. Hit the URL once yourself right away to load the schedule.

## Scoring (defaults)

| Event | Points |
|---|---|
| Goal scored (any stage) | 1 |
| Group-stage win / draw | 3 / 1 |
| Clean sheet | 1 |
| Knockout win: R32 → R16 → QF → SF | 4 → 6 → 8 → 10 |
| Third-place playoff win | 4 |
| Winning the final | 15 |

Goals count live as they happen; result-based points land at full time.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

## Notes & caveats

- The score source is a free community project — solid, but uptime isn't guaranteed. `/api/sync` fails loudly (502) if it's down; nothing breaks, scores just pause. If it dies mid-tournament, the sync route is the only file to swap for another provider (football-data.org is the natural fallback).
- Fully public means anyone with the link sees everything; rosters live in code, so nobody can tamper with picks without a deploy. That's the honor system working in your favor.
- Knockout draws: the feed reports the deciding score, so the winner check covers extra time/penalty outcomes.


SB
Mw5gsC8mP8ueXyp5