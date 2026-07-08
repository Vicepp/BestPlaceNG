# Ondo State — State Data Research Skill

> Slug: `ondo` · Capital: Akure · Region: South West · Cities in app: 17 (2 with full profiles)

Purpose: research CURRENT state-level facts for Ondo and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~85% (estimate)
- Electricity DisCo: Benin DisCo (BEDC)
- Key industries: Agriculture (cocoa, cassava), Trade, Manufacturing

## What to research — specifically for Ondo State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Ondo state budget 2026", "Ondo state governor news", "Ondo state security", "Ondo state road project".

## Cities of Ondo in the app (each has its own skill folder here)
- `ondo-ondo` — Ondo
- `akure-ondo` — Akure (capital)
- `ilaje-ondo` — Ilaje
- `okitipupa-ondo` — Okitipupa
- `odigbo-ondo` — Odigbo
- `akoko-south-west-ondo` — Akoko South West
- `owo-ondo` — Owo
- `akoko-north-west-ondo` — Akoko North West
- `akoko-north-east-ondo` — Akoko North East
- `ifedore-ondo` — Ifedore
- `ile-oluji-okeigbo-ondo` — Ile-Oluji-Okeigbo
- `ese-odo-ondo` — Ese-Odo
- `irele-ondo` — Irele
- `ose-ondo` — Ose
- `akure-north-ondo` — Akure North
- `idanre-ondo` — Idanre
- `akoko-south-east-ondo` — Akoko South East

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state ondo <path-to-json>
```
Creates a NEW doc `stateResearch/ondo__<timestamp>`; older snapshots stay (history).
