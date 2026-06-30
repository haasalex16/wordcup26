// ============================================================
// LEAGUE CONFIG — this is the only file you need to edit.
// ============================================================
//
// All team names verified against the live feed (June 12 2026).
// Scoring: 3 per win, 1 per tie, 1 per goal, 1 per shutout — every
// stage, no knockout escalation. Plus group-finish bonus: 2 for
// finishing 1st in the group, 1 for 2nd (awarded once the group's
// matches are all finished). Knockout games never pay a tie: a level
// score is decided by the shootout, and the shootout winner earns one
// extra goal point on top of the win (see wonShootout in lib/scoring.ts).

export const LEAGUE_NAME = "World Cup 2026";

export const ROSTERS: Record<string, string[]> = {
  Murphy: ["Mexico", "Czech Republic", "Germany", "Jordan"],
  Goose: ["South Africa", "Brazil", "Algeria", "Croatia"],
  Scott: ["South Korea", "Haiti", "Sweden", "France"],
  Haas: ["Canada", "Iraq", "Portugal", "Ghana"],
  Eric: ["Bosnia and Herzegovina", "United States", "Uruguay", "Democratic Republic of the Congo"],
  Spencer: ["Qatar", "Australia", "Japan", "Argentina"],
  Brent: ["Switzerland", "Belgium", "Iran", "Uzbekistan"],
  Dan: ["Morocco", "Tunisia", "Colombia", "Panama"],
  Aaron: ["Scotland", "Turkey", "New Zealand", "Norway"],
  Tommy: ["Paraguay", "Netherlands", "Saudi Arabia", "Senegal"],
  Jason: ["Curaçao", "Egypt", "Spain", "Austria"],
  Tyler: ["Ivory Coast", "Ecuador", "Cape Verde", "England"],
};

// Points awarded to a drafted team, per match.
export const SCORING = {
  goal: 1, // each goal scored
  groupWin: 3,
  groupDraw: 1,
  cleanSheet: 1, // finished match, conceded zero
  // Bonus for final group position (awarded once the group is complete):
  groupFirst: 2,
  groupSecond: 1,
  // Knockout wins are worth the same 3 as any other win:
  knockoutWin: {
    r32: 3,
    r16: 3,
    qf: 3,
    sf: 3,
    third: 3,
    final: 3,
  } as Record<string, number>,
};
