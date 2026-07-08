# Uhunmwonde (Edo State) — City Data Research Skill

> Slug: `uhunmwonde-edo` · LGA: Uhunmwonde · Region: South South · Tier: lga

Purpose: replace generalised estimates about Uhunmwonde with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 198,345 (2026 est.), growth 2.5%/yr, rank #569
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Benin DisCo (BEDC)

## What to research — specifically for Uhunmwonde
Prioritise recent (last 6 months) sources that name Uhunmwonde or Uhunmwonde LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Uhunmwonde |
|---|---|
| overview | The one-paragraph "state of Uhunmwonde right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Uhunmwonde/Uhunmwonde last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Uhunmwonde |
| jobs | Who is actually hiring in Uhunmwonde; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Uhunmwonde schools |
| education-stats | Enrollment/literacy news for Edo affecting Uhunmwonde |
| economy | New businesses, factories, closures; Uhunmwonde's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Uhunmwonde |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Uhunmwonde |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Uhunmwonde now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Benin DisCo (BEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Uhunmwonde's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Uhunmwonde's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Uhunmwonde rent 2026", "Uhunmwonde Edo news", "Uhunmwonde electricity light", "Uhunmwonde road construction", "Uhunmwonde market prices", "Uhunmwonde new estate", "Uhunmwonde hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Uhunmwonde right now",
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
node scripts/append-research.mjs city uhunmwonde-edo <path-to-json>
```
This creates a NEW doc `cityResearch/uhunmwonde-edo__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
