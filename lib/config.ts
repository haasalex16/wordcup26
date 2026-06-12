// ============================================================
// LEAGUE CONFIG — this is the only file you need to edit.
// ============================================================
//
// Team names must EXACTLY match the API's English team names.
// After deploying, open /api/teams to see the exact current
// names (playoff placeholders like "UEFA Path A Winner" get
// replaced with real countries as the data source updates).

export const LEAGUE_NAME = "The Haastradamus Invitational";

// Who drafted which countries. Edit freely, redeploy to apply.
export const ROSTERS: Record<string, string[]> = {
  Alex: ["Brazil", "England", "Mexico", "Senegal"],
  "Friend 2": ["France", "United States", "Japan", "Egypt"],
  "Friend 3": ["Argentina", "Germany", "Morocco", "Canada"],
  "Friend 4": ["Spain", "Portugal", "Uruguay", "South Korea"],
  "Friend 5": ["Netherlands", "Belgium", "Colombia", "Australia"],
  "Friend 6": ["Croatia", "Switzerland", "Ecuador", "Iran"],
};

// Points awarded to a drafted team, per match.
export const SCORING = {
  goal: 1, // every goal scored, any stage
  groupWin: 3,
  groupDraw: 1,
  cleanSheet: 1, // finished match, conceded zero
  // Winning a knockout match (escalates by round):
  knockoutWin: {
    r32: 4,
    r16: 6,
    qf: 8,
    sf: 10,
    third: 4, // third-place playoff
    final: 15, // lifting the trophy
  } as Record<string, number>,
};

// All 48 group slots for reference while drafting (from the data
// source — placeholder slots resolve to real countries in the API):
// A: Mexico, South Africa, South Korea, UEFA Path D Winner
// B: Canada, Qatar, Switzerland, UEFA Path A Winner
// C: Brazil, Haiti, Morocco, Scotland
// D: Australia, Paraguay, UEFA Path C Winner, United States
// E: Curaçao, Ecuador, Germany, Ivory Coast
// F: Japan, Netherlands, Tunisia, UEFA Path B Winner
// G: Belgium, Egypt, Iran, New Zealand
// H: Cape Verde, Saudi Arabia, Spain, Uruguay
// I: France, IC Path 2 Winner, Norway, Senegal
// J: Algeria, Argentina, Austria, Jordan
// K: Colombia, IC Path 1 Winner, Portugal, Uzbekistan
// L: Croatia, England, Ghana, Panama
