# Oyo State — State Data Research Skill

> Slug: `oyo` · Capital: Ibadan · Region: South West · Cities in app: 31 (3 with full profiles)

Purpose: research CURRENT state-level facts for Oyo and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~82% (estimate)
- Electricity DisCo: Ibadan DisCo (IBEDC)
- Key industries: Agriculture, Education & research, Trade, Agro-processing

## What to research — specifically for Oyo State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Oyo state budget 2026", "Oyo state governor news", "Oyo state security", "Oyo state road project".

## Cities of Oyo in the app (each has its own skill folder here)
- `ibadan-oyo` — Ibadan (capital)
- `ibadan-north-east-oyo` — Ibadan North East
- `ibadan-north-oyo` — Ibadan North
- `ogbomosho-oyo` — Ogbomosho
- `egbeda-oyo` — Egbeda
- `ibadan-south-west-oyo` — Ibadan South West
- `saki-west-oyo` — Saki West
- `ibadan-south-east-oyo` — Ibadan South East
- `ona-ara-oyo` — Ona-Ara
- `oyo-oyo` — Oyo
- `iseyin-oyo` — Iseyin
- `akinyele-oyo` — Akinyele
- `oluyole-oyo` — Oluyole
- `kajola-oyo` — Kajola
- `atiba-oyo` — Atiba
- `ibadan-north-west-oyo` — Ibadan North West
- `ori-ire-oyo` — Ori Ire
- `lagelu-oyo` — Lagelu
- `afijio-oyo` — Afijio
- `itesiwaju-oyo` — Itesiwaju
- `irepo-oyo` — Irepo
- `ibarapa-east-oyo` — Ibarapa East
- `atisbo-oyo` — Atisbo
- `saki-east-oyo` — Saki East
- `ido-oyo` — Ido
- `orelope-oyo` — Orelope
- `ibarapa-central-oyo` — Ibarapa Central
- `iwajowa-oyo` — Iwajowa
- `ibarapa-north-oyo` — Ibarapa North
- `olorunsogo-oyo` — Olorunsogo
- `ogo-oluwa-oyo` — Ogo Oluwa

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state oyo <path-to-json>
```
Creates a NEW doc `stateResearch/oyo__<timestamp>`; older snapshots stay (history).
