# Southern Ijaw (Bayelsa State) — City Data Research Skill

> Slug: `southern-ijaw-bayelsa` · LGA: Southern Ijaw · Region: South South · Tier: lga

Purpose: replace generalised estimates about Southern Ijaw with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 529,078 (2026 est.), growth 2.5%/yr, rank #75
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Port Harcourt DisCo (PHED)

## What to research — specifically for Southern Ijaw
Prioritise recent (last 6 months) sources that name Southern Ijaw or Southern Ijaw LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Southern Ijaw |
|---|---|
| overview | The one-paragraph "state of Southern Ijaw right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Southern Ijaw/Southern Ijaw last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Southern Ijaw |
| jobs | Who is actually hiring in Southern Ijaw; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Southern Ijaw schools |
| education-stats | Enrollment/literacy news for Bayelsa affecting Southern Ijaw |
| economy | New businesses, factories, closures; Southern Ijaw's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Southern Ijaw |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Southern Ijaw |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Southern Ijaw now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Port Harcourt DisCo (PHED); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Southern Ijaw's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Southern Ijaw's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Southern Ijaw rent 2026", "Southern Ijaw Bayelsa news", "Southern Ijaw electricity light", "Southern Ijaw road construction", "Southern Ijaw market prices", "Southern Ijaw new estate", "Southern Ijaw hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Southern Ijaw right now",
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
```
2. Save it to a temp file, then run:
```
node scripts/append-research.mjs city southern-ijaw-bayelsa <path-to-json>
```
This creates a NEW doc `cityResearch/southern-ijaw-bayelsa__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
