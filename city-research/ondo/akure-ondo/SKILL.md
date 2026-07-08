# Akure (Ondo State) — City Data Research Skill

> Slug: `akure-ondo` · LGA: Akure South · Region: South West · Tier: major · **Ondo State Capital**

Purpose: replace generalised estimates about Akure with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 616,088 (2026 est.), growth 2.7%/yr, rank #46
- Cost-of-living index: 83 (national avg = 100)
- Safety index: 78/100
- School rating: 6.9/10
- Researched annual rent (as of 2025): self-con ₦350,000, 1-bed ₦700,000, 2-bed ₦1,200,000, 3-bed ₦2,000,000, shop ₦600,000
- Avg grid power: ~10h/day (estimate), DisCo: Benin DisCo (BEDC)

## What to research — specifically for Akure
Prioritise recent (last 6 months) sources that name Akure or Akure South LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Akure |
|---|---|
| overview | The one-paragraph "state of Akure right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Akure/Akure South last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Akure |
| jobs | Who is actually hiring in Akure; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Akure schools |
| education-stats | Enrollment/literacy news for Ondo affecting Akure |
| economy | New businesses, factories, closures; Akure's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Akure |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Akure |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Akure now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Benin DisCo (BEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Akure's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Akure's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Akure rent 2026", "Akure Ondo news", "Akure electricity light", "Akure road construction", "Akure market prices", "Akure new estate", "Akure hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Akure right now",
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
node scripts/append-research.mjs city akure-ondo <path-to-json>
```
This creates a NEW doc `cityResearch/akure-ondo__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
