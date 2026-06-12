// Country name (exactly as it appears in ROSTERS / the feed) → ISO
// 3166-1 alpha-2 code, used to derive the flag emoji. England and
// Scotland aren't ISO countries, so their flag emoji are hard-coded.

const ISO: Record<string, string> = {
  Mexico: "MX",
  "Czech Republic": "CZ",
  Germany: "DE",
  Jordan: "JO",
  "South Africa": "ZA",
  Brazil: "BR",
  Algeria: "DZ",
  Croatia: "HR",
  "South Korea": "KR",
  Haiti: "HT",
  Sweden: "SE",
  France: "FR",
  Canada: "CA",
  Iraq: "IQ",
  Portugal: "PT",
  Ghana: "GH",
  "Bosnia and Herzegovina": "BA",
  "United States": "US",
  Uruguay: "UY",
  "Democratic Republic of the Congo": "CD",
  Qatar: "QA",
  Australia: "AU",
  Japan: "JP",
  Argentina: "AR",
  Switzerland: "CH",
  Belgium: "BE",
  Iran: "IR",
  Uzbekistan: "UZ",
  Morocco: "MA",
  Tunisia: "TN",
  Colombia: "CO",
  Panama: "PA",
  Turkey: "TR",
  "New Zealand": "NZ",
  Norway: "NO",
  Paraguay: "PY",
  Netherlands: "NL",
  "Saudi Arabia": "SA",
  Senegal: "SN",
  Curaçao: "CW",
  Egypt: "EG",
  Spain: "ES",
  Austria: "AT",
  "Ivory Coast": "CI",
  Ecuador: "EC",
  "Cape Verde": "CV",
};

// Home nations have dedicated emoji (subdivision tag sequences).
const SPECIAL: Record<string, string> = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
};

/** Flag emoji for a country, or "" if we don't have one. */
export function flag(team: string): string {
  if (SPECIAL[team]) return SPECIAL[team];
  const iso = ISO[team];
  if (!iso) return "";
  return String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
