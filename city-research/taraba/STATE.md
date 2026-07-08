# Taraba State — State Data Research Skill

> Slug: `taraba` · Capital: Jalingo · Region: North East · Cities in app: 16 (1 with full profiles)

Purpose: research CURRENT state-level facts for Taraba and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~52% (estimate)
- Electricity DisCo: Yola DisCo (YEDC)
- Key industries: Agriculture & livestock, Cross-border trade

## What to research — specifically for Taraba State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Taraba state budget 2026", "Taraba state governor news", "Taraba state security", "Taraba state road project".

## Cities of Taraba in the app (each has its own skill folder here)
- `gassol-taraba` — Gassol
- `wukari-taraba` — Wukari
- `sardauna-taraba` — Sardauna
- `bali-taraba` — Bali
- `karim-lamido-taraba` — Karim-Lamido
- `jalingo-taraba` — Jalingo (capital)
- `takum-taraba` — Takum
- `donga-taraba` — Donga
- `zing-taraba` — Zing
- `lau-taraba` — Lau
- `kurmi-taraba` — Kurmi
- `ussa-taraba` — Ussa
- `yorro-taraba` — Yorro
- `ardo-kola-taraba` — Ardo-Kola
- `gashaka-taraba` — Gashaka
- `ibi-taraba` — Ibi

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state taraba <path-to-json>
```
Creates a NEW doc `stateResearch/taraba__<timestamp>`; older snapshots stay (history).
