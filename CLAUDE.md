# World Cup 2026 Fantasy League

Public (zero-auth) fantasy site. Friends own drafted countries; countries earn points from real match results. Three independent leagues share the same `matches` data:
- **World Cup 2026** (`/`, the original) — 12 players, 4 teams each.
- **El Idiots** (`/el-idiots`) — 11 players, 8 teams each, simpler scoring (win/tie/loss only).
- **BC Boys** (`/bc-boys`) — 4 players (Michael, Matt, Nate, Tyler), each owns 1 team per group (12 teams). Same scoring as the main league, plus a group-battle UI since every group is a 4-way duel. Group membership for that UI is derived from the live fixtures, not hardcoded.

The pages don't link to each other; each league's URL is shared directly.

## Architecture

- **Next.js 14 (app router) on Vercel.** Frontend + two API routes.
- **Supabase**: single `matches` table (104 rows, one per match). RLS: anon key is read-only; writes only via service-role key server-side.
- **Score source**: `https://worldcup26.ir/get/games` (free community API; all fields are strings — see parsing in `app/api/sync/route.ts`).
- **Sync**: cron-job.org hits `/api/sync?secret=...` every 1–2 min during match hours → upserts all matches.
- **Live updates**: Supabase Realtime subscription on `matches`, plus 60s polling fallback (`app/page.tsx`).
- **Fantasy points are computed client-side** (`lib/scoring.ts`) from raw matches + `lib/config.ts`. The DB never stores points — rule/roster changes are config edits + redeploy only.

## Key files

- `lib/config.ts` — World Cup 2026 rosters + scoring values. The only file that changes routinely. Team names MUST exactly match feed names (verify via `/api/teams`).
- `lib/scoring.ts` — pure scoring functions for the main league. Knockout draws never award tie points (feed reports the deciding score). Exports `sides`/`isLive`/`hasStarted`, reused by El Idiots.
- `lib/elIdiots.ts` — El Idiots config + scoring, self-contained. Rosters use feed-spelled names (normalised from the draft sheet). Win 3 / tie 1 / loss 0 flat; shootout win = 3; no goal/clean-sheet/group bonuses; ranking ties broken by goals for, then goals against.
- `lib/bcBoys.ts` — BC Boys config: real draft in `BC_BOYS_ROSTERS` (feed-spelled names). Reuses `computeLeaderboard(matches, BC_BOYS_ROSTERS)`; `computeGroupBattles(board, matches)` derives groups from the fixtures, `computeGroupsLed` tallies the per-group duels.
- `app/api/sync/route.ts` — feed fetch + upsert. If the feed dies, this is the only file to swap for another provider (football-data.org is the fallback).

## Scoring rules (current)

Win 3, tie 1, goal 1, shutout 1 — flat across all stages. Goals accrue live; win/tie/shutout land at full time. Group-finish bonus: 2 for finishing 1st in the group, 1 for 2nd — awarded only once every match in that group is finished (standings sort by pts, then goal diff, then goals for). See `groupBonuses` in `lib/scoring.ts`.

## Env vars (Vercel)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `SYNC_SECRET` (optional, gates /api/sync).

## Conventions

- No Tailwind — plain CSS in `app/globals.css` (stadium scoreboard theme: Oswald display / Inter body, pitch green + gold).
- Fonts load via runtime `<link>`, not next/font (build-time font fetch was flaky).
- Tournament ends July 19, 2026 — this is a short-lived project; prefer simple over clever.
