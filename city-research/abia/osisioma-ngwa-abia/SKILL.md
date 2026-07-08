# Osisioma Ngwa (Abia State) — City Data Research Skill

> Slug: `osisioma-ngwa-abia` · LGA: Osisioma Ngwa · Region: South East · Tier: lga

Purpose: replace generalised estimates about Osisioma Ngwa with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 352,944 (2026 est.), growth 2.4%/yr, rank #237
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Enugu DisCo (EEDC)

## What to research — specifically for Osisioma Ngwa
Prioritise recent (last 6 months) sources that name Osisioma Ngwa or Osisioma Ngwa LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Osisioma Ngwa |
|---|---|
| overview | The one-paragraph "state of Osisioma Ngwa right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Osisioma Ngwa/Osisioma Ngwa last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Osisioma Ngwa |
| jobs | Who is actually hiring in Osisioma Ngwa; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Osisioma Ngwa schools |
| education-stats | Enrollment/literacy news for Abia affecting Osisioma Ngwa |
| economy | New businesses, factories, closures; Osisioma Ngwa's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Osisioma Ngwa |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Osisioma Ngwa |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Osisioma Ngwa now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Enugu DisCo (EEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Osisioma Ngwa's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Osisioma Ngwa's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Osisioma Ngwa rent 2026", "Osisioma Ngwa Abia news", "Osisioma Ngwa electricity light", "Osisioma Ngwa road construction", "Osisioma Ngwa market prices", "Osisioma Ngwa new estate", "Osisioma Ngwa hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Osisioma Ngwa right now",
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
node scripts/append-research.mjs city osisioma-ngwa-abia <path-to-json>
```
This creates a NEW doc `cityResearch/osisioma-ngwa-abia__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
