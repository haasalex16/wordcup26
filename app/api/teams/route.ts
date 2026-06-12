import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Lists every distinct team name currently in the matches table,
// so rosters in lib/config.ts can be spelled exactly right.
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.from("matches").select("home_team, away_team");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const names = new Set<string>();
  for (const row of data ?? []) {
    if (row.home_team) names.add(row.home_team);
    if (row.away_team) names.add(row.away_team);
  }
  return Response.json({ teams: [...names].sort() });
}
