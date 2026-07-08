# Cross River State — State Data Research Skill

> Slug: `cross-river` · Capital: Calabar · Region: South South · Cities in app: 17 (1 with full profiles)

Purpose: research CURRENT state-level facts for Cross River and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~87% (estimate)
- Electricity DisCo: Port Harcourt DisCo (PHED)
- Key industries: Tourism & hospitality, Agriculture (cocoa), Trade

## What to research — specifically for Cross River State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Cross River state budget 2026", "Cross River state governor news", "Cross River state security", "Cross River state road project".

## Cities of Cross River in the app (each has its own skill folder here)
- `calabar-cross-river` — Calabar (capital)
- `akpabuyo-cross-river` — Akpabuyo
- `yala-cross-river` — Yala
- `yakurr-cross-river` — Yakurr
- `odukpani-cross-river` — Odukpani
- `boki-cross-river` — Boki
- `obubra-cross-river` — Obubra
- `ogoja-cross-river` — Ogoja
- `biase-cross-river` — Biase
- `ikom-cross-river` — Ikom
- `obudu-cross-river` — Obudu
- `akamkpa-cross-river` — Akamkpa
- `abi-cross-river` — Abi
- `obanliku-cross-river` — Obanliku
- `bekwara-cross-river` — Bekwara
- `etung-cross-river` — Etung
- `bakassi-cross-river` — Bakassi

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state cross-river <path-to-json>
```
Creates a NEW doc `stateResearch/cross-river__<timestamp>`; older snapshots stay (history).
