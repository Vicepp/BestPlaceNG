# Onicha (Ebonyi State) — City Data Research Skill

> Slug: `onicha-ebonyi` · LGA: Onicha · Region: South East · Tier: lga

Purpose: replace generalised estimates about Onicha with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 389,302 (2026 est.), growth 2.5%/yr, rank #192
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Enugu DisCo (EEDC)

## What to research — specifically for Onicha
Prioritise recent (last 6 months) sources that name Onicha or Onicha LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Onicha |
|---|---|
| overview | The one-paragraph "state of Onicha right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Onicha/Onicha last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Onicha |
| jobs | Who is actually hiring in Onicha; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Onicha schools |
| education-stats | Enrollment/literacy news for Ebonyi affecting Onicha |
| economy | New businesses, factories, closures; Onicha's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Onicha |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Onicha |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Onicha now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Enugu DisCo (EEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Onicha's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Onicha's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Onicha rent 2026", "Onicha Ebonyi news", "Onicha electricity light", "Onicha road construction", "Onicha market prices", "Onicha new estate", "Onicha hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Onicha right now",
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
node scripts/append-research.mjs city onicha-ebonyi <path-to-json>
```
This creates a NEW doc `cityResearch/onicha-ebonyi__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
