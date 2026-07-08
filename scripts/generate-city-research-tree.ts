/**
 * Generates the city-research/ knowledge tree:
 *   city-research/<state-slug>/STATE.md            — state research skill file
 *   city-research/<state-slug>/<city-slug>/SKILL.md — city research skill file
 *
 * One folder per state (37), one folder per city inside its state (every city
 * in the app's dataset). Each SKILL.md is CITY-SPECIFIC: identity, current
 * baseline numbers from the app's own data, a research checklist phrased for
 * that city, and append-only save instructions (history is never overwritten).
 *
 * Re-runnable: regenerates every file in place (safe — these are instructions,
 * not data; snapshots live in Firestore).
 *
 * Run: npx tsx scripts/generate-city-research-tree.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cities } from "../src/data/cities";
import { states } from "../src/data/states";
import researchedRent from "../src/data/researched-rent.json";
import infraConfig from "../src/data/infrastructure-config.json";

const ROOT = join(process.cwd(), "city-research");

const rentMap = researchedRent as Record<string, { selfContain: number; oneBedroom: number; twoBedroom: number; threeBedroom: number; shop: number; asOf: string }>;
const infra = infraConfig as unknown as {
  education: { stateLiteracy: Record<string, number> };
  electricity: { discoByState: Record<string, string>; cityAvgGridHours: Record<string, number> };
  commute: { cityOneWayMinutes: Record<string, number> };
  economy: { stateKeyIndustries: Record<string, string[]>; regionKeyIndustries: Record<string, string[]> };
};

const naira = (n: number) => `₦${n.toLocaleString()}`;

function cityFile(c: (typeof cities)[number]): string {
  const rent = rentMap[c.slug];
  const gridHours = infra.electricity.cityAvgGridHours[c.slug];
  const commute = infra.commute.cityOneWayMinutes[c.slug];
  const disco = infra.electricity.discoByState[c.stateSlug] ?? "the state DisCo";

  const baseline: string[] = [];
  baseline.push(`- Population: ${c.population.toLocaleString()} (${c.populationYear} est.), growth ${c.growthRatePercent}%/yr, rank #${c.rank}`);
  if (c.costOfLivingIndex !== undefined) baseline.push(`- Cost-of-living index: ${c.costOfLivingIndex} (national avg = 100)`);
  if (c.safetyIndex !== undefined) baseline.push(`- Safety index: ${c.safetyIndex}/100`);
  if (c.schoolRating !== undefined) baseline.push(`- School rating: ${c.schoolRating}/10`);
  if (rent) baseline.push(`- Researched annual rent (as of ${rent.asOf}): self-con ${naira(rent.selfContain)}, 1-bed ${naira(rent.oneBedroom)}, 2-bed ${naira(rent.twoBedroom)}, 3-bed ${naira(rent.threeBedroom)}, shop ${naira(rent.shop)}`);
  else baseline.push(`- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.`);
  if (gridHours !== undefined) baseline.push(`- Avg grid power: ~${gridHours}h/day (estimate), DisCo: ${disco}`);
  else baseline.push(`- Grid power: no city-specific figure yet (tier default used), DisCo: ${disco}`);
  if (commute !== undefined) baseline.push(`- Avg one-way commute: ~${commute} min`);

  const capital = c.isFederalCapital ? " · **Federal Capital**" : c.isStateCapital ? ` · **${c.stateName} State Capital**` : "";

  return `# ${c.name} (${c.stateName} State) — City Data Research Skill

> Slug: \`${c.slug}\` · LGA: ${c.lga} · Region: ${c.region} · Tier: ${c.tier}${capital}

Purpose: replace generalised estimates about ${c.name} with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
${baseline.join("\n")}

## What to research — specifically for ${c.name}
Prioritise recent (last 6 months) sources that name ${c.name} or ${c.lga} LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for ${c.name} |
|---|---|
| overview | The one-paragraph "state of ${c.name} right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in ${c.name}/${c.lga} last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting ${c.name} |
| jobs | Who is actually hiring in ${c.name}; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming ${c.name} schools |
| education-stats | Enrollment/literacy news for ${c.stateName} affecting ${c.name} |
| economy | New businesses, factories, closures; ${c.name}'s trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in ${c.name} |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in ${c.name} |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in ${c.name} now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on ${disco}; band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define ${c.name}'s calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | ${c.name}'s main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "${c.name} rent 2026", "${c.name} ${c.stateName} news", "${c.name} electricity light", "${c.name} road construction", "${c.name} market prices", "${c.name} new estate", "${c.name} hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. \`sections\` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
\`\`\`json
{
  "headline": "one-sentence summary of the situation in ${c.name} right now",
  "asOf": "YYYY-MM",
  "highlights": ["3-6 short, concrete findings with numbers"],
  "sections": {
    "apartments": { "note": "…", "areas": [{ "area": "…", "oneBedroom": 0, "twoBedroom": 0 }] },
    "electricity": { "note": "…", "avgDailyHours": 0 },
    "crime": { "note": "…", "trend": "improving|stable|worsening" },
    "market": { "note": "…" }
  },
  "sources": ["url or publication + date", "…"]
}
\`\`\`
2. Save it to a temp file, then run:
\`\`\`
node scripts/append-research.mjs city ${c.slug} <path-to-json>
\`\`\`
This creates a NEW doc \`cityResearch/${c.slug}__<timestamp>\` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
`;
}

function stateFile(s: (typeof states)[number], stateCities: typeof cities): string {
  const literacy = infra.education.stateLiteracy[s.slug];
  const disco = infra.electricity.discoByState[s.slug];
  const industries = infra.economy.stateKeyIndustries[s.slug] ?? infra.economy.regionKeyIndustries[s.region] ?? [];
  const majors = stateCities.filter((c) => c.tier === "major");
  const cityList = stateCities.map((c) => `- \`${c.slug}\` — ${c.name}${c.isStateCapital ? " (capital)" : c.isFederalCapital ? " (federal capital)" : ""}`).join("\n");

  return `# ${s.name} State — State Data Research Skill

> Slug: \`${s.slug}\` · Capital: ${s.capital} · Region: ${s.region} · Cities in app: ${stateCities.length} (${majors.length} with full profiles)

Purpose: research CURRENT state-level facts for ${s.name} and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
${literacy !== undefined ? `- Adult literacy: ~${literacy}% (estimate)` : "- Adult literacy: national figure used"}
${disco ? `- Electricity DisCo: ${disco}` : ""}
${industries.length ? `- Key industries: ${industries.join(", ")}` : ""}

## What to research — specifically for ${s.name} State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "${s.name} state budget 2026", "${s.name} state governor news", "${s.name} state security", "${s.name} state road project".

## Cities of ${s.name} in the app (each has its own skill folder here)
${cityList}

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
\`\`\`
node scripts/append-research.mjs state ${s.slug} <path-to-json>
\`\`\`
Creates a NEW doc \`stateResearch/${s.slug}__<timestamp>\`; older snapshots stay (history).
`;
}

let cityCount = 0;
for (const s of states) {
  const stateCities = cities.filter((c) => c.stateSlug === s.slug);
  const stateDir = join(ROOT, s.slug);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(join(stateDir, "STATE.md"), stateFile(s, stateCities), "utf8");
  for (const c of stateCities) {
    const cityDir = join(stateDir, c.slug);
    mkdirSync(cityDir, { recursive: true });
    writeFileSync(join(cityDir, "SKILL.md"), cityFile(c), "utf8");
    cityCount++;
  }
  console.log(`${s.slug}: ${stateCities.length} cities`);
}

writeFileSync(
  join(ROOT, "README.md"),
  `# City Research Knowledge Tree

One folder per state (${states.length}), one folder per city inside it (${cityCount} total).
Each city folder holds a SKILL.md with CITY-SPECIFIC research instructions and the
app's current baseline for that city; each state folder holds a STATE.md equivalent.

- Entry point: run the \`/update-city-data\` skill (or ask for the city-data-researcher agent).
- Data written by this system is APPEND-ONLY: cityResearch/<slug>__<timestamp> and
  stateResearch/<slug>__<timestamp> in Firestore. Nothing is ever overwritten, so the
  full history of snapshots is preserved and queryable.
- Regenerate this tree after adding cities: npx tsx scripts/generate-city-research-tree.ts
`,
  "utf8"
);
console.log(`\nDone: ${states.length} states, ${cityCount} city folders.`);
