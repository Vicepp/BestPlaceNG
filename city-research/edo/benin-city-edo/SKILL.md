# Benin City (Edo State) — City Data Research Skill

> Slug: `benin-city-edo` · LGA: Oredo · Region: South South · Tier: major · **Edo State Capital**

Purpose: replace generalised estimates about Benin City with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 1,770,251 (2026 est.), growth 2.5%/yr, rank #6
- Cost-of-living index: 85 (national avg = 100)
- Safety index: 76/100
- School rating: 6.5/10
- Researched annual rent (as of 2025): self-con ₦300,000, 1-bed ₦500,000, 2-bed ₦800,000, 3-bed ₦1,200,000, shop ₦450,000
- Avg grid power: ~8h/day (estimate), DisCo: Benin DisCo (BEDC)
- Avg one-way commute: ~40 min

## What to research — specifically for Benin City
Prioritise recent (last 6 months) sources that name Benin City or Oredo LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Benin City |
|---|---|
| overview | The one-paragraph "state of Benin City right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Benin City/Oredo last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Benin City |
| jobs | Who is actually hiring in Benin City; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Benin City schools |
| education-stats | Enrollment/literacy news for Edo affecting Benin City |
| economy | New businesses, factories, closures; Benin City's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Benin City |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Benin City |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Benin City now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Benin DisCo (BEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Benin City's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Benin City's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Benin City rent 2026", "Benin City Edo news", "Benin City electricity light", "Benin City road construction", "Benin City market prices", "Benin City new estate", "Benin City hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Benin City right now",
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
node scripts/append-research.mjs city benin-city-edo <path-to-json>
```
This creates a NEW doc `cityResearch/benin-city-edo__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
