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

type Side = { team: string; gf: number; ga: number };

function sides(m: Match): Side[] {
  if (!m.home_team || !m.away_team || m.home_score === null || m.away_score === null) return [];
  return [
    { team: m.home_team, gf: m.home_score, ga: m.away_score },
    { team: m.away_team, gf: m.away_score, ga: m.home_score },
  ];
}

/** Points one team earned from one match. Live matches count goals
 *  provisionally; win/draw/clean-sheet points only once finished. */
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

export type TeamLine = { team: string; points: number; played: number; live: boolean };
export type PlayerLine = { player: string; points: number; teams: TeamLine[] };

export function computeLeaderboard(matches: Match[]): PlayerLine[] {
  const byTeam = new Map<string, TeamLine>();
  const allTeams = new Set(Object.values(ROSTERS).flat());

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

  return Object.entries(ROSTERS)
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
