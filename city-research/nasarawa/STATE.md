# Nasarawa State — State Data Research Skill

> Slug: `nasarawa` · Capital: Lafia · Region: North Central · Cities in app: 13 (1 with full profiles)

Purpose: research CURRENT state-level facts for Nasarawa and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~68% (estimate)
- Electricity DisCo: Abuja DisCo (AEDC)
- Key industries: Agriculture (grains, tubers), Mining, Trade

## What to research — specifically for Nasarawa State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Nasarawa state budget 2026", "Nasarawa state governor news", "Nasarawa state security", "Nasarawa state road project".

## Cities of Nasarawa in the app (each has its own skill folder here)
- `lafia-nasarawa` — Lafia (capital)
- `karu-nasarawa` — Karu
- `nasarawa-nasarawa` — Nasarawa
- `nasarawa-eggon-nasarawa` — Nasarawa-Eggon
- `doma-nasarawa` — Doma
- `toto-nasarawa` — Toto
- `awe-nasarawa` — Awe
- `akwanga-nasarawa` — Akwanga
- `kokona-nasarawa` — Kokona
- `keffi-nasarawa` — Keffi
- `obi-nasarawa` — Obi
- `keana-nasarawa` — Keana
- `wamba-nasarawa` — Wamba

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state nasarawa <path-to-json>
```
Creates a NEW doc `stateResearch/nasarawa__<timestamp>`; older snapshots stay (history).
