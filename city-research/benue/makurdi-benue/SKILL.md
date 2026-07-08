# Makurdi (Benue State) — City Data Research Skill

> Slug: `makurdi-benue` · LGA: Makurdi · Region: North Central · Tier: major · **Benue State Capital**

Purpose: replace generalised estimates about Makurdi with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 475,412 (2026 est.), growth 2.3%/yr, rank #101
- Cost-of-living index: 75 (national avg = 100)
- Safety index: 75/100
- School rating: 6.4/10
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Jos DisCo (JED)

## What to research — specifically for Makurdi
Prioritise recent (last 6 months) sources that name Makurdi or Makurdi LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Makurdi |
|---|---|
| overview | The one-paragraph "state of Makurdi right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Makurdi/Makurdi last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Makurdi |
| jobs | Who is actually hiring in Makurdi; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Makurdi schools |
| education-stats | Enrollment/literacy news for Benue affecting Makurdi |
| economy | New businesses, factories, closures; Makurdi's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Makurdi |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Makurdi |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Makurdi now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Jos DisCo (JED); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Makurdi's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Makurdi's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Makurdi rent 2026", "Makurdi Benue news", "Makurdi electricity light", "Makurdi road construction", "Makurdi market prices", "Makurdi new estate", "Makurdi hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Makurdi right now",
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
node scripts/append-research.mjs city makurdi-benue <path-to-json>
```
This creates a NEW doc `cityResearch/makurdi-benue__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
