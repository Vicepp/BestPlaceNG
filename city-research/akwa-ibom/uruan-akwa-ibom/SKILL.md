# Uruan (Akwa Ibom State) — City Data Research Skill

> Slug: `uruan-akwa-ibom` · LGA: Uruan · Region: South South · Tier: lga

Purpose: replace generalised estimates about Uruan with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 158,891 (2026 est.), growth 1.5%/yr, rank #659
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Port Harcourt DisCo (PHED)

## What to research — specifically for Uruan
Prioritise recent (last 6 months) sources that name Uruan or Uruan LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Uruan |
|---|---|
| overview | The one-paragraph "state of Uruan right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Uruan/Uruan last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Uruan |
| jobs | Who is actually hiring in Uruan; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Uruan schools |
| education-stats | Enrollment/literacy news for Akwa Ibom affecting Uruan |
| economy | New businesses, factories, closures; Uruan's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Uruan |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Uruan |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Uruan now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Port Harcourt DisCo (PHED); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Uruan's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Uruan's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Uruan rent 2026", "Uruan Akwa Ibom news", "Uruan electricity light", "Uruan road construction", "Uruan market prices", "Uruan new estate", "Uruan hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Uruan right now",
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
node scripts/append-research.mjs city uruan-akwa-ibom <path-to-json>
```
This creates a NEW doc `cityResearch/uruan-akwa-ibom__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
