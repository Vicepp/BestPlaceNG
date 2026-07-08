# Jigawa State — State Data Research Skill

> Slug: `jigawa` · Capital: Dutse · Region: North West · Cities in app: 27 (1 with full profiles)

Purpose: research CURRENT state-level facts for Jigawa and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~38% (estimate)
- Electricity DisCo: Kano DisCo (KEDCO)
- Key industries: Agriculture (grains, cotton), Livestock, Trade

## What to research — specifically for Jigawa State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Jigawa state budget 2026", "Jigawa state governor news", "Jigawa state security", "Jigawa state road project".

## Cities of Jigawa in the app (each has its own skill folder here)
- `birnin-kudu-jigawa` — Birnin Kudu
- `gwaram-jigawa` — Gwaram
- `kafin-hausa-jigawa` — Kafin Hausa
- `dutse-jigawa` — Dutse (capital)
- `jahun-jigawa` — Jahun
- `babura-jigawa` — Babura
- `kiri-kasama-jigawa` — Kiri Kasama
- `ringim-jigawa` — Ringim
- `maigatari-jigawa` — Maigatari
- `kiyawa-jigawa` — Kiyawa
- `malam-madori-jigawa` — Malam Madori
- `kazaure-jigawa` — Kazaure
- `garki-jigawa` — Garki
- `biriniwa-jigawa` — Biriniwa
- `sule-tankarkar-jigawa` — Sule Tankarkar
- `auyo-jigawa` — Auyo
- `taura-jigawa` — Taura
- `kaugama-jigawa` — Kaugama
- `gwiwa-jigawa` — Gwiwa
- `miga-jigawa` — Miga
- `guri-jigawa` — Guri
- `gumel-jigawa` — Gumel
- `hadejia-jigawa` — Hadejia
- `buji-jigawa` — Buji
- `yankwashi-jigawa` — Yankwashi
- `gagarawa-jigawa` — Gagarawa
- `roni-jigawa` — Roni

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state jigawa <path-to-json>
```
Creates a NEW doc `stateResearch/jigawa__<timestamp>`; older snapshots stay (history).
