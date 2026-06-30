import { getCitiesLive, type CityData } from "./cities";
import { getStateReferenceCity } from "./costOfLiving";
import researchedCrimeData from "./researched-crime.json";
import stateRentFallback from "./state-rent-fallback.json";
import crimeConfig from "./crime-config.json";
import crimeHistoryData from "./crime-history.json";
import notableIncidentsData from "./notable-incidents.json";
import { getFirestoreCollection, getFirestoreCollectionAsMap, getFirestoreDoc } from "@/lib/firestoreData";

export interface NotableIncident {
  year: number;
  month?: string;
  citySlug: string;
  place: string;
  type: string;
  victimCount?: number | null;
  murderCount?: number;
  robberyCount?: number;
  description: string;
  source: string;
}

export const crimeHistory = crimeHistoryData as {
  national: { year: number; murder?: number; armedRobbery?: number; kidnapping?: number; otherOffences?: number; banditry?: number; terrorism?: number; total?: number; source: string }[];
  kidnappingTrend: { period: string; endYear: number; victims: number; incidents: number; killed?: number; source: string }[];
};

const STATIC_NOTABLE_INCIDENTS = notableIncidentsData as NotableIncident[];

let liveIncidentsCache: NotableIncident[] | null = null;
async function getAllNotableIncidents(): Promise<NotableIncident[]> {
  if (liveIncidentsCache) return liveIncidentsCache;
  const remote = await getFirestoreCollection<NotableIncident>("notableIncidents");
  liveIncidentsCache = remote && remote.length > 0 ? remote : STATIC_NOTABLE_INCIDENTS;
  return liveIncidentsCache;
}

/** Specific dated, sourced crime incidents documented for this city (or its state-reference major, for LGA-tier cities). */
export async function getNotableIncidents(city: CityData): Promise<NotableIncident[]> {
  const all = await getAllNotableIncidents();
  const direct = all.filter((i) => i.citySlug === city.slug);
  if (direct.length > 0 || city.tier === "major") return direct;
  const referenceCity = await getStateReferenceCity(city.stateSlug);
  return referenceCity ? all.filter((i) => i.citySlug === referenceCity.slug) : [];
}

export type RiskLevel = "None" | "Low" | "Moderate" | "High" | "Severe";
export type CrimeSource = "researched" | "qualitative" | "state-reference" | "national-estimate";

interface ResearchedCrimeEntry {
  violentCrimeIndex: number;
  propertyCrimeIndex: number;
  kidnappingRisk: RiskLevel;
  kidnappingNote?: string;
  terrorismRisk: RiskLevel;
  terrorismNote?: string;
  policeConductNote?: string;
  source: "researched" | "qualitative";
  asOf: string;
}

const STATIC_RESEARCHED_CRIME = researchedCrimeData as Record<string, ResearchedCrimeEntry>;
// Crime data borrows the same "which major a non-researched major leans on"
// map already curated for cost-of-living rent (state-rent-fallback.json) —
// same states, same logic, one shared file to keep edits in one place.
const STATIC_STATE_CRIME_FALLBACK = stateRentFallback as Record<string, string>;

let liveCrimeResearchCache: Record<string, ResearchedCrimeEntry> | null = null;
async function getResearchedCrimeLive(): Promise<Record<string, ResearchedCrimeEntry>> {
  if (liveCrimeResearchCache) return liveCrimeResearchCache;
  const remote = await getFirestoreCollectionAsMap<ResearchedCrimeEntry>("crimeResearch");
  liveCrimeResearchCache = remote && Object.keys(remote).length > 0 ? remote : STATIC_RESEARCHED_CRIME;
  return liveCrimeResearchCache;
}

async function getCrimeFallbackProxyLive(): Promise<Record<string, string>> {
  const remote = await getFirestoreDoc<Record<string, string>>("config", "stateRentFallback");
  return remote ?? STATIC_STATE_CRIME_FALLBACK;
}

export interface CrimeProfile {
  citySlug: string;
  cityName: string;
  stateName: string;
  region: string;
  violentCrimeIndex: number;
  propertyCrimeIndex: number;
  violentVsNationalPercent: number;
  propertyVsNationalPercent: number;
  kidnappingRisk: RiskLevel;
  kidnappingNote?: string;
  terrorismRisk: RiskLevel;
  terrorismNote?: string;
  policeConductNote?: string;
  source: CrimeSource;
  sourceCityName?: string;
  asOf?: string;
  estimatedFromMajor?: boolean;
  majorCityName?: string;
  nearby: { name: string; slug: string; violentCrimeIndex: number; propertyCrimeIndex: number; population: number }[];
  stateAvgViolent: number;
  stateAvgProperty: number;
}

export const NATIONAL_AVG_VIOLENT = crimeConfig.nationalAvgViolentCrimeIndex;
export const NATIONAL_AVG_PROPERTY = crimeConfig.nationalAvgPropertyCrimeIndex;

export interface CrimeConfig {
  nationalAvgViolentCrimeIndex: number;
  nationalAvgPropertyCrimeIndex: number;
}

/** Live national-average crime config, with the bundled crime-config.json as fallback. */
export async function getCrimeConfigLive(): Promise<CrimeConfig> {
  const remote = await getFirestoreDoc<CrimeConfig>("config", "crime");
  return remote ?? { nationalAvgViolentCrimeIndex: NATIONAL_AVG_VIOLENT, nationalAvgPropertyCrimeIndex: NATIONAL_AVG_PROPERTY };
}

export type CrimeHistory = {
  national: { year: number; murder?: number; armedRobbery?: number; kidnapping?: number; otherOffences?: number; banditry?: number; terrorism?: number; total?: number; source: string }[];
  kidnappingTrend: { period: string; endYear: number; victims: number; incidents: number; killed?: number; source: string }[];
};

/** Live national crime-history series, with the bundled crime-history.json as fallback. */
export async function getCrimeHistoryLive(): Promise<CrimeHistory> {
  const remote = await getFirestoreDoc<CrimeHistory>("config", "crimeHistory");
  return remote ?? crimeHistory;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Derive a rough crime index from the existing safetyIndex field (higher safety = lower crime) when no research exists. */
function estimateFromSafetyIndex(city: CityData): { violentCrimeIndex: number; propertyCrimeIndex: number } {
  const safety = city.safetyIndex ?? 75;
  const violentCrimeIndex = Math.max(10, Math.round(100 - safety + 10));
  const propertyCrimeIndex = Math.max(8, Math.round(violentCrimeIndex * 0.85));
  return { violentCrimeIndex, propertyCrimeIndex };
}

async function buildMajorCrimeProfile(city: CityData, allCities: CityData[]): Promise<CrimeProfile> {
  const [researched, proxyMap, cfg] = await Promise.all([getResearchedCrimeLive(), getCrimeFallbackProxyLive(), getCrimeConfigLive()]);

  const own = researched[city.slug];
  const proxySlug = proxyMap[city.slug];
  const proxy = proxySlug ? researched[proxySlug] : undefined;
  const proxyCity = proxySlug ? allCities.find((c) => c.slug === proxySlug) : undefined;

  let entry: ResearchedCrimeEntry | undefined = own ?? proxy;
  let source: CrimeSource = own ? own.source : proxy ? "state-reference" : "national-estimate";
  let sourceCityName: string | undefined = own ? undefined : proxyCity?.name;

  if (!entry) {
    entry = { ...estimateFromSafetyIndex(city), kidnappingRisk: "Low", terrorismRisk: "None", source: "qualitative", asOf: undefined } as unknown as ResearchedCrimeEntry;
  }

  const sameStateMajors = allCities.filter((c) => c.tier === "major" && c.stateSlug === city.stateSlug);
  const stateProfiles = sameStateMajors.map((c) => researched[c.slug] ?? estimateFromSafetyIndex(c));
  const stateAvgViolent = stateProfiles.reduce((s, p) => s + p.violentCrimeIndex, 0) / stateProfiles.length;
  const stateAvgProperty = stateProfiles.reduce((s, p) => s + p.propertyCrimeIndex, 0) / stateProfiles.length;

  const nearby = allCities
    .filter((c) => c.tier === "major" && c.stateSlug === city.stateSlug && c.slug !== city.slug)
    .map((c) => {
      const p = researched[c.slug] ?? estimateFromSafetyIndex(c);
      return { name: c.name, slug: c.slug, violentCrimeIndex: p.violentCrimeIndex, propertyCrimeIndex: p.propertyCrimeIndex, population: c.population };
    })
    .sort((a, b) => b.population - a.population)
    .slice(0, 6);

  return {
    citySlug: city.slug,
    cityName: city.name,
    stateName: city.stateName,
    region: city.region,
    violentCrimeIndex: entry.violentCrimeIndex,
    propertyCrimeIndex: entry.propertyCrimeIndex,
    violentVsNationalPercent: round1(((entry.violentCrimeIndex - cfg.nationalAvgViolentCrimeIndex) / cfg.nationalAvgViolentCrimeIndex) * 100),
    propertyVsNationalPercent: round1(((entry.propertyCrimeIndex - cfg.nationalAvgPropertyCrimeIndex) / cfg.nationalAvgPropertyCrimeIndex) * 100),
    kidnappingRisk: entry.kidnappingRisk,
    kidnappingNote: entry.kidnappingNote,
    terrorismRisk: entry.terrorismRisk,
    terrorismNote: entry.terrorismNote,
    policeConductNote: entry.policeConductNote,
    source,
    sourceCityName,
    asOf: entry.asOf,
    nearby,
    stateAvgViolent: round1(stateAvgViolent),
    stateAvgProperty: round1(stateAvgProperty),
  };
}

/**
 * Every city gets a crime profile, never an empty page:
 *  - "major" tier cities use their own researched/qualitative data, or a
 *    same-state reference major's data if they have none of their own.
 *  - "lga" tier cities (no data at all) borrow their state's reference major
 *    city's entire profile, flagged via `estimatedFromMajor`.
 */
export async function getCrimeProfile(city: CityData): Promise<CrimeProfile> {
  const allCities = await getCitiesLive();

  if (city.tier === "major") {
    return buildMajorCrimeProfile(city, allCities);
  }

  const referenceCity = await getStateReferenceCity(city.stateSlug);
  if (!referenceCity) {
    // Should not happen (every state has a major), but fall back to a flat estimate rather than crash.
    const cfg = await getCrimeConfigLive();
    const est = estimateFromSafetyIndex(city);
    return {
      citySlug: city.slug,
      cityName: city.name,
      stateName: city.stateName,
      region: city.region,
      violentCrimeIndex: est.violentCrimeIndex,
      propertyCrimeIndex: est.propertyCrimeIndex,
      violentVsNationalPercent: round1(((est.violentCrimeIndex - cfg.nationalAvgViolentCrimeIndex) / cfg.nationalAvgViolentCrimeIndex) * 100),
      propertyVsNationalPercent: round1(((est.propertyCrimeIndex - cfg.nationalAvgPropertyCrimeIndex) / cfg.nationalAvgPropertyCrimeIndex) * 100),
      kidnappingRisk: "Low",
      terrorismRisk: "None",
      source: "national-estimate",
      nearby: [],
      stateAvgViolent: est.violentCrimeIndex,
      stateAvgProperty: est.propertyCrimeIndex,
    };
  }

  const majorProfile = await buildMajorCrimeProfile(referenceCity, allCities);
  return {
    ...majorProfile,
    citySlug: city.slug,
    cityName: city.name,
    stateName: city.stateName,
    region: city.region,
    estimatedFromMajor: true,
    majorCityName: referenceCity.name,
  };
}

/**
 * Plain-language read on a trend series, computed from the first vs. last
 * data point - not a fixed caption, so it updates automatically whenever
 * crime-history.json gets new rows added.
 */
export function describeTrend(values: number[], labelPlural: string, periodLabels: [string, string]): string {
  const first = values[0];
  const last = values[values.length - 1];
  const change = ((last - first) / first) * 100;
  const direction = change > 8 ? "risen" : change < -8 ? "fallen" : "stayed roughly flat";
  const magnitude = Math.abs(Math.round(change));
  if (direction === "stayed roughly flat") {
    return `${labelPlural} have ${direction} between ${periodLabels[0]} and ${periodLabels[1]}, moving only about ${magnitude}%.`;
  }
  return `${labelPlural} have ${direction} ${magnitude}% between ${periodLabels[0]} and ${periodLabels[1]}.`;
}
