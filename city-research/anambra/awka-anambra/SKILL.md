# Awka (Anambra State) — City Data Research Skill

> Slug: `awka-anambra` · LGA: Awka South · Region: South East · Tier: major · **Anambra State Capital**

Purpose: replace generalised estimates about Awka with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 470,047 (2026 est.), growth 2.2%/yr, rank #107
- Cost-of-living index: 90 (national avg = 100)
- Safety index: 79/100
- School rating: 6.8/10
- Researched annual rent (as of 2025): self-con ₦150,000, 1-bed ₦250,000, 2-bed ₦350,000, 3-bed ₦500,000, shop ₦300,000
- Avg grid power: ~10h/day (estimate), DisCo: Enugu DisCo (EEDC)

## What to research — specifically for Awka
Prioritise recent (last 6 months) sources that name Awka or Awka South LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Awka |
|---|---|
| overview | The one-paragraph "state of Awka right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Awka/Awka South last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Awka |
| jobs | Who is actually hiring in Awka; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Awka schools |
| education-stats | Enrollment/literacy news for Anambra affecting Awka |
| economy | New businesses, factories, closures; Awka's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Awka |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Awka |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Awka now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Enugu DisCo (EEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Awka's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Awka's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Awka rent 2026", "Awka Anambra news", "Awka electricity light", "Awka road construction", "Awka market prices", "Awka new estate", "Awka hospital".

## Tone & distribution (IMPORTANT)
This is a relocation guide, not a news site. Write for someone deciding whether to
LIVE in Awka: rents, prices, power hours, commutes, schools, day-to-day life.
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
  "headline": "one-sentence summary of the situation in Awka right now",
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
node scripts/append-research.mjs city awka-anambra <path-to-json>
```
This creates a NEW doc `cityResearch/awka-anambra__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
