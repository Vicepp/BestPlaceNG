# Ekiti State — State Data Research Skill

> Slug: `ekiti` · Capital: Ado-Ekiti · Region: South West · Cities in app: 16 (1 with full profiles)

Purpose: research CURRENT state-level facts for Ekiti and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~89% (estimate)
- Electricity DisCo: Benin DisCo (BEDC)
- Key industries: Agriculture (cocoa, cassava), Trade, Manufacturing

## What to research — specifically for Ekiti State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Ekiti state budget 2026", "Ekiti state governor news", "Ekiti state security", "Ekiti state road project".

## Cities of Ekiti in the app (each has its own skill folder here)
- `ado-ekiti-ekiti` — Ado-Ekiti (capital)
- `ijero-ekiti` — Ijero
- `ekiti-west-ekiti` — Ekiti West
- `ikole-ekiti` — Ikole
- `ekiti-south-west-ekiti` — Ekiti South West
- `ido-osi-ekiti` — Ido-Osi
- `ikere-ekiti` — Ikere
- `aiyekire-gbonyin-ekiti` — Aiyekire (Gbonyin)
- `moba-ekiti` — Moba
- `ekiti-east-ekiti` — Ekiti East
- `oye-ekiti` — Oye
- `irepodun-ifelodun-ekiti` — Irepodun/Ifelodun
- `ise-orun-ekiti` — Ise/Orun
- `emure-ekiti` — Emure
- `efon-ekiti` — Efon
- `ilejemeje-ekiti` — Ilejemeje

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state ekiti <path-to-json>
```
Creates a NEW doc `stateResearch/ekiti__<timestamp>`; older snapshots stay (history).
