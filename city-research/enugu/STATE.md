# Enugu State — State Data Research Skill

> Slug: `enugu` · Capital: Enugu · Region: South East · Cities in app: 15 (1 with full profiles)

Purpose: research CURRENT state-level facts for Enugu and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~88% (estimate)
- Electricity DisCo: Enugu DisCo (EEDC)
- Key industries: Trade, Education, Hospitality, Tech (growing hub)

## What to research — specifically for Enugu State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Enugu state budget 2026", "Enugu state governor news", "Enugu state security", "Enugu state road project".

## Cities of Enugu in the app (each has its own skill folder here)
- `enugu-enugu` — Enugu (capital)
- `nsukka-enugu` — Nsukka
- `igbo-eze-north-enugu` — Igbo-Eze North
- `udi-enugu` — Udi
- `igbo-etiti-enugu` — Igbo-Etiti
- `awgu-enugu` — Awgu
- `udenu-enugu` — Udenu
- `ezeagu-enugu` — Ezeagu
- `nkanu-east-enugu` — Nkanu East
- `isi-uzo-enugu` — Isi-Uzo
- `igbo-eze-south-enugu` — Igbo-Eze South
- `nkanu-west-enugu` — Nkanu West
- `aninri-enugu` — Aninri
- `oji-river-enugu` — Oji-River
- `uzo-uwani-enugu` — Uzo-Uwani

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state enugu <path-to-json>
```
Creates a NEW doc `stateResearch/enugu__<timestamp>`; older snapshots stay (history).
