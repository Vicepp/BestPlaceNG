# Zamfara State — State Data Research Skill

> Slug: `zamfara` · Capital: Gusau · Region: North West · Cities in app: 14 (1 with full profiles)

Purpose: research CURRENT state-level facts for Zamfara and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~35% (estimate)
- Electricity DisCo: Kaduna Electric
- Key industries: Agriculture (grains, cotton), Livestock, Trade

## What to research — specifically for Zamfara State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Zamfara state budget 2026", "Zamfara state governor news", "Zamfara state security", "Zamfara state road project".

## Cities of Zamfara in the app (each has its own skill folder here)
- `gusau-zamfara` — Gusau (capital)
- `zurmi-zamfara` — Zurmi
- `maru-zamfara` — Maru
- `kaura-namoda-zamfara` — Kaura Namoda
- `tsafe-zamfara` — Tsafe
- `bungudu-zamfara` — Bungudu
- `bukkuyum-zamfara` — Bukkuyum
- `talata-mafara-zamfara` — Talata Mafara
- `maradun-zamfara` — Maradun
- `gummi-zamfara` — Gummi
- `bakura-zamfara` — Bakura
- `birnin-magaji-zamfara` — Birnin Magaji
- `anka-zamfara` — Anka
- `shinkafi-zamfara` — Shinkafi

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state zamfara <path-to-json>
```
Creates a NEW doc `stateResearch/zamfara__<timestamp>`; older snapshots stay (history).
