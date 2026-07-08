# Ebonyi State — State Data Research Skill

> Slug: `ebonyi` · Capital: Abakaliki · Region: South East · Cities in app: 13 (1 with full profiles)

Purpose: research CURRENT state-level facts for Ebonyi and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~78% (estimate)
- Electricity DisCo: Enugu DisCo (EEDC)
- Key industries: Trade & SMEs, Manufacturing, Agriculture

## What to research — specifically for Ebonyi State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Ebonyi state budget 2026", "Ebonyi state governor news", "Ebonyi state security", "Ebonyi state road project".

## Cities of Ebonyi in the app (each has its own skill folder here)
- `izzi-ebonyi` — Izzi
- `onicha-ebonyi` — Onicha
- `ikwo-ebonyi` — Ikwo
- `ohaukwu-ebonyi` — Ohaukwu
- `afikpo-south-ebonyi` — Afikpo South
- `afikpo-north-ebonyi` — Afikpo North
- `ishielu-ebonyi` — Ishielu
- `abakaliki-ebonyi` — Abakaliki (capital)
- `ohaozara-ebonyi` — Ohaozara
- `ezza-north-ebonyi` — Ezza North
- `ezza-south-ebonyi` — Ezza South
- `ebonyi-ebonyi` — Ebonyi
- `ivo-ebonyi` — Ivo

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state ebonyi <path-to-json>
```
Creates a NEW doc `stateResearch/ebonyi__<timestamp>`; older snapshots stay (history).
