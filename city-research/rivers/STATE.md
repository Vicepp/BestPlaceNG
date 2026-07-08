# Rivers State — State Data Research Skill

> Slug: `rivers` · Capital: Port Harcourt · Region: South South · Cities in app: 23 (1 with full profiles)

Purpose: research CURRENT state-level facts for Rivers and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~91% (estimate)
- Electricity DisCo: Port Harcourt DisCo (PHED)
- Key industries: Oil & gas, Ports & maritime, Manufacturing, Trade

## What to research — specifically for Rivers State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Rivers state budget 2026", "Rivers state governor news", "Rivers state security", "Rivers state road project".

## Cities of Rivers in the app (each has its own skill folder here)
- `port-harcourt-rivers` — Port Harcourt (capital)
- `obio-akpor-rivers` — Obio/Akpor
- `khana-rivers` — Khana
- `ogba-egbema-ndoni-rivers` — Ogba-Egbema-Ndoni
- `abua-odual-rivers` — Abua-Odual
- `etche-rivers` — Etche
- `degema-rivers` — Degema
- `ahoada-west-rivers` — Ahoada West
- `gokana-rivers` — Gokana
- `okrika-rivers` — Okrika
- `asari-toru-rivers` — Asari-Toru
- `andoni-rivers` — Andoni
- `bonny-rivers` — Bonny
- `emuoha-rivers` — Emuoha
- `eleme-rivers` — Eleme
- `ikwerre-rivers` — Ikwerre
- `ahoada-east-rivers` — Ahoada East
- `akuku-toru-rivers` — Akuku Toru
- `opobo-nkoro-rivers` — Opobo-Nkoro
- `oyigbo-rivers` — Oyigbo
- `tai-rivers` — Tai
- `omumma-rivers` — Omumma
- `ogu-bolo-rivers` — Ogu-Bolo

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state rivers <path-to-json>
```
Creates a NEW doc `stateResearch/rivers__<timestamp>`; older snapshots stay (history).
