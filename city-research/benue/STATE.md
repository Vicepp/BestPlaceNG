# Benue State — State Data Research Skill

> Slug: `benue` · Capital: Makurdi · Region: North Central · Cities in app: 23 (1 with full profiles)

Purpose: research CURRENT state-level facts for Benue and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~76% (estimate)
- Electricity DisCo: Jos DisCo (JED)
- Key industries: Agriculture (grains, tubers), Mining, Trade

## What to research — specifically for Benue State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Benue state budget 2026", "Benue state governor news", "Benue state security", "Benue state road project".

## Cities of Benue in the app (each has its own skill folder here)
- `gboko-benue` — Gboko
- `makurdi-benue` — Makurdi (capital)
- `oturkpo-benue` — Oturkpo
- `kwande-benue` — Kwande
- `vandeikya-benue` — Vandeikya
- `konshisha-benue` — Konshisha
- `katsina-ala-benue` — Katsina-Ala
- `ukum-benue` — Ukum
- `buruku-benue` — Buruku
- `guma-benue` — Guma
- `ushongo-benue` — Ushongo
- `ado-benue` — Ado
- `okpokwu-benue` — Okpokwu
- `logo-benue` — Logo
- `gwer-east-benue` — Gwer East
- `oju-benue` — Oju
- `obi-benue` — Obi
- `ogbadibo-benue` — Ogbadibo
- `gwer-west-benue` — Gwer West
- `agatu-benue` — Agatu
- `apa-benue` — Apa
- `tarka-benue` — Tarka
- `ohimini-benue` — Ohimini

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state benue <path-to-json>
```
Creates a NEW doc `stateResearch/benue__<timestamp>`; older snapshots stay (history).
