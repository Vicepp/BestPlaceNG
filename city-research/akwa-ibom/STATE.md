# Akwa Ibom State — State Data Research Skill

> Slug: `akwa-ibom` · Capital: Uyo · Region: South South · Cities in app: 31 (1 with full profiles)

Purpose: research CURRENT state-level facts for Akwa Ibom and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~89% (estimate)
- Electricity DisCo: Port Harcourt DisCo (PHED)
- Key industries: Oil & gas, Aviation (Ibom Air), Agriculture

## What to research — specifically for Akwa Ibom State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Akwa Ibom state budget 2026", "Akwa Ibom state governor news", "Akwa Ibom state security", "Akwa Ibom state road project".

## Cities of Akwa Ibom in the app (each has its own skill folder here)
- `uyo-akwa-ibom` — Uyo (capital)
- `essien-udim-akwa-ibom` — Essien Udim
- `ibiono-ibom-akwa-ibom` — Ibiono Ibom
- `mkpat-enin-akwa-ibom` — Mkpat Enin
- `eket-akwa-ibom` — Eket
- `oruk-anam-akwa-ibom` — Oruk Anam
- `etinan-akwa-ibom` — Etinan
- `obot-akara-akwa-ibom` — Obot Akara
- `ikot-ekpene-akwa-ibom` — Ikot Ekpene
- `abak-akwa-ibom` — Abak
- `ibesikpo-asutan-akwa-ibom` — Ibesikpo Asutan
- `ikot-abasi-akwa-ibom` — Ikot Abasi
- `ikono-akwa-ibom` — Ikono
- `itu-akwa-ibom` — Itu
- `nsit-ubium-akwa-ibom` — Nsit Ubium
- `ukanafun-akwa-ibom` — Ukanafun
- `onna-akwa-ibom` — Onna
- `uruan-akwa-ibom` — Uruan
- `nsit-ibom-akwa-ibom` — Nsit Ibom
- `etim-ekpo-akwa-ibom` — Etim Ekpo
- `okobo-akwa-ibom` — Okobo
- `mbo-akwa-ibom` — Mbo
- `ini-akwa-ibom` — Ini
- `oron-akwa-ibom` — Oron
- `ibeno-akwa-ibom` — Ibeno
- `nsit-atai-akwa-ibom` — Nsit Atai
- `ika-akwa-ibom` — Ika
- `urue-offong-oruko-akwa-ibom` — Urue-Offong/Oruko
- `esit-eket-akwa-ibom` — Esit Eket
- `eastern-obolo-akwa-ibom` — Eastern Obolo
- `udung-uko-akwa-ibom` — Udung Uko

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state akwa-ibom <path-to-json>
```
Creates a NEW doc `stateResearch/akwa-ibom__<timestamp>`; older snapshots stay (history).
