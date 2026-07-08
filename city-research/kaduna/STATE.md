# Kaduna State — State Data Research Skill

> Slug: `kaduna` · Capital: Kaduna · Region: North West · Cities in app: 24 (2 with full profiles)

Purpose: research CURRENT state-level facts for Kaduna and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~62% (estimate)
- Electricity DisCo: Kaduna Electric
- Key industries: Agriculture (ginger, maize), Manufacturing, Defence & aviation institutions, Education

## What to research — specifically for Kaduna State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Kaduna state budget 2026", "Kaduna state governor news", "Kaduna state security", "Kaduna state road project".

## Cities of Kaduna in the app (each has its own skill folder here)
- `kaduna-kaduna` — Kaduna (capital)
- `igabi-kaduna` — Igabi
- `zaria-kaduna` — Zaria
- `kaduna-south-kaduna` — Kaduna South
- `chikun-kaduna` — Chikun
- `kaduna-north-kaduna` — Kaduna North
- `lere-kaduna` — Lere
- `zangon-kataf-kaduna` — Zangon-Kataf
- `giwa-kaduna` — Giwa
- `sabon-gari-kaduna` — Sabon-Gari
- `soba-kaduna` — Soba
- `kubau-kaduna` — Kubau
- `jemaa-kaduna` — Jemaa
- `birnin-gwari-kaduna` — Birnin-Gwari
- `kachia-kaduna` — Kachia
- `kagarko-kaduna` — Kagarko
- `kauru-kaduna` — Kauru
- `ikara-kaduna` — Ikara
- `kaura-kaduna` — Kaura
- `jaba-kaduna` — Jaba
- `sanga-kaduna` — Sanga
- `makarfi-kaduna` — Makarfi
- `kudan-kaduna` — Kudan
- `kajuru-kaduna` — Kajuru

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state kaduna <path-to-json>
```
Creates a NEW doc `stateResearch/kaduna__<timestamp>`; older snapshots stay (history).
