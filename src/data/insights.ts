/**
 * State-level civic insights: presidential election history and religious
 * composition. Data is keyed by stateSlug, so every city in a state
 * shares its state's profile — the honest granularity for Nigeria, where INEC
 * declares presidential results per state and religious composition surveys
 * are state-level estimates.
 */
import { getFirestoreDoc } from "@/lib/firestoreData";
import type { CityData } from "./cities";
import stateInsightsData from "./state-insights.json";
import jobsConfigData from "./jobs-config.json";

export type PartyCode = "APC" | "PDP" | "LP" | "NNPP" | "APGA" | "N/A";

export interface ElectionResult {
  year: number;
  party: PartyCode;
  /** true when the winning margin exceeded ~10% */
  wide: boolean;
}

export interface ReligionShare {
  christian: number;
  muslim: number;
  other: number;
}

export interface StateInsight {
  elections: ElectionResult[];
  /** Finishing order of the top 3 parties in the 2023 presidential vote in this state. */
  top3?: PartyCode[];
  /** Party controlling the state governorship after the 2023 elections. */
  governor?: PartyCode;
  religion: ReligionShare;
}

interface StateInsightsFile {
  _source: string;
  [stateSlug: string]: StateInsight | string;
}

const STATIC_INSIGHTS = stateInsightsData as unknown as StateInsightsFile;

export const INSIGHTS_SOURCE = STATIC_INSIGHTS._source as string;

/** Live-with-fallback read of one state's insight entry. */
export async function getStateInsight(stateSlug: string): Promise<StateInsight | null> {
  const remote = await getFirestoreDoc<StateInsight>("stateInsights", stateSlug);
  if (remote?.elections) return remote;
  const local = STATIC_INSIGHTS[stateSlug];
  return typeof local === "object" ? local : null;
}

/* ── Parties ──────────────────────────────────────────────────── */

export const PARTY_NAMES: Record<PartyCode, string> = {
  APC: "All Progressives Congress (APC)",
  PDP: "Peoples Democratic Party (PDP)",
  LP: "Labour Party (LP)",
  NNPP: "New Nigeria Peoples Party (NNPP)",
  APGA: "All Progressives Grand Alliance (APGA)",
  "N/A": "No elected governor",
};

export const PARTY_COLORS: Record<PartyCode, string> = {
  APC: "bg-blue-100 text-blue-700",
  PDP: "bg-red-100 text-red-700",
  LP: "bg-green-100 text-green-700",
  NNPP: "bg-purple-100 text-purple-700",
  APGA: "bg-amber-100 text-amber-700",
  "N/A": "bg-zinc-100 text-zinc-500",
};

/** Solid bar colours for charts, keyed by party. */
export const PARTY_BAR_COLORS: Record<PartyCode, string> = {
  APC: "#2563eb",
  PDP: "#dc2626",
  LP: "#16a34a",
  NNPP: "#9333ea",
  APGA: "#d97706",
  "N/A": "#a1a1aa",
};

/** Count how many of the recorded presidential elections each party won in a state. */
export function tallyWins(elections: ElectionResult[]): { party: PartyCode; wins: number }[] {
  const counts = new Map<PartyCode, number>();
  for (const e of elections) counts.set(e.party, (counts.get(e.party) ?? 0) + 1);
  return [...counts.entries()].map(([party, wins]) => ({ party, wins })).sort((a, b) => b.wins - a.wins);
}

/* ── Jobs / economy ───────────────────────────────────────────── */

export interface JobsProfile {
  cityName: string;
  stateName: string;
  unemploymentRate: number;
  youthUnemploymentRate: number;
  informalEmploymentRate: number;
  minimumWageMonthly: number;
  /** City-scaled monthly income estimate (national median scaled by cost-of-living index) */
  estMonthlyIncome: number;
  nationalMedianMonthlyIncome: number;
  /** [sector, cityMonthly, nationalMonthly][] sorted by national salary desc */
  sectors: [string, number, number][];
  /** National unemployment history: [year, rate%][] */
  unemploymentTrend: [number, number][];
  unemploymentNote: string;
  asOf: string;
  source: string;
}

interface JobsConfig {
  _source: string;
  asOf: string;
  national: {
    unemploymentRate: number;
    youthUnemploymentRate: number;
    informalEmploymentRate: number;
    minimumWageMonthly: number;
    medianMonthlyIncome: number;
  };
  sectorSalariesMonthly: Record<string, number>;
  categoryDampening: number;
  unemploymentTrend: { year: number; rate: number }[];
  unemploymentNote: string;
}

const STATIC_JOBS = jobsConfigData as JobsConfig;

function scale(base: number, index: number, dampen: number): number {
  return Math.max(1000, Math.round((base * (1 + ((index - 100) / 100) * dampen)) / 1000) * 1000);
}

/** Jobs/economy profile for any city. National figures come straight from the
 * config; city-level salary estimates are the national figure scaled by the
 * city's cost-of-living index (same estimation pattern used across the site,
 * clearly labelled as an estimate in the UI). */
export async function getJobsProfile(city: CityData): Promise<JobsProfile> {
  const remote = await getFirestoreDoc<JobsConfig>("config", "jobs");
  const cfg = remote?.national ? remote : STATIC_JOBS;

  const index = city.costOfLivingIndex ?? 100;
  const d = cfg.categoryDampening;

  const sectors: [string, number, number][] = Object.entries(cfg.sectorSalariesMonthly)
    .map(([name, nat]): [string, number, number] => [name, scale(nat, index, d), nat])
    .sort((a, b) => b[2] - a[2]);

  return {
    cityName: city.name,
    stateName: city.stateName,
    unemploymentRate: cfg.national.unemploymentRate,
    youthUnemploymentRate: cfg.national.youthUnemploymentRate,
    informalEmploymentRate: cfg.national.informalEmploymentRate,
    minimumWageMonthly: cfg.national.minimumWageMonthly,
    estMonthlyIncome: scale(cfg.national.medianMonthlyIncome, index, d),
    nationalMedianMonthlyIncome: cfg.national.medianMonthlyIncome,
    sectors,
    unemploymentTrend: (cfg.unemploymentTrend ?? []).map((u) => [u.year, u.rate] as [number, number]),
    unemploymentNote: cfg.unemploymentNote ?? "",
    asOf: cfg.asOf,
    source: cfg._source,
  };
}
