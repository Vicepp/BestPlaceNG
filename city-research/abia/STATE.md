# Abia State — State Data Research Skill

> Slug: `abia` · Capital: Umuahia · Region: South East · Cities in app: 15 (2 with full profiles)

Purpose: research CURRENT state-level facts for Abia and APPEND them to the
database as a new dated snapshot (never overwrite — history is kept).

## Current baseline in the app
- Adult literacy: ~92% (estimate)
- Electricity DisCo: Enugu DisCo (EEDC)
- Key industries: Leather & garments (Aba), Trade, SME manufacturing

## What to research — specifically for Abia State
1. **Government**: current governor + party, flagship programmes actually moving this year.
2. **Economy**: state budget size and focus; any new minimum-wage implementation; major employers hiring or closing.
3. **Security**: the state-wide picture over the last 6 months (which LGAs, what type, trend).
4. **Infrastructure**: state road/rail/power projects under construction; completion news.
5. **Cost pressures**: anything state-specific (levies, transport fare changes, food prices).

Search hints: "Abia state budget 2026", "Abia state governor news", "Abia state security", "Abia state road project".

## Cities of Abia in the app (each has its own skill folder here)
- `aba-abia` — Aba
- `umuahia-abia` — Umuahia (capital)
- `ohafia-abia` — Ohafia
- `osisioma-ngwa-abia` — Osisioma Ngwa
- `bende-abia` — Bende
- `obi-ngwa-abia` — Obi Ngwa
- `arochukwu-abia` — Arochukwu
- `umu-nneochi-abia` — Umu-Nneochi
- `isiala-ngwa-north-abia` — Isiala-Ngwa North
- `ikwuano-abia` — Ikwuano
- `isiala-ngwa-south-abia` — Isiala-Ngwa South
- `isuikwuato-abia` — Isuikwuato
- `ukwa-west-abia` — Ukwa West
- `ugwunagbo-abia` — Ugwunagbo
- `ukwa-east-abia` — Ukwa East

## How to save (APPEND-ONLY — never overwrite)
Compose a snapshot JSON (headline, asOf, highlights[], sources[] — same shape as
city snapshots, plus any of: government, economy, security, infrastructure notes), then:
```
node scripts/append-research.mjs state abia <path-to-json>
```
Creates a NEW doc `stateResearch/abia__<timestamp>`; older snapshots stay (history).
