# Warri (Delta State) — City Data Research Skill

> Slug: `warri-delta` · LGA: Warri South · Region: South South · Tier: major

Purpose: replace generalised estimates about Warri with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 837,355 (2026 est.), growth 2%/yr, rank #24
- Cost-of-living index: 102 (national avg = 100)
- Safety index: 68/100
- School rating: 6.2/10
- Researched annual rent (as of 2025): self-con ₦220,000, 1-bed ₦350,000, 2-bed ₦550,000, 3-bed ₦900,000, shop ₦400,000
- Avg grid power: ~9h/day (estimate), DisCo: Benin DisCo (BEDC)
- Avg one-way commute: ~40 min

## What to research — specifically for Warri
Prioritise recent (last 6 months) sources that name Warri or Warri South LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Warri |
|---|---|
| overview | The one-paragraph "state of Warri right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Warri/Warri South last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Warri |
| jobs | Who is actually hiring in Warri; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Warri schools |
| education-stats | Enrollment/literacy news for Delta affecting Warri |
| economy | New businesses, factories, closures; Warri's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Warri |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Warri |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Warri now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Benin DisCo (BEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Warri's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Warri's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Warri rent 2026", "Warri Delta news", "Warri electricity light", "Warri road construction", "Warri market prices", "Warri new estate", "Warri hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Warri right now",
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
node scripts/append-research.mjs city warri-delta <path-to-json>
```
This creates a NEW doc `cityResearch/warri-delta__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
