# Apapa (Lagos State) — City Data Research Skill

> Slug: `apapa-lagos` · LGA: Apapa · Region: South West · Tier: lga

Purpose: replace generalised estimates about Apapa with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 217,661 (2015 est.), growth 3%/yr, rank #524
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Ikeja Electric / Eko DisCo

## What to research — specifically for Apapa
Prioritise recent (last 6 months) sources that name Apapa or Apapa LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Apapa |
|---|---|
| overview | The one-paragraph "state of Apapa right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Apapa/Apapa last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Apapa |
| jobs | Who is actually hiring in Apapa; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Apapa schools |
| education-stats | Enrollment/literacy news for Lagos affecting Apapa |
| economy | New businesses, factories, closures; Apapa's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Apapa |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Apapa |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Apapa now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Ikeja Electric / Eko DisCo; band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Apapa's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Apapa's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Apapa rent 2026", "Apapa Lagos news", "Apapa electricity light", "Apapa road construction", "Apapa market prices", "Apapa new estate", "Apapa hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Apapa right now",
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
node scripts/append-research.mjs city apapa-lagos <path-to-json>
```
This creates a NEW doc `cityResearch/apapa-lagos__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
