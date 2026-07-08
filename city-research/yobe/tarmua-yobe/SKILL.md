# Tarmua (Yobe State) — City Data Research Skill

> Slug: `tarmua-yobe` · LGA: Tarmuwa · Region: North East · Tier: lga

Purpose: replace generalised estimates about Tarmua with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 136,721 (2026 est.), growth 2.9%/yr, rank #698
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Yola DisCo (YEDC)

## What to research — specifically for Tarmua
Prioritise recent (last 6 months) sources that name Tarmua or Tarmuwa LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Tarmua |
|---|---|
| overview | The one-paragraph "state of Tarmua right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Tarmua/Tarmuwa last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Tarmua |
| jobs | Who is actually hiring in Tarmua; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Tarmua schools |
| education-stats | Enrollment/literacy news for Yobe affecting Tarmua |
| economy | New businesses, factories, closures; Tarmua's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Tarmua |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Tarmua |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Tarmua now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Yola DisCo (YEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Tarmua's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Tarmua's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Tarmua rent 2026", "Tarmua Yobe news", "Tarmua electricity light", "Tarmua road construction", "Tarmua market prices", "Tarmua new estate", "Tarmua hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Tarmua right now",
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
node scripts/append-research.mjs city tarmua-yobe <path-to-json>
```
This creates a NEW doc `cityResearch/tarmua-yobe__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
