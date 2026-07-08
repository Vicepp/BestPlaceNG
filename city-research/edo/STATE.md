# Edo State — State Data Research Skill

> Slug: `edo` · Capital: Benin City · Region: South South · Cities in app: 19 (1 with full profiles)

Purpose: research CURRENT state-level facts for Edo and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~90% (estimate)
- Electricity DisCo: Benin DisCo (BEDC)
- Key industries: Agriculture (rubber, oil palm), Trade, Education

## What to research — specifically for Edo State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Edo state budget 2026", "Edo state governor news", "Edo state security", "Edo state road project".

## Cities of Edo in the app (each has its own skill folder here)
- `benin-city-edo` — Benin City (capital)
- `oredo-edo` — Oredo
- `ikpoba-okha-edo` — Ikpoba-Okha
- `egor-edo` — Egor
- `akoko-edo-edo` — Akoko-Edo
- `etsako-west-edo` — Etsako West
- `orhionmwon-edo` — Orhionmwon
- `esan-south-east-edo` — Esan South East
- `ovia-north-east-edo` — Ovia North East
- `owan-east-edo` — Owan East
- `etsako-east-edo` — Etsako East
- `ovia-south-west-edo` — Ovia South West
- `esan-west-edo` — Esan West
- `esan-north-east-edo` — Esan North East
- `uhunmwonde-edo` — Uhunmwonde
- `esan-central-edo` — Esan Central
- `owan-west-edo` — Owan West
- `etsako-central-edo` — Etsako Central
- `igueben-edo` — Igueben

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state edo <path-to-json>
```
Creates a NEW doc `stateResearch/edo__<timestamp>`; older snapshots stay (history).
