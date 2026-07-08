# Adamawa State — State Data Research Skill

> Slug: `adamawa` · Capital: Yola · Region: North East · Cities in app: 20 (1 with full profiles)

Purpose: research CURRENT state-level facts for Adamawa and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~55% (estimate)
- Electricity DisCo: Yola DisCo (YEDC)
- Key industries: Agriculture & livestock, Cross-border trade

## What to research — specifically for Adamawa State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Adamawa state budget 2026", "Adamawa state governor news", "Adamawa state security", "Adamawa state road project".

## Cities of Adamawa in the app (each has its own skill folder here)
- `yola-adamawa` — Yola (capital)
- `fufore-adamawa` — Fufore
- `song-adamawa` — Song
- `demsa-adamawa` — Demsa
- `guyuk-adamawa` — Guyuk
- `ganye-adamawa` — Ganye
- `hong-adamawa` — Hong
- `jada-adamawa` — Jada
- `michika-adamawa` — Michika
- `mayo-belwa-adamawa` — Mayo-Belwa
- `mubi-north-adamawa` — Mubi North
- `shelleng-adamawa` — Shelleng
- `gombi-adamawa` — Gombi
- `madagali-adamawa` — Madagali
- `mubi-south-adamawa` — Mubi South
- `girei-adamawa` — Girei
- `lamurde-adamawa` — Lamurde
- `maiha-adamawa` — Maiha
- `numan-adamawa` — Numan
- `toungo-adamawa` — Toungo

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state adamawa <path-to-json>
```
Creates a NEW doc `stateResearch/adamawa__<timestamp>`; older snapshots stay (history).
