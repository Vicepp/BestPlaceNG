# City Research Knowledge Tree

One folder per state (37), one folder per city inside it (753 total).
Each city folder holds a SKILL.md with CITY-SPECIFIC research instructions and the
app's current baseline for that city; each state folder holds a STATE.md equivalent.

- Entry point: run the `/update-city-data` skill (or ask for the city-data-researcher agent).
- Data written by this system is APPEND-ONLY: cityResearch/<slug>__<timestamp> and
  stateResearch/<slug>__<timestamp> in Firestore. Nothing is ever overwritten, so the
  full history of snapshots is preserved and queryable.
- Regenerate this tree after adding cities: npx tsx scripts/generate-city-research-tree.ts
