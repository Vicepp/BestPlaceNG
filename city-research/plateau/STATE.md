# Plateau State — State Data Research Skill

> Slug: `plateau` · Capital: Jos · Region: North Central · Cities in app: 15 (1 with full profiles)

Purpose: research CURRENT state-level facts for Plateau and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~72% (estimate)
- Electricity DisCo: Jos DisCo (JED)
- Key industries: Agriculture (potatoes, vegetables), Mining heritage (tin), Tourism

## What to research — specifically for Plateau State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Plateau state budget 2026", "Plateau state governor news", "Plateau state security", "Plateau state road project".

## Cities of Plateau in the app (each has its own skill folder here)
- `jos-plateau` — Jos (capital)
- `mangu-plateau` — Mangu
- `shendam-plateau` — Shendam
- `quaan-pan-plateau` — Quaan Pan
- `pankshin-plateau` — Pankshin
- `barkin-ladi-plateau` — Barkin Ladi
- `bokkos-plateau` — Bokkos
- `kanam-plateau` — Kanam
- `wase-plateau` — Wase
- `langtang-north-plateau` — Langtang North
- `riyom-plateau` — Riyom
- `bassa-plateau` — Bassa
- `kanke-plateau` — Kanke
- `langtang-south-plateau` — Langtang South
- `mikang-plateau` — Mikang

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state plateau <path-to-json>
```
Creates a NEW doc `stateResearch/plateau__<timestamp>`; older snapshots stay (history).
