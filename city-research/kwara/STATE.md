# Kwara State — State Data Research Skill

> Slug: `kwara` · Capital: Ilorin · Region: North Central · Cities in app: 14 (1 with full profiles)

Purpose: research CURRENT state-level facts for Kwara and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~75% (estimate)
- Electricity DisCo: Ibadan DisCo (IBEDC)
- Key industries: Agriculture, Education, Services

## What to research — specifically for Kwara State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Kwara state budget 2026", "Kwara state governor news", "Kwara state security", "Kwara state road project".

## Cities of Kwara in the app (each has its own skill folder here)
- `ilorin-kwara` — Ilorin (capital)
- `baruten-kwara` — Baruten
- `edu-kwara` — Edu
- `asa-kwara` — Asa
- `kaiama-kwara` — Kaiama
- `pategi-kwara` — Pategi
- `moro-kwara` — Moro
- `irepodun-kwara` — Irepodun
- `oyun-kwara` — Oyun
- `offa-kwara` — Offa
- `ifelodun-kwara` — Ifelodun
- `isin-kwara` — Isin
- `oke-ero-kwara` — Oke-Ero
- `ekiti-kwara` — Ekiti

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state kwara <path-to-json>
```
Creates a NEW doc `stateResearch/kwara__<timestamp>`; older snapshots stay (history).
