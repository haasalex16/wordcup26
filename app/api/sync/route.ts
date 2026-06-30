import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // upstream feed is slow (~15-20s) and flaky

const SOURCE = "https://worldcup26.ir/get/games";

// The feed (worldcup26.ir) intermittently 502s / times out. Each cron tick
// retries a few times so one flaky response doesn't skip a whole sync cycle.
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 18_000;

type ApiGame = {
  id: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_score: string;
  away_score: string;
  home_penalty_score?: string; // present only for knockout shootouts
  away_penalty_score?: string;
  group: string;
  matchday: string;
  local_date: string;
  finished: string; // "TRUE" | "FALSE"
  time_elapsed: string; // "notstarted" | "45" | "finished" | ...
  type: string; // group | r32 | r16 | qf | sf | third | final
};

const toInt = (v: string | undefined | null): number | null => {
  if (v === undefined || v === null || v === "null" || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

export async function GET(req: Request) {
  // Optional shared secret so only your cron pinger triggers syncs.
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const provided = new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let games: ApiGame[];
  let lastErr: unknown;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(SOURCE, {
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`source responded ${res.status}`);
      const body = await res.json();
      const parsed = body.games ?? body;
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty payload");
      games = parsed;
      lastErr = undefined;
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < FETCH_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // 1s, then 2s backoff
      }
    }
  }
  if (lastErr !== undefined) {
    return Response.json(
      { error: "score source unavailable", detail: String(lastErr), attempts: FETCH_ATTEMPTS },
      { status: 502 }
    );
  }
  games = games!;

  const rows = games.map((g) => ({
    id: toInt(g.id),
    stage: g.type ?? "group",
    group_name: g.group ?? null,
    matchday: toInt(g.matchday),
    kickoff_text: g.local_date ?? null,
    home_team: g.home_team_name_en || g.home_team_label || null,
    away_team: g.away_team_name_en || g.away_team_label || null,
    home_score: toInt(g.home_score),
    away_score: toInt(g.away_score),
    home_penalty_score: toInt(g.home_penalty_score),
    away_penalty_score: toInt(g.away_penalty_score),
    finished: String(g.finished).toUpperCase() === "TRUE",
    time_elapsed: g.time_elapsed ?? null,
    updated_at: new Date().toISOString(),
  })).filter((r) => r.id !== null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only, never exposed
  );

  const { error } = await supabase.from("matches").upsert(rows, { onConflict: "id" });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ synced: rows.length, at: new Date().toISOString() });
}
