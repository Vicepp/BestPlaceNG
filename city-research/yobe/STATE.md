# Yobe State — State Data Research Skill

> Slug: `yobe` · Capital: Damaturu · Region: North East · Cities in app: 17 (1 with full profiles)

Purpose: research CURRENT state-level facts for Yobe and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~32% (estimate)
- Electricity DisCo: Yola DisCo (YEDC)
- Key industries: Agriculture & livestock, Cross-border trade

## What to research — specifically for Yobe State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Yobe state budget 2026", "Yobe state governor news", "Yobe state security", "Yobe state road project".

## Cities of Yobe in the app (each has its own skill folder here)
- `fune-yobe` — Fune
- `jakusko-yobe` — Jakusko
- `potiskum-yobe` — Potiskum
- `geidam-yobe` — Geidam
- `nguru-yobe` — Nguru
- `bade-yobe` — Bade
- `fika-yobe` — Fika
- `gujba-yobe` — Gujba
- `yunusari-yobe` — Yunusari
- `yusufari-yobe` — Yusufari
- `bursari-yobe` — Bursari
- `karasuwa-yobe` — Karasuwa
- `gulani-yobe` — Gulani
- `damaturu-yobe` — Damaturu (capital)
- `nangere-yobe` — Nangere
- `tarmua-yobe` — Tarmua
- `machina-yobe` — Machina

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state yobe <path-to-json>
```
Creates a NEW doc `stateResearch/yobe__<timestamp>`; older snapshots stay (history).
