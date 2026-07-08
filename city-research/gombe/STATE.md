# Gombe State — State Data Research Skill

> Slug: `gombe` · Capital: Gombe · Region: North East · Cities in app: 11 (1 with full profiles)

Purpose: research CURRENT state-level facts for Gombe and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~45% (estimate)
- Electricity DisCo: Jos DisCo (JED)
- Key industries: Agriculture & livestock, Cross-border trade

## What to research — specifically for Gombe State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Gombe state budget 2026", "Gombe state governor news", "Gombe state security", "Gombe state road project".

## Cities of Gombe in the app (each has its own skill folder here)
- `akko-gombe` — Akko
- `gombe-gombe` — Gombe (capital)
- `yamaltu-deba-gombe` — Yamaltu/Deba
- `funakaye-gombe` — Funakaye
- `balanga-gombe` — Balanga
- `dukku-gombe` — Dukku
- `billiri-gombe` — Billiri
- `kwami-gombe` — Kwami
- `kaltungo-gombe` — Kaltungo
- `shomgom-gombe` — Shomgom
- `nafada-gombe` — Nafada

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state gombe <path-to-json>
```
Creates a NEW doc `stateResearch/gombe__<timestamp>`; older snapshots stay (history).
