# Lagos Mainland (Lagos State) — City Data Research Skill

> Slug: `lagos-mainland-lagos` · LGA: Lagos Mainland · Region: South West · Tier: lga

Purpose: replace generalised estimates about Lagos Mainland with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 317,980 (2015 est.), growth 3%/yr, rank #286
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Ikeja Electric / Eko DisCo

## What to research — specifically for Lagos Mainland
Prioritise recent (last 6 months) sources that name Lagos Mainland or Lagos Mainland LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Lagos Mainland |
|---|---|
| overview | The one-paragraph "state of Lagos Mainland right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Lagos Mainland/Lagos Mainland last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Lagos Mainland |
| jobs | Who is actually hiring in Lagos Mainland; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Lagos Mainland schools |
| education-stats | Enrollment/literacy news for Lagos affecting Lagos Mainland |
| economy | New businesses, factories, closures; Lagos Mainland's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Lagos Mainland |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Lagos Mainland |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Lagos Mainland now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Ikeja Electric / Eko DisCo; band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Lagos Mainland's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Lagos Mainland's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Lagos Mainland rent 2026", "Lagos Mainland Lagos news", "Lagos Mainland electricity light", "Lagos Mainland road construction", "Lagos Mainland market prices", "Lagos Mainland new estate", "Lagos Mainland hospital".

## Tone & distribution (IMPORTANT)
This is a relocation guide, not a news site. Write for someone deciding whether to
LIVE in Lagos Mainland: rents, prices, power hours, commutes, schools, day-to-day life.
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
  "headline": "one-sentence summary of the situation in Lagos Mainland right now",
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
node scripts/append-research.mjs city lagos-mainland-lagos <path-to-json>
```
This creates a NEW doc `cityResearch/lagos-mainland-lagos__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
