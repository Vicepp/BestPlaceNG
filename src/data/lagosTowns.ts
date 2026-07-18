import townsRaw from "./lagos-towns.json";

/** A town/district/area inside a Lagos LGA. Towns don't have their own pages —
 * they route searchers to their parent LGA's city page. */
export interface LagosTown {
  town: string;
  lga: string;      // parent LGA display name, e.g. "Kosofe"
  citySlug: string; // parent city page, e.g. "kosofe-lagos"
  hq: boolean;      // is this town the LGA headquarters?
}

export const lagosTowns: LagosTown[] = townsRaw as LagosTown[];

/** Towns whose name contains the query (for search surfaces). */
export function searchTowns(query: string): LagosTown[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return lagosTowns
    .filter((t) => t.town.toLowerCase().includes(q))
    .sort((a, b) => {
      // exact match first, then starts-with, then contains
      const ax = a.town.toLowerCase() === q ? 0 : a.town.toLowerCase().startsWith(q) ? 1 : 2;
      const bx = b.town.toLowerCase() === q ? 0 : b.town.toLowerCase().startsWith(q) ? 1 : 2;
      return ax - bx || a.town.localeCompare(b.town);
    });
}

/** All towns belonging to one LGA city page, HQ first. */
export function townsForCity(citySlug: string): LagosTown[] {
  return lagosTowns
    .filter((t) => t.citySlug === citySlug)
    .sort((a, b) => Number(b.hq) - Number(a.hq) || a.town.localeCompare(b.town));
}

/** The full Lagos tree: LGA -> its towns (for the explore page). */
export function lagosTree(): { lga: string; citySlug: string; towns: LagosTown[] }[] {
  const map = new Map<string, { lga: string; citySlug: string; towns: LagosTown[] }>();
  for (const t of lagosTowns) {
    const entry = map.get(t.citySlug) ?? { lga: t.lga, citySlug: t.citySlug, towns: [] };
    entry.towns.push(t);
    map.set(t.citySlug, entry);
  }
  for (const e of map.values()) e.towns.sort((a, b) => Number(b.hq) - Number(a.hq) || a.town.localeCompare(b.town));
  return [...map.values()].sort((a, b) => a.lga.localeCompare(b.lga));
}
