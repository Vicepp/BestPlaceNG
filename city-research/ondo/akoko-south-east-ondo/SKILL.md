# Akoko South East (Ondo State) — City Data Research Skill

> Slug: `akoko-south-east-ondo` · LGA: Akoko South East · Region: South West · Tier: lga

Purpose: replace generalised estimates about Akoko South East with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 140,930 (2026 est.), growth 2.7%/yr, rank #693
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Benin DisCo (BEDC)

## What to research — specifically for Akoko South East
Prioritise recent (last 6 months) sources that name Akoko South East or Akoko South East LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Akoko South East |
|---|---|
| overview | The one-paragraph "state of Akoko South East right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Akoko South East/Akoko South East last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Akoko South East |
| jobs | Who is actually hiring in Akoko South East; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Akoko South East schools |
| education-stats | Enrollment/literacy news for Ondo affecting Akoko South East |
| economy | New businesses, factories, closures; Akoko South East's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Akoko South East |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Akoko South East |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Akoko South East now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Benin DisCo (BEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Akoko South East's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Akoko South East's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Akoko South East rent 2026", "Akoko South East Ondo news", "Akoko South East electricity light", "Akoko South East road construction", "Akoko South East market prices", "Akoko South East new estate", "Akoko South East hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Akoko South East right now",
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
node scripts/append-research.mjs city akoko-south-east-ondo <path-to-json>
```
This creates a NEW doc `cityResearch/akoko-south-east-ondo__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
