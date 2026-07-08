# Ogun State — State Data Research Skill

> Slug: `ogun` · Capital: Abeokuta · Region: South West · Cities in app: 19 (1 with full profiles)

Purpose: research CURRENT state-level facts for Ogun and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~84% (estimate)
- Electricity DisCo: Ibadan DisCo (IBEDC)
- Key industries: Manufacturing (industrial corridor), Cement & ceramics, Agriculture, Lagos-overflow logistics

## What to research — specifically for Ogun State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Ogun state budget 2026", "Ogun state governor news", "Ogun state security", "Ogun state road project".

## Cities of Ogun in the app (each has its own skill folder here)
- `ifo-ogun` — Ifo
- `ado-odo-ota-ogun` — Ado-Odo/Ota
- `abeokuta-ogun` — Abeokuta (capital)
- `ijebu-north-ogun` — Ijebu North
- `sagamu-ogun` — Sagamu
- `obafemi-owode-ogun` — Obafemi-Owode
- `yewa-north-egbado-north-ogun` — Yewa North (Egbado North)
- `yewa-south-egbado-south-ogun` — Yewa South (Egbado South)
- `ijebu-ode-ogun` — Ijebu Ode
- `ipokia-ogun` — Ipokia
- `odogbolu-ogun` — Odogbolu
- `ikenne-ogun` — Ikenne
- `odeda-ogun` — Odeda
- `ijebu-east-ogun` — Ijebu East
- `imeko-afon-ogun` — Imeko Afon
- `ogun-waterside-ogun` — Ogun Waterside
- `ijebu-north-east-ogun` — Ijebu North East
- `remo-north-ogun` — Remo North
- `ewekoro-ogun` — Ewekoro

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state ogun <path-to-json>
```
Creates a NEW doc `stateResearch/ogun__<timestamp>`; older snapshots stay (history).
