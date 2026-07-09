# Ilesha East (Osun State) — City Data Research Skill

> Slug: `ilesha-east-osun` · LGA: Ilesa East · Region: South West · Tier: lga

Purpose: replace generalised estimates about Ilesha East with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 146,009 (2026 est.), growth 1.6%/yr, rank #686
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Ibadan DisCo (IBEDC)

## What to research — specifically for Ilesha East
Prioritise recent (last 6 months) sources that name Ilesha East or Ilesa East LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Ilesha East |
|---|---|
| overview | The one-paragraph "state of Ilesha East right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Ilesha East/Ilesa East last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Ilesha East |
| jobs | Who is actually hiring in Ilesha East; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Ilesha East schools |
| education-stats | Enrollment/literacy news for Osun affecting Ilesha East |
| economy | New businesses, factories, closures; Ilesha East's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Ilesha East |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Ilesha East |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Ilesha East now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Ibadan DisCo (IBEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Ilesha East's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Ilesha East's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Ilesha East rent 2026", "Ilesha East Osun news", "Ilesha East electricity light", "Ilesha East road construction", "Ilesha East market prices", "Ilesha East new estate", "Ilesha East hospital".

## Tone & distribution (IMPORTANT)
This is a relocation guide, not a news site. Write for someone deciding whether to
LIVE in Ilesha East: rents, prices, power hours, commutes, schools, day-to-day life.
- Every finding goes under `sections.<slug>` so it renders on that section's OWN
  page — do not pack findings into the overview.
- Politics/government material goes ONLY under `politics-voting`, brief and factual.
- Security goes ONLY under `crime`: what, where, trend — no alarmism.
- The headline and highlights must read like advice to a mover, and must not lead
  with politics or security unless it genuinely changes the decision to move.

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Ilesha East right now",
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
node scripts/append-research.mjs city ilesha-east-osun <path-to-json>
```
This creates a NEW doc `cityResearch/ilesha-east-osun__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
