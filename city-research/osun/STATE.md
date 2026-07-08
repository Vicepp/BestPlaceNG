# Osun State — State Data Research Skill

> Slug: `osun` · Capital: Osogbo · Region: South West · Cities in app: 27 (2 with full profiles)

Purpose: research CURRENT state-level facts for Osun and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~87% (estimate)
- Electricity DisCo: Ibadan DisCo (IBEDC)
- Key industries: Agriculture (cocoa, cassava), Trade, Manufacturing

## What to research — specifically for Osun State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Osun state budget 2026", "Osun state governor news", "Osun state security", "Osun state road project".

## Cities of Osun in the app (each has its own skill folder here)
- `ife-osun` — Ife
- `ifelodun-osun` — Ifelodun
- `iwo-osun` — Iwo
- `irepodun-osun` — Irepodun
- `osogbo-osun` — Osogbo (capital)
- `aiyedaade-osun` — Aiyedaade
- `oriade-osun` — Oriade
- `irewole-osun` — Irewole
- `boripe-osun` — Boripe
- `ejigbo-osun` — Ejigbo
- `odo-otin-osun` — Odo-Otin
- `olorunda-osun` — Olorunda
- `obokun-osun` — Obokun
- `ilesha-west-osun` — Ilesha West
- `ilesha-east-osun` — Ilesha East
- `orolu-osun` — Orolu
- `isokan-osun` — Isokan
- `ede-north-osun` — Ede North
- `aiyedire-osun` — Aiyedire
- `ola-oluwa-osun` — Ola-Oluwa
- `atakunmosa-east-osun` — Atakunmosa East
- `ede-south-osun` — Ede South
- `egbedore-osun` — Egbedore
- `boluwaduro-osun` — Boluwaduro
- `atakunmosa-west-osun` — Atakunmosa West
- `ila-osun` — Ila
- `ifedayo-osun` — Ifedayo

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state osun <path-to-json>
```
Creates a NEW doc `stateResearch/osun__<timestamp>`; older snapshots stay (history).
