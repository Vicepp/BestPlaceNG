# Ahiazu-Mbaise (Imo State) — City Data Research Skill

> Slug: `ahiazu-mbaise-imo` · LGA: Ahiazu Mbaise · Region: South East · Tier: lga

Purpose: replace generalised estimates about Ahiazu-Mbaise with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 257,759 (2026 est.), growth 2.1%/yr, rank #416
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Enugu DisCo (EEDC)

## What to research — specifically for Ahiazu-Mbaise
Prioritise recent (last 6 months) sources that name Ahiazu-Mbaise or Ahiazu Mbaise LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Ahiazu-Mbaise |
|---|---|
| overview | The one-paragraph "state of Ahiazu-Mbaise right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Ahiazu-Mbaise/Ahiazu Mbaise last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Ahiazu-Mbaise |
| jobs | Who is actually hiring in Ahiazu-Mbaise; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Ahiazu-Mbaise schools |
| education-stats | Enrollment/literacy news for Imo affecting Ahiazu-Mbaise |
| economy | New businesses, factories, closures; Ahiazu-Mbaise's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Ahiazu-Mbaise |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Ahiazu-Mbaise |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Ahiazu-Mbaise now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Enugu DisCo (EEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Ahiazu-Mbaise's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Ahiazu-Mbaise's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Ahiazu-Mbaise rent 2026", "Ahiazu-Mbaise Imo news", "Ahiazu-Mbaise electricity light", "Ahiazu-Mbaise road construction", "Ahiazu-Mbaise market prices", "Ahiazu-Mbaise new estate", "Ahiazu-Mbaise hospital".

## Tone & distribution (IMPORTANT)
This is a relocation guide, not a news site. Write for someone deciding whether to
LIVE in Ahiazu-Mbaise: rents, prices, power hours, commutes, schools, day-to-day life.
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
  "headline": "one-sentence summary of the situation in Ahiazu-Mbaise right now",
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
node scripts/append-research.mjs city ahiazu-mbaise-imo <path-to-json>
```
This creates a NEW doc `cityResearch/ahiazu-mbaise-imo__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
