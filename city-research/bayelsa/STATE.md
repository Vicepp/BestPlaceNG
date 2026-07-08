# Bayelsa State — State Data Research Skill

> Slug: `bayelsa` · Capital: Yenagoa · Region: South South · Cities in app: 8 (1 with full profiles)

Purpose: research CURRENT state-level facts for Bayelsa and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~86% (estimate)
- Electricity DisCo: Port Harcourt DisCo (PHED)
- Key industries: Oil & gas, Agriculture (oil palm), Fishing & maritime

## What to research — specifically for Bayelsa State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Bayelsa state budget 2026", "Bayelsa state governor news", "Bayelsa state security", "Bayelsa state road project".

## Cities of Bayelsa in the app (each has its own skill folder here)
- `yenagoa-bayelsa` — Yenagoa (capital)
- `southern-ijaw-bayelsa` — Southern Ijaw
- `ekeremor-bayelsa` — Ekeremor
- `sagbama-bayelsa` — Sagbama
- `brass-bayelsa` — Brass
- `ogbia-bayelsa` — Ogbia
- `nembe-bayelsa` — Nembe
- `kolokuma-opokuma-bayelsa` — Kolokuma/Opokuma

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state bayelsa <path-to-json>
```
Creates a NEW doc `stateResearch/bayelsa__<timestamp>`; older snapshots stay (history).
