import { ROSTERS, SCORING } from "./config";

export type Match = {
  id: number;
  stage: string; // group | r32 | r16 | qf | sf | third | final
  group_name: string | null;
  matchday: number | null;
  kickoff_text: string | null;
  home_team: string | null;
  away_team: string | null;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
  time_elapsed: string | null;
  updated_at: string;
};

export const isLive = (m: Match) =>
  !m.finished &&
  m.time_elapsed !== null &&
  m.time_elapsed !== "notstarted" &&
  m.home_score !== null;

export const hasStarted = (m: Match) => m.finished || isLive(m);

export type Side = { team: string; gf: number; ga: number };

export function sides(m: Match): Side[] {
  if (!m.home_team || !m.away_team || m.home_score === null || m.away_score === null) return [];
  return [
    { team: m.home_team, gf: m.home_score, ga: m.away_score },
    { team: m.away_team, gf: m.away_score, ga: m.home_score },
  ];
}

/** Points one team earned from one match. Live matches count goals
 *  provisionally; win/draw/clean-sheet points only once finished.
 *  Group-finish bonuses are handled separately (see groupBonuses). */
export function teamMatchPoints(m: Match, team: string): number {
  const side = sides(m).find((s) => s.team === team);
  if (!side || !hasStarted(m)) return 0;

  let pts = side.gf * SCORING.goal;

  if (m.finished) {
    const won = side.gf > side.ga;
    const drew = side.gf === side.ga;
    if (m.stage === "group") {
      if (won) pts += SCORING.groupWin;
      else if (drew) pts += SCORING.groupDraw;
    } else if (won) {
      pts += SCORING.knockoutWin[m.stage] ?? 0;
    }
    // Note: knockout draws resolve by pens/extra time; the data source
    // reports the final score, so the winner check above still applies.
    if (side.ga === 0) pts += SCORING.cleanSheet;
  }
  return pts;
}

/** Bonus points per team for their final group position: 2 for 1st,
 *  1 for 2nd. Only awarded once every match in that group is finished,
 *  since standings (and tiebreakers) can still shift while games remain. */
export function groupBonuses(matches: Match[]): Map<string, number> {
  const bonus = new Map<string, number>();
  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    if (m.stage !== "group" || !m.group_name) continue;
    (groups.get(m.group_name) ?? groups.set(m.group_name, []).get(m.group_name)!).push(m);
  }

  for (const [, ms] of groups) {
    if (!ms.every((m) => m.finished)) continue; // group not yet decided

    type Standing = { team: string; pts: number; gd: number; gf: number };
    const table = new Map<string, Standing>();
    const row = (team: string) =>
      table.get(team) ?? table.set(team, { team, pts: 0, gd: 0, gf: 0 }).get(team)!;

    for (const m of ms) {
      for (const s of sides(m)) {
        const r = row(s.team);
        r.gf += s.gf;
        r.gd += s.gf - s.ga;
        if (s.gf > s.ga) r.pts += 3;
        else if (s.gf === s.ga) r.pts += 1;
      }
    }

    const ranked = [...table.values()].sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    );
    if (ranked[0]) bonus.set(ranked[0].team, SCORING.groupFirst);
    if (ranked[1]) bonus.set(ranked[1].team, SCORING.groupSecond);
  }

  return bonus;
}

export type TeamLine = { team: string; points: number; played: number; live: boolean };
export type PlayerLine = { player: string; points: number; teams: TeamLine[] };

export function computeLeaderboard(
  matches: Match[],
  rosters: Record<string, string[]> = ROSTERS
): PlayerLine[] {
  const byTeam = new Map<string, TeamLine>();
  const allTeams = new Set(Object.values(rosters).flat());

  for (const team of allTeams) byTeam.set(team, { team, points: 0, played: 0, live: false });

  for (const m of matches) {
    for (const s of sides(m)) {
      const line = byTeam.get(s.team);
      if (!line) continue;
      line.points += teamMatchPoints(m, s.team);
      if (m.finished) line.played += 1;
      if (isLive(m)) line.live = true;
    }
  }

  for (const [team, pts] of groupBonuses(matches)) {
    const line = byTeam.get(team);
    if (line) line.points += pts;
  }

  return Object.entries(rosters)
    .map(([player, teams]) => {
      const lines = teams.map((t) => byTeam.get(t)!).filter(Boolean);
      return {
        player,
        points: lines.reduce((sum, l) => sum + l.points, 0),
        teams: lines.sort((a, b) => b.points - a.points),
      };
    })
    .sort((a, b) => b.points - a.points);
}
