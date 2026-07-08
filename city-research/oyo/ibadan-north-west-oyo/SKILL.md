# Ibadan North West (Oyo State) — City Data Research Skill

> Slug: `ibadan-north-west-oyo` · LGA: Ibadan North West · Region: South West · Tier: lga

Purpose: replace generalised estimates about Ibadan North West with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 240,644 (2026 est.), growth 2.3%/yr, rank #468
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Ibadan DisCo (IBEDC)

## What to research — specifically for Ibadan North West
Prioritise recent (last 6 months) sources that name Ibadan North West or Ibadan North West LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Ibadan North West |
|---|---|
| overview | The one-paragraph "state of Ibadan North West right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Ibadan North West/Ibadan North West last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Ibadan North West |
| jobs | Who is actually hiring in Ibadan North West; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Ibadan North West schools |
| education-stats | Enrollment/literacy news for Oyo affecting Ibadan North West |
| economy | New businesses, factories, closures; Ibadan North West's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Ibadan North West |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Ibadan North West |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Ibadan North West now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Ibadan DisCo (IBEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Ibadan North West's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Ibadan North West's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Ibadan North West rent 2026", "Ibadan North West Oyo news", "Ibadan North West electricity light", "Ibadan North West road construction", "Ibadan North West market prices", "Ibadan North West new estate", "Ibadan North West hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Ibadan North West right now",
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
node scripts/append-research.mjs city ibadan-north-west-oyo <path-to-json>
```
This creates a NEW doc `cityResearch/ibadan-north-west-oyo__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
