/**
 * Append-only research snapshots written by the /update-city-data skill and the
 * city-data-researcher agent (see city-research/ tree). Each snapshot is a NEW
 * doc `cityResearch/<slug>__<timestamp>` — nothing is ever overwritten, so the
 * full history per city/state is preserved. The site surfaces the LATEST one.
 */
import { queryFirestoreCollection } from "@/lib/firestoreWrite";

export interface ResearchSectionFinding {
  note?: string;
  trend?: string;
  avgDailyHours?: number;
  areas?: { area: string; oneBedroom?: number; twoBedroom?: number; threeBedroom?: number; selfContain?: number }[];
  [extra: string]: unknown;
}

export interface ResearchSnapshot {
  id: string;
  slug: string;
  kind: "city" | "state";
  headline: string;
  asOf: string;
  createdAt: string;
  highlights?: string[];
  /** Findings keyed by city-page section slug (apartments, electricity, crime,
   * market, …) — a snapshot covers every section the research turned up
   * city-specific facts for. */
  sections?: Record<string, ResearchSectionFinding>;
  sources: string[];
}

/** All snapshots for a city, newest first (the full history). */
export async function getCityResearchHistory(citySlug: string): Promise<ResearchSnapshot[]> {
  const docs = await queryFirestoreCollection<ResearchSnapshot>("cityResearch", [["slug", citySlug]]);
  if (!docs) return [];
  return [...docs].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** The most recent snapshot for a city (or null if none researched yet). */
export async function getLatestCityResearch(citySlug: string): Promise<{ latest: ResearchSnapshot; historyCount: number } | null> {
  const history = await getCityResearchHistory(citySlug);
  return history.length > 0 ? { latest: history[0], historyCount: history.length } : null;
}

/** State-level equivalents. */
export async function getStateResearchHistory(stateSlug: string): Promise<ResearchSnapshot[]> {
  const docs = await queryFirestoreCollection<ResearchSnapshot>("stateResearch", [["slug", stateSlug]]);
  if (!docs) return [];
  return [...docs].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
