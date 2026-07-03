/**
 * State-level civic insights: presidential election history (VoteWord) and
 * religious composition. Data is keyed by stateSlug, so every city in a state
 * shares its state's profile — the honest granularity for Nigeria, where INEC
 * declares presidential results per state and religious composition surveys
 * are state-level estimates.
 */
import { getFirestoreDoc } from "@/lib/firestoreData";
import type { CityData } from "./cities";
import stateInsightsData from "./state-insights.json";
import jobsConfigData from "./jobs-config.json";

export interface ElectionResult {
  year: number;
  party: "APC" | "PDP" | "LP" | "NNPP";
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

/* ── VoteWord ─────────────────────────────────────────────────── */

const PARTY_LETTER: Record<ElectionResult["party"], string> = {
  APC: "a",
  PDP: "p",
  LP: "l",
  NNPP: "k", // K for Kwankwaso's NNPP, since L is taken by Labour Party
};

/** BestPlaces-style VoteWord: one letter per election, uppercase when the
 * margin was wide (>10%), lowercase when it was narrow. */
export function buildVoteWord(elections: ElectionResult[]): string {
  return elections
    .map((e) => {
      const letter = PARTY_LETTER[e.party] ?? "?";
      return e.wide ? letter.toUpperCase() : letter;
    })
    .join(" ");
}

export const PARTY_NAMES: Record<ElectionResult["party"], string> = {
  APC: "All Progressives Congress",
  PDP: "Peoples Democratic Party",
  LP: "Labour Party",
  NNPP: "New Nigeria Peoples Party",
};

export const PARTY_COLORS: Record<ElectionResult["party"], string> = {
  APC: "bg-blue-100 text-blue-700",
  PDP: "bg-red-100 text-red-700",
  LP: "bg-green-100 text-green-700",
  NNPP: "bg-purple-100 text-purple-700",
};

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
    asOf: cfg.asOf,
    source: cfg._source,
  };
}
