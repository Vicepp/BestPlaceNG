# Aba (Abia State) — City Data Research Skill

> Slug: `aba-abia` · LGA: Aba North · Region: South East · Tier: major

Purpose: replace generalised estimates about Aba with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 854,644 (2026 est.), growth 2.4%/yr, rank #22
- Cost-of-living index: 84 (national avg = 100)
- Safety index: 69/100
- School rating: 6.1/10
- Researched annual rent (as of 2025): self-con ₦300,000, 1-bed ₦600,000, 2-bed ₦700,000, 3-bed ₦1,000,000, shop ₦450,000
- Avg grid power: ~10h/day (estimate), DisCo: Enugu DisCo (EEDC)
- Avg one-way commute: ~45 min

## What to research — specifically for Aba
Prioritise recent (last 6 months) sources that name Aba or Aba North LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Aba |
|---|---|
| overview | The one-paragraph "state of Aba right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Aba/Aba North last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Aba |
| jobs | Who is actually hiring in Aba; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Aba schools |
| education-stats | Enrollment/literacy news for Abia affecting Aba |
| economy | New businesses, factories, closures; Aba's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Aba |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Aba |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Aba now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Enugu DisCo (EEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Aba's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Aba's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Aba rent 2026", "Aba Abia news", "Aba electricity light", "Aba road construction", "Aba market prices", "Aba new estate", "Aba hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Aba right now",
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
node scripts/append-research.mjs city aba-abia <path-to-json>
```
This creates a NEW doc `cityResearch/aba-abia__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
