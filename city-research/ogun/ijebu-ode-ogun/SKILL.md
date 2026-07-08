# Ijebu Ode (Ogun State) — City Data Research Skill

> Slug: `ijebu-ode-ogun` · LGA: Ijebu Ode · Region: South West · Tier: lga

Purpose: replace generalised estimates about Ijebu Ode with CURRENT, city-specific,
sourced data — and APPEND it to the database as a new dated snapshot (never
overwrite; the site keeps full history).

## Current baseline in the app (what your research improves on)
- Population: 305,255 (2026 est.), growth 3.4%/yr, rank #313
- Rent: no city-specific research yet — currently estimated from the state reference city. YOUR RESEARCH FIXES THIS.
- Grid power: no city-specific figure yet (tier default used), DisCo: Ibadan DisCo (IBEDC)

## What to research — specifically for Ijebu Ode
Prioritise recent (last 6 months) sources that name Ijebu Ode or Ijebu Ode LGA directly.
Cover EVERY section of the city's page — one finding per section where the web has
anything city-specific (omit a section honestly if nothing local exists):

| Section | What to find for Ijebu Ode |
|---|---|
| overview | The one-paragraph "state of Ijebu Ode right now" — what changed this year |
| cost-of-living | Current everyday costs residents quote (food, transport, services) |
| crime | Incidents/trend in Ijebu Ode/Ijebu Ode last 6 months; which areas feel safe |
| apartments | Current annual rent in 2–3 named areas (self-con/1-bed/2-bed/3-bed); supply/demand |
| climate / weather | Recent flooding, heatwaves, or seasonal disruption affecting Ijebu Ode |
| jobs | Who is actually hiring in Ijebu Ode; local salary anecdotes |
| school-ratings | Notable schools opened/closed; WAEC/results news naming Ijebu Ode schools |
| education-stats | Enrollment/literacy news for Ogun affecting Ijebu Ode |
| economy | New businesses, factories, closures; Ijebu Ode's trade pulse |
| health | Hospital/PHC openings, upgrades, strikes affecting care in Ijebu Ode |
| religion | Major congregations/events shaping the city's rhythm |
| people-stats | Migration in/out, population pressure, demographic shifts reported |
| politics-voting | LGA chairmanship, state/federal projects landing in Ijebu Ode |
| housing-stats | New estates under construction; land/home price movement |
| commute-time | Current traffic reality; new routes; fare changes |
| internet | Strongest network in Ijebu Ode now; fibre/5G rollout news |
| electricity | Actual daily hours residents report on Ibadan DisCo (IBEDC); band/feeder news |
| transportation | Fares (danfo/keke/okada), fuel availability, new BRT/rail/ferry service |
| hotels | New hotels/notable closures; typical room rates |
| events | Recurring festivals/events that define Ijebu Ode's calendar |
| road-condition | Specific roads under repair or failing; flood-prone spots |
| market | Ijebu Ode's main market(s): staples basket prices (rice 50kg, garri, gas 12.5kg) |
| shopping-malls | Mall openings/closures/anchor changes |
| police-stations | Division news, new posts, emergency contact changes |

Search hints: "Ijebu Ode rent 2026", "Ijebu Ode Ogun news", "Ijebu Ode electricity light", "Ijebu Ode road construction", "Ijebu Ode market prices", "Ijebu Ode new estate", "Ijebu Ode hospital".

## How to save (APPEND-ONLY — never overwrite)
1. Compose a snapshot JSON. `sections` is keyed by the section slugs above — include
   ONLY sections where you found something city-specific; every claim needs a source:
```json
{
  "headline": "one-sentence summary of the situation in Ijebu Ode right now",
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
node scripts/append-research.mjs city ijebu-ode-ogun <path-to-json>
```
This creates a NEW doc `cityResearch/ijebu-ode-ogun__<timestamp>` — previous snapshots remain untouched (historical record). The city page and the AI assistant pick up the latest snapshot automatically.
