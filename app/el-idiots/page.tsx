"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { flag } from "@/lib/flags";
import { isLive, syncAgeLabel, type Match } from "@/lib/scoring";
import { EL_IDIOTS_NAME, computeEiLeaderboard, eiTeamMatchPoints } from "@/lib/elIdiots";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STAGE_LABEL: Record<string, string> = {
  group: "Group", r32: "Round of 32", r16: "Round of 16",
  qf: "Quarterfinal", sf: "Semifinal", third: "3rd Place", final: "Final",
};

export default function ElIdiots() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("matches").select("*").order("id");
      if (data) setMatches(data as Match[]);
      setLoaded(true);
    };
    load();

    // Live updates: push via Supabase Realtime...
    const channel = supabase
      .channel("matches-live-ei")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .subscribe();

    // ...with a 60s polling fallback.
    const poll = setInterval(load, 60_000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  const leaderboard = useMemo(() => computeEiLeaderboard(matches), [matches]);
  const syncLabel = syncAgeLabel(matches);
  const live = matches.filter(isLive);
  const finished = matches.filter((m) => m.finished).sort((a, b) => b.id - a.id).slice(0, 8);
  const anyLive = live.length > 0;

  return (
    <main>
      <header className="masthead">
        <p className="eyebrow">World Cup 2026 Salary Cap</p>
        <h1>{EL_IDIOTS_NAME}</h1>
        {anyLive && <p className="live-flag"><span className="dot" /> Matches in play — scores update live</p>}
      </header>

      {!loaded ? (
        <p className="empty">Loading the board…</p>
      ) : matches.length === 0 ? (
        <p className="empty">
          No match data yet. Hit <code>/api/sync</code> once to pull the schedule.
        </p>
      ) : (
        <>
          <section aria-label="Standings">
            <ol className="board">
              {leaderboard.map((p, i) => (
                <li key={p.player} className={i === 0 ? "leader" : undefined}>
                  <details>
                    <summary>
                      <span className="rank">{i + 1}</span>
                      <span className="name">{p.player}</span>
                      <span className="flags" aria-hidden="true">
                        {p.teams.map((t) => (
                          <span key={t.team} title={t.team}>{flag(t.team)}</span>
                        ))}
                      </span>
                      {p.teams.some((t) => t.live) && <span className="dot" title="A drafted team is playing now" />}
                      <span className="gd" title="Goals for / against (tiebreakers)">{p.gf}:{p.ga}</span>
                      <span className="pts">{p.points}</span>
                    </summary>
                    <ul className="squad">
                      {p.teams.map((t) => (
                        <li key={t.team}>
                          <span><span className="flag" aria-hidden="true">{flag(t.team)}</span> {t.team}</span>
                          <span className="meta">
                            {t.played} played · {t.gf}:{t.ga}{t.live ? " · live" : ""}
                          </span>
                          <span className="pts small">{t.points}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ol>
          </section>

          {live.length > 0 && (
            <section aria-label="Live matches">
              <h2>On now</h2>
              {live.map((m) => <MatchRow key={m.id} m={m} />)}
            </section>
          )}

          <section aria-label="Recent results">
            <h2>Latest results</h2>
            {finished.length === 0
              ? <p className="empty">No finished matches yet.</p>
              : finished.map((m) => <MatchRow key={m.id} m={m} />)}
          </section>
        </>
      )}

      <footer>
        {syncLabel && <><span className="sync-age">{syncLabel}</span> · </>}
        Scores via worldcup26.ir · win 3 · tie 1 · loss 0 — all stages · ties broken by goals for, then against
      </footer>
    </main>
  );
}

function MatchRow({ m }: { m: Match }) {
  const ownedPts = (team: string | null) => {
    if (!team) return null;
    const pts = eiTeamMatchPoints(m, team);
    return pts > 0 ? <em className="gain">+{pts}</em> : null;
  };
  return (
    <div className={`match ${isLive(m) ? "is-live" : ""}`}>
      <span className="stage">
        {STAGE_LABEL[m.stage] ?? m.stage}
        {m.stage === "group" && m.group_name ? ` ${m.group_name}` : ""}
      </span>
      <span className="team home">{m.home_team ?? "TBD"} {ownedPts(m.home_team)}</span>
      <span className="score">
        {m.home_score ?? "–"}<i>:</i>{m.away_score ?? "–"}
        {isLive(m) && <b>{m.time_elapsed}&prime;</b>}
      </span>
      <span className="team away">{ownedPts(m.away_team)} {m.away_team ?? "TBD"}</span>
    </div>
  );
}
