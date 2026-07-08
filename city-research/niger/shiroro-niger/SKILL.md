# Shiroro (Niger State) — City Data Research Skill

> Slug: `shiroro-niger` · LGA: Shiroro · Region: North Central · Tier: lga

Purpose: replace generalised estimates about Shiroro with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 462,564 (2026 est.), growth 3.4%/yr, rank #113
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Abuja DisCo (AEDC)

## What to research — specifically for Shiroro
Prioritise recent (last 6 months) sources that name Shiroro or Shiroro LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Shiroro |
|---|---|
| overview | The one-paragraph "state of Shiroro right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Shiroro/Shiroro last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Shiroro |
| jobs | Who is actually hiring in Shiroro; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Shiroro schools |
| education-stats | Enrollment/literacy news for Niger affecting Shiroro |
| economy | New businesses, factories, closures; Shiroro's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Shiroro |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Shiroro |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Shiroro now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Abuja DisCo (AEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Shiroro's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Shiroro's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Shiroro rent 2026", "Shiroro Niger news", "Shiroro electricity light", "Shiroro road construction", "Shiroro market prices", "Shiroro new estate", "Shiroro hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Shiroro right now",
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
node scripts/append-research.mjs city shiroro-niger <path-to-json>
```
This creates a NEW doc `cityResearch/shiroro-niger__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
