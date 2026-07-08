# Sokoto State — State Data Research Skill

> Slug: `sokoto` · Capital: Sokoto · Region: North West · Cities in app: 22 (1 with full profiles)

Purpose: research CURRENT state-level facts for Sokoto and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~33% (estimate)
- Electricity DisCo: Kaduna Electric
- Key industries: Agriculture (grains, cotton), Livestock, Trade

## What to research — specifically for Sokoto State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Sokoto state budget 2026", "Sokoto state governor news", "Sokoto state security", "Sokoto state road project".

## Cities of Sokoto in the app (each has its own skill folder here)
- `sokoto-sokoto` — Sokoto (capital)
- `gada-sokoto` — Gada
- `gwadabawa-sokoto` — Gwadabawa
- `tambuwal-sokoto` — Tambuwal
- `sabon-birni-sokoto` — Sabon Birni
- `dange-shuni-sokoto` — Dange Shuni
- `goronyo-sokoto` — Goronyo
- `wamakko-sokoto` — Wamakko
- `bodinga-sokoto` — Bodinga
- `wurno-sokoto` — Wurno
- `shagari-sokoto` — Shagari
- `isa-sokoto` — Isa
- `illela-sokoto` — Illela
- `rabah-sokoto` — Rabah
- `kware-sokoto` — Kware
- `kebbe-sokoto` — Kebbe
- `yabo-sokoto` — Yabo
- `tangaza-sokoto` — Tangaza
- `silame-sokoto` — Silame
- `binji-sokoto` — Binji
- `gudu-sokoto` — Gudu
- `tureta-sokoto` — Tureta

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state sokoto <path-to-json>
```
Creates a NEW doc `stateResearch/sokoto__<timestamp>`; older snapshots stay (history).
