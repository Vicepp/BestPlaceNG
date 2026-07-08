# Imo State — State Data Research Skill

> Slug: `imo` · Capital: Owerri · Region: South East · Cities in app: 25 (1 with full profiles)

Purpose: research CURRENT state-level facts for Imo and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~94% (estimate)
- Electricity DisCo: Enugu DisCo (EEDC)
- Key industries: Trade & SMEs, Manufacturing, Agriculture

## What to research — specifically for Imo State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Imo state budget 2026", "Imo state governor news", "Imo state security", "Imo state road project".

## Cities of Imo in the app (each has its own skill folder here)
- `owerri-imo` — Owerri (capital)
- `mbaitoli-imo` — Mbaitoli
- `isiala-mbano-imo` — Isiala-Mbano
- `abo-mbaise-imo` — Abo-Mbaise
- `ohaji-egbema-imo` — Ohaji/Egbema
- `ahiazu-mbaise-imo` — Ahiazu-Mbaise
- `ezinihitte-imo` — Ezinihitte
- `isu-imo` — Isu
- `ideato-south-imo` — Ideato South
- `ngor-okpala-imo` — Ngor-Okpala
- `ideato-north-imo` — Ideato North
- `ikeduru-imo` — Ikeduru
- `njaba-imo` — Njaba
- `orlu-imo` — Orlu
- `oguta-imo` — Oguta
- `okigwe-imo` — Okigwe
- `ehime-mbano-imo` — Ehime-Mbano
- `nwangele-imo` — Nwangele
- `orsu-imo` — Orsu
- `ihitte-uboma-imo` — Ihitte/Uboma
- `obowo-imo` — Obowo
- `oru-west-imo` — Oru West
- `oru-east-imo` — Oru East
- `unuimo-imo` — Unuimo
- `nkwerre-imo` — Nkwerre

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state imo <path-to-json>
```
Creates a NEW doc `stateResearch/imo__<timestamp>`; older snapshots stay (history).
