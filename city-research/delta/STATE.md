# Delta State — State Data Research Skill

> Slug: `delta` · Capital: Asaba · Region: South South · Cities in app: 23 (2 with full profiles)

Purpose: research CURRENT state-level facts for Delta and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~89% (estimate)
- Electricity DisCo: Benin DisCo (BEDC)
- Key industries: Oil & gas, Agriculture, Trade

## What to research — specifically for Delta State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Delta state budget 2026", "Delta state governor news", "Delta state security", "Delta state road project".

## Cities of Delta in the app (each has its own skill folder here)
- `warri-delta` — Warri
- `ughelli-north-delta` — Ughelli North
- `isoko-south-delta` — Isoko South
- `ughelli-south-delta` — Ughelli South
- `burutu-delta` — Burutu
- `ethiope-west-delta` — Ethiope West
- `ethiope-east-delta` — Ethiope East
- `uvwie-delta` — Uvwie
- `ika-north-east-delta` — Ika North East
- `sapele-delta` — Sapele
- `ika-south-delta` — Ika South
- `ndokwa-west-delta` — Ndokwa West
- `asaba-delta` — Asaba (capital)
- `isoko-north-delta` — Isoko North
- `udu-delta` — Udu
- `aniocha-south-delta` — Aniocha South
- `okpe-delta` — Okpe
- `ukwuani-delta` — Ukwuani
- `oshimili-north-delta` — Oshimili North
- `aniocha-north-delta` — Aniocha North
- `ndokwa-east-delta` — Ndokwa East
- `bomadi-delta` — Bomadi
- `patani-delta` — Patani

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state delta <path-to-json>
```
Creates a NEW doc `stateResearch/delta__<timestamp>`; older snapshots stay (history).
