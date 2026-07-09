# Garum Mallam (Kano State) — City Data Research Skill

> Slug: `garum-mallam-kano` · LGA: Garun Mallam · Region: North West · Tier: lga

Purpose: replace generalised estimates about Garum Mallam with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 220,943 (2026 est.), growth 3.2%/yr, rank #519
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Kano DisCo (KEDCO)

## What to research — specifically for Garum Mallam
Prioritise recent (last 6 months) sources that name Garum Mallam or Garun Mallam LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Garum Mallam |
|---|---|
| overview | The one-paragraph "state of Garum Mallam right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Garum Mallam/Garun Mallam last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Garum Mallam |
| jobs | Who is actually hiring in Garum Mallam; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Garum Mallam schools |
| education-stats | Enrollment/literacy news for Kano affecting Garum Mallam |
| economy | New businesses, factories, closures; Garum Mallam's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Garum Mallam |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Garum Mallam |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Garum Mallam now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Kano DisCo (KEDCO); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Garum Mallam's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Garum Mallam's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Garum Mallam rent 2026", "Garum Mallam Kano news", "Garum Mallam electricity light", "Garum Mallam road construction", "Garum Mallam market prices", "Garum Mallam new estate", "Garum Mallam hospital".

## Tone & distribution (IMPORTANT)
This is a relocation guide, not a news site. Write for someone deciding whether to
LIVE in Garum Mallam: rents, prices, power hours, commutes, schools, day-to-day life.
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
  "headline": "one-sentence summary of the situation in Garum Mallam right now",
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
node scripts/append-research.mjs city garum-mallam-kano <path-to-json>
```
This creates a NEW doc `cityResearch/garum-mallam-kano__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
