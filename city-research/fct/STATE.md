# Federal Capital Territory State — State Data Research Skill

> Slug: `fct` · Capital: Abuja · Region: North Central · Cities in app: 6 (1 with full profiles)

Purpose: research CURRENT state-level facts for Federal Capital Territory and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~82% (estimate)
- Electricity DisCo: Abuja DisCo (AEDC)
- Key industries: Government & public service, Construction & real estate, Hospitality, Professional services

## What to research — specifically for Federal Capital Territory State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Federal Capital Territory state budget 2026", "Federal Capital Territory state governor news", "Federal Capital Territory state security", "Federal Capital Territory state road project".

## Cities of Federal Capital Territory in the app (each has its own skill folder here)
- `abuja-fct` — Abuja (federal capital)
- `bwari-fct` — Bwari
- `gwagwalada-fct` — Gwagwalada
- `kuje-fct` — Kuje
- `kwali-fct` — Kwali
- `abaji-fct` — Abaji

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state fct <path-to-json>
```
Creates a NEW doc `stateResearch/fct__<timestamp>`; older snapshots stay (history).
