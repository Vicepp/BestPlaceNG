# Bauchi State — State Data Research Skill

> Slug: `bauchi` · Capital: Bauchi · Region: North East · Cities in app: 20 (1 with full profiles)

Purpose: research CURRENT state-level facts for Bauchi and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~40% (estimate)
- Electricity DisCo: Jos DisCo (JED)
- Key industries: Agriculture & livestock, Cross-border trade

## What to research — specifically for Bauchi State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Bauchi state budget 2026", "Bauchi state governor news", "Bauchi state security", "Bauchi state road project".

## Cities of Bauchi in the app (each has its own skill folder here)
- `bauchi-bauchi` — Bauchi (capital)
- `ningi-bauchi` — Ningi
- `toro-bauchi` — Toro
- `alkaleri-bauchi` — Alkaleri
- `katagum-bauchi` — Katagum
- `gamawa-bauchi` — Gamawa
- `ganjuwa-bauchi` — Ganjuwa
- `misau-bauchi` — Misau
- `darazo-bauchi` — Darazo
- `shira-bauchi` — Shira
- `itas-gadau-bauchi` — Itas/Gadau
- `tafawa-balewa-bauchi` — Tafawa-Balewa
- `zaki-bauchi` — Zaki
- `giade-bauchi` — Giade
- `damban-bauchi` — Damban
- `kirfi-bauchi` — Kirfi
- `jamaare-bauchi` — Jamaare
- `warji-bauchi` — Warji
- `dass-bauchi` — Dass
- `bogoro-bauchi` — Bogoro

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state bauchi <path-to-json>
```
Creates a NEW doc `stateResearch/bauchi__<timestamp>`; older snapshots stay (history).
