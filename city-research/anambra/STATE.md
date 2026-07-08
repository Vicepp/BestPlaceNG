# Anambra State — State Data Research Skill

> Slug: `anambra` · Capital: Awka · Region: South East · Cities in app: 18 (4 with full profiles)

Purpose: research CURRENT state-level facts for Anambra and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~92% (estimate)
- Electricity DisCo: Enugu DisCo (EEDC)
- Key industries: Trade (Onitsha Main Market), Manufacturing (Nnewi auto parts), Agriculture

## What to research — specifically for Anambra State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Anambra state budget 2026", "Anambra state governor news", "Anambra state security", "Anambra state road project".

## Cities of Anambra in the app (each has its own skill folder here)
- `idemili-north-anambra` — Idemili North
- `nnewi-anambra` — Nnewi
- `aguata-anambra` — Aguata
- `ihiala-anambra` — Ihiala
- `awka-anambra` — Awka (capital)
- `anaocha-anambra` — Anaocha
- `onitsha-anambra` — Onitsha
- `okpoko-anambra` — Okpoko
- `idemili-south-anambra` — Idemili South
- `orumba-south-anambra` — Orumba South
- `orumba-north-anambra` — Orumba North
- `oyi-anambra` — Oyi
- `anambra-west-anambra` — Anambra West
- `ekwusigo-anambra` — Ekwusigo
- `ayamelum-anambra` — Ayamelum
- `anambra-east-anambra` — Anambra East
- `njikoka-anambra` — Njikoka
- `dunukofia-anambra` — Dunukofia

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state anambra <path-to-json>
```
Creates a NEW doc `stateResearch/anambra__<timestamp>`; older snapshots stay (history).
