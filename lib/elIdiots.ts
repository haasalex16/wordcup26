// ============================================================
// EL IDIOTS — second league. Self-contained config + scoring.
// ============================================================
//
// 11 players, 8 teams each ($32 budget). Scoring is simpler than
// the main league: 3 for a win, 1 for a tie, 0 for a loss. Ties only
// exist in the group stage — knockout games are decided by extra time
// or penalties, so a level score there is settled by the shootout
// (3 to the winner, 0 to the loser, never a tie). No goal, clean-sheet,
// or group-finish bonuses (and no main-league shootout goal bonus).
// Tiebreakers for ranking:
// 1) total goals scored (more is better), 2) goals against (fewer).
//
// Rosters were derived from the draft sheet: a player owns a team if
// their column held that team's price. Team names are normalised to
// the feed spelling (must match — verify via /api/teams).

import { type Match, isLive, hasStarted, sides, sideOutcome } from "./scoring";

export const EL_IDIOTS_NAME = "El Idiots";

export const EI_ROSTERS: Record<string, string[]> = {
  Ryan: ["Spain", "England", "Netherlands", "Senegal", "Ivory Coast", "Paraguay", "Egypt", "Algeria"],
  Bo: ["Argentina", "Uruguay", "Japan", "Ecuador", "Croatia", "Senegal", "Canada", "South Korea"],
  Manny: ["Spain", "Brazil", "Argentina", "Senegal", "Scotland", "Ivory Coast", "Algeria", "South Korea"],
  Moses: ["France", "Portugal", "Netherlands", "Ecuador", "Ivory Coast", "Paraguay", "Ghana", "Algeria"],
  Wyatt: ["Spain", "Portugal", "Argentina", "Mexico", "Czech Republic", "Paraguay", "Egypt", "South Korea"],
  Upton: ["Spain", "Germany", "United States", "Mexico", "Ecuador", "Ivory Coast", "Egypt", "South Korea"],
  Lax: ["Spain", "Germany", "Norway", "Ecuador", "Sweden", "Scotland", "South Korea", "Tunisia"],
  Haas: ["France", "Argentina", "Belgium", "Turkey", "Canada", "Scotland", "Egypt", "South Korea"],
  Pete: ["Netherlands", "Colombia", "United States", "Uruguay", "Mexico", "Czech Republic", "Paraguay", "Australia"],
  Hughey: ["Portugal", "Colombia", "Morocco", "United States", "Mexico", "Scotland", "South Korea", "Bosnia and Herzegovina"],
  Tish: ["France", "Spain", "Turkey", "Croatia", "Canada", "Ivory Coast", "Czech Republic", "Saudi Arabia"],
};

export const EI_SCORING = { win: 3, tie: 1, loss: 0 };

/** Points one team earned from one match: 3 win / 1 tie / 0 loss,
 *  awarded only once the match is finished. Goals never score here.
 *  A knockout level score is settled by the shootout (sideOutcome), so a
 *  tie is only ever returned for a genuine group-stage draw. */
export function eiTeamMatchPoints(m: Match, team: string): number {
  const side = sides(m).find((s) => s.team === team);
  if (!side || !m.finished) return 0;
  const outcome = sideOutcome(side);
  if (outcome === "win") return EI_SCORING.win;
  if (outcome === "draw") return EI_SCORING.tie;
  return EI_SCORING.loss;
}

export type EiTeamLine = {
  team: string;
  points: number;
  gf: number;
  ga: number;
  played: number;
  live: boolean;
};
export type EiPlayerLine = {
  player: string;
  points: number;
  gf: number;
  ga: number;
  teams: EiTeamLine[];
};

export function computeEiLeaderboard(matches: Match[]): EiPlayerLine[] {
  const byTeam = new Map<string, EiTeamLine>();
  const allTeams = new Set(Object.values(EI_ROSTERS).flat());

  for (const team of allTeams)
    byTeam.set(team, { team, points: 0, gf: 0, ga: 0, played: 0, live: false });

  for (const m of matches) {
    for (const s of sides(m)) {
      const line = byTeam.get(s.team);
      if (!line || !hasStarted(m)) continue;
      // Goals count as soon as a match is in play (tiebreaker stats);
      // win/tie/loss points only land at full time.
      line.gf += s.gf;
      line.ga += s.ga;
      line.points += eiTeamMatchPoints(m, s.team);
      if (m.finished) line.played += 1;
      if (isLive(m)) line.live = true;
    }
  }

  return Object.entries(EI_ROSTERS)
    .map(([player, teams]) => {
      const lines = teams.map((t) => byTeam.get(t)!).filter(Boolean);
      return {
        player,
        points: lines.reduce((sum, l) => sum + l.points, 0),
        gf: lines.reduce((sum, l) => sum + l.gf, 0),
        ga: lines.reduce((sum, l) => sum + l.ga, 0),
        // Within a squad, sort by points, then goals for, then goals against.
        teams: lines.sort((a, b) => b.points - a.points || b.gf - a.gf || a.ga - b.ga),
      };
    })
    // Rank: points, then total goals for (desc), then goals against (asc).
    .sort((a, b) => b.points - a.points || b.gf - a.gf || a.ga - b.ga);
}
