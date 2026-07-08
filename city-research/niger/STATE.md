# Niger State — State Data Research Skill

> Slug: `niger` · Capital: Minna · Region: North Central · Cities in app: 25 (1 with full profiles)

Purpose: research CURRENT state-level facts for Niger and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~54% (estimate)
- Electricity DisCo: Abuja DisCo (AEDC)
- Key industries: Agriculture (grains, tubers), Mining, Trade

## What to research — specifically for Niger State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Niger state budget 2026", "Niger state governor news", "Niger state security", "Niger state road project".

## Cities of Niger in the app (each has its own skill folder here)
- `mokwa-niger` — Mokwa
- `shiroro-niger` — Shiroro
- `mashegu-niger` — Mashegu
- `suleja-niger` — Suleja
- `lavun-niger` — Lavun
- `minna-niger` — Minna (capital)
- `mariga-niger` — Mariga
- `rafi-niger` — Rafi
- `bida-niger` — Bida
- `magama-niger` — Magama
- `rijau-niger` — Rijau
- `borgu-niger` — Borgu
- `edati-niger` — Edati
- `paikoro-niger` — Paikoro
- `kontagora-niger` — Kontagora
- `bosso-niger` — Bosso
- `agaie-niger` — Agaie
- `gbako-niger` — Gbako
- `katcha-niger` — Katcha
- `lapai-niger` — Lapai
- `muya-niger` — Muya
- `gurara-niger` — Gurara
- `tafa-niger` — Tafa
- `wushishi-niger` — Wushishi
- `agwara-niger` — Agwara

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state niger <path-to-json>
```
Creates a NEW doc `stateResearch/niger__<timestamp>`; older snapshots stay (history).
