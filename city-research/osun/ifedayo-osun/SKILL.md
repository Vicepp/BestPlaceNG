# Ifedayo (Osun State) — City Data Research Skill

> Slug: `ifedayo-osun` · LGA: Ifedayo · Region: South West · Tier: lga

Purpose: replace generalised estimates about Ifedayo with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 51,985 (2026 est.), growth 1.6%/yr, rank #753
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Ibadan DisCo (IBEDC)

## What to research — specifically for Ifedayo
Prioritise recent (last 6 months) sources that name Ifedayo or Ifedayo LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Ifedayo |
|---|---|
| overview | The one-paragraph "state of Ifedayo right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Ifedayo/Ifedayo last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Ifedayo |
| jobs | Who is actually hiring in Ifedayo; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Ifedayo schools |
| education-stats | Enrollment/literacy news for Osun affecting Ifedayo |
| economy | New businesses, factories, closures; Ifedayo's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Ifedayo |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Ifedayo |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Ifedayo now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Ibadan DisCo (IBEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Ifedayo's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Ifedayo's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Ifedayo rent 2026", "Ifedayo Osun news", "Ifedayo electricity light", "Ifedayo road construction", "Ifedayo market prices", "Ifedayo new estate", "Ifedayo hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Ifedayo right now",
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
node scripts/append-research.mjs city ifedayo-osun <path-to-json>
```
This creates a NEW doc `cityResearch/ifedayo-osun__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
