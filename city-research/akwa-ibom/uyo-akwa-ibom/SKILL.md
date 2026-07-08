# Uyo (Akwa Ibom State) — City Data Research Skill

> Slug: `uyo-akwa-ibom` · LGA: Uyo · Region: South South · Tier: major · **Akwa Ibom State Capital**

Purpose: replace generalised estimates about Uyo with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 414,926 (2026 est.), growth 1.5%/yr, rank #157
- Cost-of-living index: 92 (national avg = 100)
- Safety index: 81/100
- School rating: 7/10
- Researched annual rent (as of 2025): self-con ₦400,000, 1-bed ₦700,000, 2-bed ₦1,200,000, 3-bed ₦1,800,000, shop ₦600,000
- Avg grid power: ~12h/day (estimate), DisCo: Port Harcourt DisCo (PHED)
- Avg one-way commute: ~30 min

## What to research — specifically for Uyo
Prioritise recent (last 6 months) sources that name Uyo or Uyo LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Uyo |
|---|---|
| overview | The one-paragraph "state of Uyo right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Uyo/Uyo last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Uyo |
| jobs | Who is actually hiring in Uyo; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Uyo schools |
| education-stats | Enrollment/literacy news for Akwa Ibom affecting Uyo |
| economy | New businesses, factories, closures; Uyo's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Uyo |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Uyo |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Uyo now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Port Harcourt DisCo (PHED); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Uyo's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Uyo's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Uyo rent 2026", "Uyo Akwa Ibom news", "Uyo electricity light", "Uyo road construction", "Uyo market prices", "Uyo new estate", "Uyo hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Uyo right now",
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
node scripts/append-research.mjs city uyo-akwa-ibom <path-to-json>
```
This creates a NEW doc `cityResearch/uyo-akwa-ibom__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
