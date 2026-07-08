# Kebbi State — State Data Research Skill

> Slug: `kebbi` · Capital: Birnin Kebbi · Region: North West · Cities in app: 21 (1 with full profiles)

Purpose: research CURRENT state-level facts for Kebbi and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~35% (estimate)
- Electricity DisCo: Kaduna Electric
- Key industries: Agriculture (grains, cotton), Livestock, Trade

## What to research — specifically for Kebbi State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Kebbi state budget 2026", "Kebbi state governor news", "Kebbi state security", "Kebbi state road project".

## Cities of Kebbi in the app (each has its own skill folder here)
- `birnin-kebbi-kebbi` — Birnin Kebbi (capital)
- `wasagu-danko-kebbi` — Wasagu/Danko
- `bagudo-kebbi` — Bagudo
- `argungu-kebbi` — Argungu
- `jega-kebbi` — Jega
- `arewa-dandi-kebbi` — Arewa-Dandi
- `maiyama-kebbi` — Maiyama
- `zuru-kebbi` — Zuru
- `koko-besse-kebbi` — Koko/Besse
- `gwandu-kebbi` — Gwandu
- `suru-kebbi` — Suru
- `dandi-kebbi` — Dandi
- `shanga-kebbi` — Shanga
- `ngaski-kebbi` — Ngaski
- `bunza-kebbi` — Bunza
- `fakai-kebbi` — Fakai
- `augie-kebbi` — Augie
- `yauri-kebbi` — Yauri
- `sakaba-kebbi` — Sakaba
- `kalgo-kebbi` — Kalgo
- `aleiro-kebbi` — Aleiro

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state kebbi <path-to-json>
```
Creates a NEW doc `stateResearch/kebbi__<timestamp>`; older snapshots stay (history).
