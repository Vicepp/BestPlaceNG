# Lafia (Nasarawa State) — City Data Research Skill

> Slug: `lafia-nasarawa` · LGA: Lafia · Region: North Central · Tier: major · **Nasarawa State Capital**

Purpose: replace generalised estimates about Lafia with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 567,694 (2026 est.), growth 2.8%/yr, rank #65
- Cost-of-living index: 77 (national avg = 100)
- Safety index: 78/100
- School rating: 6.3/10
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Abuja DisCo (AEDC)

## What to research — specifically for Lafia
Prioritise recent (last 6 months) sources that name Lafia or Lafia LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Lafia |
|---|---|
| overview | The one-paragraph "state of Lafia right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Lafia/Lafia last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Lafia |
| jobs | Who is actually hiring in Lafia; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Lafia schools |
| education-stats | Enrollment/literacy news for Nasarawa affecting Lafia |
| economy | New businesses, factories, closures; Lafia's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Lafia |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Lafia |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Lafia now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Abuja DisCo (AEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Lafia's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Lafia's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Lafia rent 2026", "Lafia Nasarawa news", "Lafia electricity light", "Lafia road construction", "Lafia market prices", "Lafia new estate", "Lafia hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Lafia right now",
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
node scripts/append-research.mjs city lafia-nasarawa <path-to-json>
```
This creates a NEW doc `cityResearch/lafia-nasarawa__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
