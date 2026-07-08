# Ovia North East (Edo State) — City Data Research Skill

> Slug: `ovia-north-east-edo` · LGA: Ovia North East · Region: South South · Tier: lga

Purpose: replace generalised estimates about Ovia North East with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 253,020 (2026 est.), growth 2.5%/yr, rank #431
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Benin DisCo (BEDC)

## What to research — specifically for Ovia North East
Prioritise recent (last 6 months) sources that name Ovia North East or Ovia North East LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Ovia North East |
|---|---|
| overview | The one-paragraph "state of Ovia North East right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Ovia North East/Ovia North East last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Ovia North East |
| jobs | Who is actually hiring in Ovia North East; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Ovia North East schools |
| education-stats | Enrollment/literacy news for Edo affecting Ovia North East |
| economy | New businesses, factories, closures; Ovia North East's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Ovia North East |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Ovia North East |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Ovia North East now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Benin DisCo (BEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Ovia North East's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Ovia North East's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Ovia North East rent 2026", "Ovia North East Edo news", "Ovia North East electricity light", "Ovia North East road construction", "Ovia North East market prices", "Ovia North East new estate", "Ovia North East hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Ovia North East right now",
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
node scripts/append-research.mjs city ovia-north-east-edo <path-to-json>
```
This creates a NEW doc `cityResearch/ovia-north-east-edo__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
