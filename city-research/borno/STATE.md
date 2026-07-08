# Borno State — State Data Research Skill

> Slug: `borno` · Capital: Maiduguri · Region: North East · Cities in app: 27 (1 with full profiles)

Purpose: research CURRENT state-level facts for Borno and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~38% (estimate)
- Electricity DisCo: Yola DisCo (YEDC)
- Key industries: Agriculture & livestock, Cross-border trade (reviving)

## What to research — specifically for Borno State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Borno state budget 2026", "Borno state governor news", "Borno state security", "Borno state road project".

## Cities of Borno in the app (each has its own skill folder here)
- `maiduguri-borno` — Maiduguri (capital)
- `gwoza-borno` — Gwoza
- `bama-borno` — Bama
- `ngala-borno` — Ngala
- `damboa-borno` — Damboa
- `jere-borno` — Jere
- `kukawa-borno` — Kukawa
- `biu-borno` — Biu
- `konduga-borno` — Konduga
- `gubio-borno` — Gubio
- `askira-uba-borno` — Askira/Uba
- `magumeri-borno` — Magumeri
- `marte-borno` — Marte
- `hawul-borno` — Hawul
- `mobbar-borno` — Mobbar
- `monguno-borno` — Monguno
- `dikwa-borno` — Dikwa
- `mafa-borno` — Mafa
- `shani-borno` — Shani
- `abadam-borno` — Abadam
- `nganzai-borno` — Nganzai
- `guzamala-borno` — Guzamala
- `kaga-borno` — Kaga
- `bayo-borno` — Bayo
- `chibok-borno` — Chibok
- `kala-balge-borno` — Kala/Balge
- `kwaya-kusar-borno` — Kwaya Kusar

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state borno <path-to-json>
```
Creates a NEW doc `stateResearch/borno__<timestamp>`; older snapshots stay (history).
