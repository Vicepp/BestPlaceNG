# Katsina State — State Data Research Skill

> Slug: `katsina` · Capital: Katsina · Region: North West · Cities in app: 34 (1 with full profiles)

Purpose: research CURRENT state-level facts for Katsina and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~42% (estimate)
- Electricity DisCo: Kano DisCo (KEDCO)
- Key industries: Agriculture (grains, cotton), Livestock, Trade

## What to research — specifically for Katsina State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Katsina state budget 2026", "Katsina state governor news", "Katsina state security", "Katsina state road project".

## Cities of Katsina in the app (each has its own skill folder here)
- `katsina-katsina` — Katsina (capital)
- `kankara-katsina` — Kankara
- `funtua-katsina` — Funtua
- `daura-katsina` — Daura
- `kafur-katsina` — Kafur
- `batsari-katsina` — Batsari
- `baure-katsina` — Baure
- `maiadua-katsina` — Maiadua
- `faskari-katsina` — Faskari
- `batagarawa-katsina` — Batagarawa
- `safana-katsina` — Safana
- `malumfashi-katsina` — Malumfashi
- `kaita-katsina` — Kaita
- `mani-katsina` — Mani
- `mashi-katsina` — Mashi
- `musawa-katsina` — Musawa
- `dutsin-ma-katsina` — Dutsin-Ma
- `ingawa-katsina` — Ingawa
- `jibia-katsina` — Jibia
- `zango-katsina` — Zango
- `rimi-katsina` — Rimi
- `kankia-katsina` — Kankia
- `bindawa-katsina` — Bindawa
- `bakori-katsina` — Bakori
- `dandume-katsina` — Dandume
- `sabuwa-katsina` — Sabuwa
- `charanchi-katsina` — Charanchi
- `sandamu-katsina` — Sandamu
- `danja-katsina` — Danja
- `dutsi-katsina` — Dutsi
- `kurfi-katsina` — Kurfi
- `matazu-katsina` — Matazu
- `dan-musa-katsina` — Dan Musa
- `kusada-katsina` — Kusada

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state katsina <path-to-json>
```
Creates a NEW doc `stateResearch/katsina__<timestamp>`; older snapshots stay (history).
