# Ilorin (Kwara State) — City Data Research Skill

> Slug: `ilorin-kwara` · LGA: Ilorin West · Region: North Central · Tier: major · **Kwara State Capital**

Purpose: replace generalised estimates about Ilorin with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 1,299,410 (2026 est.), growth 2.6%/yr, rank #11
- Cost-of-living index: 82 (national avg = 100)
- Safety index: 79/100
- School rating: 6.7/10
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Avg grid power: ~12h/day (estimate), DisCo: Ibadan DisCo (IBEDC)
- Avg one-way commute: ~30 min

## What to research — specifically for Ilorin
Prioritise recent (last 6 months) sources that name Ilorin or Ilorin West LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Ilorin |
|---|---|
| overview | The one-paragraph "state of Ilorin right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Ilorin/Ilorin West last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Ilorin |
| jobs | Who is actually hiring in Ilorin; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Ilorin schools |
| education-stats | Enrollment/literacy news for Kwara affecting Ilorin |
| economy | New businesses, factories, closures; Ilorin's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Ilorin |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Ilorin |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Ilorin now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Ibadan DisCo (IBEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Ilorin's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Ilorin's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Ilorin rent 2026", "Ilorin Kwara news", "Ilorin electricity light", "Ilorin road construction", "Ilorin market prices", "Ilorin new estate", "Ilorin hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Ilorin right now",
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
node scripts/append-research.mjs city ilorin-kwara <path-to-json>
```
This creates a NEW doc `cityResearch/ilorin-kwara__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
