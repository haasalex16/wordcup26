// ============================================================
// BC BOYS — third league. 4-player group draft.
// ============================================================
//
// Format: 4 players, and in EVERY group of 4 each player owns one team.
// All 48 teams are spoken for, so every group is a head-to-head duel
// between the four league members.
//
// Scoring is identical to the main World Cup 2026 league (win 3, tie 1,
// goal 1, clean sheet 1, group-finish bonus 2/1) — see lib/scoring.ts,
// reused via computeLeaderboard(matches, BC_BOYS_ROSTERS).
//
// Rosters are the real draft (a 12-round snake draft — round number is
// NOT the group). Team names are normalised to the feed spelling; group
// membership for the battle view is derived from the live match data, so
// nothing here hardcodes which group a team is in.

import type { Match, PlayerLine } from "./scoring";

export const BC_BOYS_LEAGUE_NAME = "BC Boys";

export const BC_BOYS_ROSTERS: Record<string, string[]> = {
  Michael: ["Spain", "Netherlands", "Mexico", "United States", "Canada", "Ivory Coast", "Algeria", "New Zealand", "Democratic Republic of the Congo", "Haiti", "Ghana", "Iraq"],
  Matt: ["Argentina", "Germany", "Switzerland", "Morocco", "Japan", "Senegal", "South Korea", "Panama", "Cape Verde", "Paraguay", "Uzbekistan", "Iran"],
  Nate: ["France", "Portugal", "Belgium", "Croatia", "Bosnia and Herzegovina", "Ecuador", "Scotland", "Australia", "Sweden", "Jordan", "South Africa", "Saudi Arabia"],
  Tyler: ["England", "Brazil", "Colombia", "Norway", "Uruguay", "Turkey", "Austria", "Egypt", "Czech Republic", "Tunisia", "Qatar", "Curaçao"],
};

// A signature colour per player, reused on the leaderboard and in every
// group card so you can track each owner at a glance.
export const BC_BOYS_PLAYER_COLORS: Record<string, string> = {
  Michael: "#e3b341", // gold
  Matt: "#5aa9e6", // sky
  Nate: "#ff7a59", // coral
  Tyler: "#b48ef0", // lilac
};

// team → owning player, for quick reverse lookups in the group view.
export const BC_BOYS_OWNER: Record<string, string> = Object.fromEntries(
  Object.entries(BC_BOYS_ROSTERS).flatMap(([player, teams]) => teams.map((t) => [t, player]))
);

export type GroupRow = { team: string; owner: string; points: number; live: boolean; played: number };
export type GroupBattle = { group: string; rows: GroupRow[]; leaders: string[] };

/** group_name → its teams, read straight from the group-stage fixtures. */
function groupsFromMatches(matches: Match[]): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {};
  for (const m of matches) {
    if (m.stage !== "group" || !m.group_name) continue;
    (groups[m.group_name] ??= new Set());
    if (m.home_team) groups[m.group_name].add(m.home_team);
    if (m.away_team) groups[m.group_name].add(m.away_team);
  }
  return Object.fromEntries(
    Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, teams]) => [name, [...teams]])
  );
}

/** Per-group standings: each group's teams (from the live fixtures)
 *  ranked by points, with the leading owner(s) flagged. `leaders` holds
 *  every player tied for the group lead (so a 0-0 start crowns nobody —
 *  only a positive, strict-or-tied top counts). */
export function computeGroupBattles(board: PlayerLine[], matches: Match[]): GroupBattle[] {
  const stat = new Map<string, { points: number; live: boolean; played: number }>();
  for (const p of board) for (const t of p.teams) stat.set(t.team, t);

  return Object.entries(groupsFromMatches(matches)).map(([group, teams]) => {
    const rows: GroupRow[] = teams.map((team) => {
      const s = stat.get(team);
      return {
        team,
        owner: BC_BOYS_OWNER[team] ?? "—",
        points: s?.points ?? 0,
        live: s?.live ?? false,
        played: s?.played ?? 0,
      };
    });
    rows.sort((a, b) => b.points - a.points);
    const top = rows[0]?.points ?? 0;
    const leaders = top > 0 ? rows.filter((r) => r.points === top).map((r) => r.owner) : [];
    return { group, rows, leaders };
  });
}
