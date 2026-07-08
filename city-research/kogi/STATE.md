# Kogi State — State Data Research Skill

> Slug: `kogi` · Capital: Lokoja · Region: North Central · Cities in app: 21 (2 with full profiles)

Purpose: research CURRENT state-level facts for Kogi and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~80% (estimate)
- Electricity DisCo: Abuja DisCo (AEDC)
- Key industries: Agriculture (grains, tubers), Mining, Trade

## What to research — specifically for Kogi State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Kogi state budget 2026", "Kogi state governor news", "Kogi state security", "Kogi state road project".

## Cities of Kogi in the app (each has its own skill folder here)
- `okene-kogi` — Okene
- `ankpa-kogi` — Ankpa
- `dekina-kogi` — Dekina
- `okehi-kogi` — Okehi
- `adavi-kogi` — Adavi
- `bassa-kogi` — Bassa
- `lokoja-kogi` — Lokoja (capital)
- `ofu-kogi` — Ofu
- `olamaboro-kogi` — Olamaboro
- `yagba-east-kogi` — Yagba East
- `igalamela-odolu-kogi` — Igalamela-Odolu
- `kabba-bunu-kogi` — Kabba/Bunu
- `yagba-west-kogi` — Yagba West
- `ibaji-kogi` — Ibaji
- `ajaokuta-kogi` — Ajaokuta
- `ijumu-kogi` — Ijumu
- `kogi-kogi` — Kogi
- `omala-kogi` — Omala
- `idah-kogi` — Idah
- `mopa-muro-kogi` — Mopa-Muro
- `ogori-magongo-kogi` — Ogori/Magongo

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state kogi <path-to-json>
```
Creates a NEW doc `stateResearch/kogi__<timestamp>`; older snapshots stay (history).
