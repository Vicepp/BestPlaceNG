# Kano State — State Data Research Skill

> Slug: `kano` · Capital: Kano · Region: North West · Cities in app: 45 (1 with full profiles)

Purpose: research CURRENT state-level facts for Kano and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~55% (estimate)
- Electricity DisCo: Kano DisCo (KEDCO)
- Key industries: Commerce & distribution, Agriculture & agro-processing, Textiles & leather, Manufacturing

## What to research — specifically for Kano State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Kano state budget 2026", "Kano state governor news", "Kano state security", "Kano state road project".

## Cities of Kano in the app (each has its own skill folder here)
- `kano-kano` — Kano (capital)
- `nasarawa-kano` — Nasarawa
- `dala-kano` — Dala
- `kano-municipal-kano` — Kano Municipal
- `ungogo-kano` — Ungogo
- `gwale-kano` — Gwale
- `kumbotso-kano` — Kumbotso
- `gezawa-kano` — Gezawa
- `bichi-kano` — Bichi
- `kiru-kano` — Kiru
- `sumaila-kano` — Sumaila
- `dawakin-tofa-kano` — Dawakin Tofa
- `tudun-wada-kano` — Tudun Wada
- `rogo-kano` — Rogo
- `dawakin-kudu-kano` — Dawakin Kudu
- `tarauni-kano` — Tarauni
- `makoda-kano` — Makoda
- `minjibir-kano` — Minjibir
- `gabasawa-kano` — Gabasawa
- `dambatta-kano` — Dambatta
- `gaya-kano` — Gaya
- `takai-kano` — Takai
- `fagge-kano` — Fagge
- `bebeji-kano` — Bebeji
- `wudil-kano` — Wudil
- `albasu-kano` — Albasu
- `gwarzo-kano` — Gwarzo
- `bunkure-kano` — Bunkure
- `ajingi-kano` — Ajingi
- `garko-kano` — Garko
- `bagwai-kano` — Bagwai
- `tsanyawa-kano` — Tsanyawa
- `kabo-kano` — Kabo
- `doguwa-kano` — Doguwa
- `rano-kano` — Rano
- `karaye-kano` — Karaye
- `kura-kano` — Kura
- `shanono-kano` — Shanono
- `kibiya-kano` — Kibiya
- `madobi-kano` — Madobi
- `warawa-kano` — Warawa
- `garum-mallam-kano` — Garum Mallam
- `kunchi-kano` — Kunchi
- `rimin-gado-kano` — Rimin Gado
- `tofa-kano` — Tofa

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state kano <path-to-json>
```
Creates a NEW doc `stateResearch/kano__<timestamp>`; older snapshots stay (history).
