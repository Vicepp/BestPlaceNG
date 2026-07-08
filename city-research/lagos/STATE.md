# Lagos State — State Data Research Skill

> Slug: `lagos` · Capital: Ikeja · Region: South West · Cities in app: 21 (2 with full profiles)

Purpose: research CURRENT state-level facts for Lagos and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~96% (estimate)
- Electricity DisCo: Ikeja Electric / Eko DisCo
- Key industries: Trade & commerce, Banking & fintech, Tech startups, Ports & logistics, Entertainment (Nollywood, music)

## What to research — specifically for Lagos State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Lagos state budget 2026", "Lagos state governor news", "Lagos state security", "Lagos state road project".

## Cities of Lagos in the app (each has its own skill folder here)
- `lagos-lagos` — Lagos
- `alimosho-lagos` — Alimosho
- `oshodi-isolo-lagos` — Oshodi-Isolo
- `ajeromi-ifelodun-lagos` — Ajeromi-Ifelodun
- `ikorodu-lagos` — Ikorodu
- `kosofe-lagos` — Kosofe
- `mushin-lagos` — Mushin
- `ojo-lagos` — Ojo
- `amuwo-odofin-lagos` — Amuwo-Odofin
- `agege-lagos` — Agege
- `ifako-ijaiye-lagos` — Ifako-Ijaiye
- `shomolu-lagos` — Shomolu
- `lagos-mainland-lagos` — Lagos Mainland
- `ikeja-lagos` — Ikeja
- `eti-osa-lagos` — Eti-Osa
- `badagry-lagos` — Badagry
- `surulere-lagos` — Surulere
- `apapa-lagos` — Apapa
- `lagos-island-lagos` — Lagos Island
- `epe-lagos` — Epe
- `ibeju-lekki-lagos` — Ibeju-Lekki

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state lagos <path-to-json>
```
Creates a NEW doc `stateResearch/lagos__<timestamp>`; older snapshots stay (history).
