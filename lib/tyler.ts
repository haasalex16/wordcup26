// ============================================================
// TYLER'S LEAGUE — third league. 4-player group draft.
// ============================================================
//
// Format: 4 players, and in EVERY group of 4 each player owns exactly
// one team. So all 48 teams are spoken for and every group is a
// head-to-head duel between the four league members.
//
// Scoring is identical to the main World Cup 2026 league (win 3, tie 1,
// goal 1, clean sheet 1, group-finish bonus 2/1) — see lib/scoring.ts,
// reused via computeLeaderboard(matches, TYLER_ROSTERS).
//
// >>> DUMMY DATA <<< Player names, the group split, and therefore the
// picks are all placeholders until Tyler sends the real draft. Replace
// TYLER_PLAYERS + TYLER_GROUPS below; TYLER_ROSTERS derives from them.

import type { PlayerLine } from "./scoring";

export const TYLER_LEAGUE_NAME = "Group Stage Showdown";

// PLACEHOLDER names — order matters: index 0 takes the 1st team listed
// in each group, index 1 the 2nd, and so on.
export const TYLER_PLAYERS = ["Tyler", "Jordan", "Sam", "Alex"];

// PLACEHOLDER group split (12 groups × 4 teams = all 48 sides). The
// four teams in each group go, in order, to the four players above.
export const TYLER_GROUPS: Record<string, string[]> = {
  A: ["Mexico", "Czech Republic", "Germany", "Jordan"],
  B: ["South Africa", "Brazil", "Algeria", "Croatia"],
  C: ["South Korea", "Haiti", "Sweden", "France"],
  D: ["Canada", "Iraq", "Portugal", "Ghana"],
  E: ["Bosnia and Herzegovina", "United States", "Uruguay", "Democratic Republic of the Congo"],
  F: ["Qatar", "Australia", "Japan", "Argentina"],
  G: ["Switzerland", "Belgium", "Iran", "Uzbekistan"],
  H: ["Morocco", "Tunisia", "Colombia", "Panama"],
  I: ["Scotland", "Turkey", "New Zealand", "Norway"],
  J: ["Paraguay", "Netherlands", "Saudi Arabia", "Senegal"],
  K: ["Curaçao", "Egypt", "Spain", "Austria"],
  L: ["Ivory Coast", "Ecuador", "Cape Verde", "England"],
};

// A signature colour per player, reused on the leaderboard and in every
// group card so you can track each owner at a glance.
export const TYLER_PLAYER_COLORS: Record<string, string> = {
  [TYLER_PLAYERS[0]]: "#e3b341", // gold
  [TYLER_PLAYERS[1]]: "#5aa9e6", // sky
  [TYLER_PLAYERS[2]]: "#ff7a59", // coral
  [TYLER_PLAYERS[3]]: "#b48ef0", // lilac
};

// Each player gets the team at their index from every group → 12 teams.
export const TYLER_ROSTERS: Record<string, string[]> = Object.fromEntries(
  TYLER_PLAYERS.map((player, i) => [player, Object.values(TYLER_GROUPS).map((teams) => teams[i])])
);

// team → owning player, for quick reverse lookups in the group view.
export const TYLER_OWNER: Record<string, string> = Object.fromEntries(
  Object.entries(TYLER_ROSTERS).flatMap(([player, teams]) => teams.map((t) => [t, player]))
);

export type GroupRow = { team: string; owner: string; points: number; live: boolean; played: number };
export type GroupBattle = { group: string; rows: GroupRow[]; leaders: string[] };

/** Turn a computed leaderboard into per-group standings: each group's
 *  four teams ranked by points, with the leading owner(s) flagged.
 *  `leaders` holds every player tied for the group lead (so a 0-0 start
 *  doesn't crown anyone — only a positive, strict-or-tied top counts). */
export function computeGroupBattles(board: PlayerLine[]): GroupBattle[] {
  const stat = new Map<string, { points: number; live: boolean; played: number }>();
  for (const p of board) for (const t of p.teams) stat.set(t.team, t);

  return Object.entries(TYLER_GROUPS).map(([group, teams]) => {
    const rows: GroupRow[] = teams.map((team) => {
      const s = stat.get(team);
      return {
        team,
        owner: TYLER_OWNER[team] ?? "—",
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

/** How many groups each player currently leads (ties count for everyone
 *  tied). Returned sorted, most groups first — the meta-competition. */
export function computeGroupsLed(battles: GroupBattle[]): { player: string; groups: number }[] {
  const led = new Map<string, number>(TYLER_PLAYERS.map((p) => [p, 0]));
  for (const b of battles) for (const leader of b.leaders) led.set(leader, (led.get(leader) ?? 0) + 1);
  return [...led.entries()]
    .map(([player, groups]) => ({ player, groups }))
    .sort((a, b) => b.groups - a.groups);
}
