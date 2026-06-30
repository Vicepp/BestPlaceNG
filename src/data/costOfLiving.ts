import { cities, getCitiesLive, type CityData } from "./cities";
import researchedRentData from "./researched-rent.json";
import stateRentFallbackData from "./state-rent-fallback.json";
import config from "./cost-of-living-config.json";
import { getFirestoreCollectionAsMap, getFirestoreDoc } from "@/lib/firestoreData";

/**
 * All cost-of-living figures used across the site are data, not formulas with
 * numbers buried inside them:
 *  - researched-rent.json    -> real, city-specific researched annual rent (edit/add cities here)
 *  - state-rent-fallback.json -> which researched city a non-researched major borrows from
 *  - cost-of-living-config.json -> the national baseline + category dampening factors
 * This file only contains the *logic* that resolves a city to its profile.
 */

interface ResearchedRentEntry {
  selfContain: number;
  oneBedroom: number;
  twoBedroom: number;
  threeBedroom: number;
  shop: number;
  asOf: string;
}

const STATIC_RESEARCHED_RENT = researchedRentData as Record<string, ResearchedRentEntry>;
const STATIC_STATE_FALLBACK_PROXY = stateRentFallbackData as Record<string, string>;
const STATIC_NATIONAL_BASELINE = config.nationalBaseline;
const STATIC_CATEGORY_DAMPENING = config.categoryDampening;

let liveRentCache: Record<string, ResearchedRentEntry> | null = null;
async function getResearchedRent(): Promise<Record<string, ResearchedRentEntry>> {
  if (liveRentCache) return liveRentCache;
  const remote = await getFirestoreCollectionAsMap<ResearchedRentEntry>("costOfLivingResearch");
  liveRentCache = remote && Object.keys(remote).length > 0 ? remote : STATIC_RESEARCHED_RENT;
  return liveRentCache;
}

async function getStateFallbackProxy(): Promise<Record<string, string>> {
  const remote = await getFirestoreDoc<Record<string, string>>("config", "stateRentFallback");
  return remote ?? STATIC_STATE_FALLBACK_PROXY;
}

async function getCostOfLivingConfig(): Promise<typeof STATIC_NATIONAL_BASELINE & { categoryDampening: typeof STATIC_CATEGORY_DAMPENING }> {
  const remote = await getFirestoreDoc<{ nationalBaseline: typeof STATIC_NATIONAL_BASELINE; categoryDampening: typeof STATIC_CATEGORY_DAMPENING }>("config", "costOfLiving");
  if (remote) return { ...remote.nationalBaseline, categoryDampening: remote.categoryDampening };
  return { ...STATIC_NATIONAL_BASELINE, categoryDampening: STATIC_CATEGORY_DAMPENING };
}

export type RentSource = "researched" | "state-reference" | "national-estimate";

export interface CostOfLivingCategory {
  label: string;
  city: number;
  state: number;
  country: number;
}

export interface CostOfLivingProfile {
  citySlug: string;
  cityName: string;
  stateName: string;
  score: number;
  vsNationalPercent: number;
  vsStatePercent: number;
  singleMonthly: number;
  familyMonthly: number;
  medianHomeCost: number;
  medianHomeVsNationalPercent: number;
  medianHomeVsStatePercent: number;
  twoBedroomRent: number;
  twoBedroomRentVsNationalPercent: number;
  twoBedroomRentVsStatePercent: number;
  rent: {
    selfContain: number;
    oneBedroom: number;
    twoBedroom: number;
    threeBedroom: number;
    shop: number;
  };
  rentSource: RentSource;
  rentSourceCityName?: string;
  rentAsOf?: string;
  categories: CostOfLivingCategory[];
  /** True when this whole profile is borrowed wholesale from a major city in the same state (LGA tier). */
  estimatedFromMajor?: boolean;
  majorCityName?: string;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function scaleAmount(base: number, index: number, dampen = 1) {
  const scaled = base * (1 + ((index - 100) / 100) * dampen);
  return Math.max(1000, Math.round(scaled / 1000) * 1000);
}

function scaleIndex(index: number, dampen: number) {
  return Math.round(100 + (index - 100) * dampen);
}

/** The major city used to represent a state when a specific city/LGA has no data of its own. Reads live city data with static fallback. */
export async function getStateReferenceCity(stateSlug: string): Promise<CityData | undefined> {
  const allCities = await getCitiesLive();
  const majors = allCities.filter((c) => c.tier === "major" && c.stateSlug === stateSlug);
  if (majors.length === 0) return undefined;
  return (
    majors.find((c) => c.isFederalCapital) ??
    majors.find((c) => c.isStateCapital) ??
    [...majors].sort((a, b) => b.population - a.population)[0]
  );
}

async function resolveRent(
  city: CityData,
  allCities: CityData[]
): Promise<{
  rent: Omit<ResearchedRentEntry, "asOf">;
  source: RentSource;
  sourceCityName?: string;
  asOf?: string;
}> {
  const [rentMap, proxyMap, cfg] = await Promise.all([getResearchedRent(), getStateFallbackProxy(), getCostOfLivingConfig()]);

  const own = rentMap[city.slug];
  if (own) {
    return { rent: own, source: "researched", asOf: own.asOf };
  }

  const proxySlug = proxyMap[city.slug];
  if (proxySlug && rentMap[proxySlug]) {
    const proxyCity = allCities.find((c) => c.slug === proxySlug);
    return {
      rent: rentMap[proxySlug],
      source: "state-reference",
      sourceCityName: proxyCity?.name,
      asOf: rentMap[proxySlug].asOf,
    };
  }

  const index = city.costOfLivingIndex ?? 100;
  return {
    rent: {
      selfContain: scaleAmount(cfg.rent.selfContain, index, 1.2),
      oneBedroom: scaleAmount(cfg.rent.oneBedroom, index, 1.2),
      twoBedroom: scaleAmount(cfg.rent.twoBedroom, index, 1.2),
      threeBedroom: scaleAmount(cfg.rent.threeBedroom, index, 1.2),
      shop: scaleAmount(cfg.rent.shop, index, 1.0),
    },
    source: "national-estimate",
  };
}

async function buildMajorProfile(city: CityData, allCities: CityData[]): Promise<CostOfLivingProfile> {
  const index = city.costOfLivingIndex!;
  const cfg = await getCostOfLivingConfig();

  const sameStateMajors = allCities.filter(
    (c) => c.tier === "major" && c.stateSlug === city.stateSlug && c.costOfLivingIndex !== undefined
  );
  const stateAvgIndex =
    sameStateMajors.reduce((sum, c) => sum + (c.costOfLivingIndex ?? 0), 0) / sameStateMajors.length;

  const medianHomeCost = scaleAmount(cfg.medianHomeCost, index, 1.1);
  const stateMedianHomeCost = scaleAmount(cfg.medianHomeCost, stateAvgIndex, 1.1);

  const { rent, source, sourceCityName, asOf } = await resolveRent(city, allCities);
  const twoBedroomRent = rent.twoBedroom;
  const stateTwoBedroomRent = scaleAmount(cfg.rent.twoBedroom, stateAvgIndex, 1.2);
  const d = cfg.categoryDampening;

  const categories: CostOfLivingCategory[] = [
    { label: "Overall", city: index, state: round1(stateAvgIndex), country: 100 },
    { label: "Housing", city: scaleIndex(index, d.housing), state: scaleIndex(stateAvgIndex, d.housing), country: 100 },
    { label: "Grocery", city: scaleIndex(index, d.grocery), state: scaleIndex(stateAvgIndex, d.grocery), country: 100 },
    { label: "Health", city: scaleIndex(index, d.health), state: scaleIndex(stateAvgIndex, d.health), country: 100 },
    { label: "Utilities", city: scaleIndex(index, d.utilities), state: scaleIndex(stateAvgIndex, d.utilities), country: 100 },
    { label: "Transportation", city: scaleIndex(index, d.transportation), state: scaleIndex(stateAvgIndex, d.transportation), country: 100 },
    { label: "Miscellaneous", city: scaleIndex(index, d.miscellaneous), state: scaleIndex(stateAvgIndex, d.miscellaneous), country: 100 },
  ];

  return {
    citySlug: city.slug,
    cityName: city.name,
    stateName: city.stateName,
    score: index,
    vsNationalPercent: round1(index - 100),
    vsStatePercent: round1(((index - stateAvgIndex) / stateAvgIndex) * 100),
    singleMonthly: scaleAmount(cfg.singleMonthly, index),
    familyMonthly: scaleAmount(cfg.familyMonthly, index),
    medianHomeCost,
    medianHomeVsNationalPercent: round1((index - 100) * 1.1),
    medianHomeVsStatePercent: round1(((medianHomeCost - stateMedianHomeCost) / stateMedianHomeCost) * 100),
    twoBedroomRent,
    twoBedroomRentVsNationalPercent: round1(((twoBedroomRent - cfg.rent.twoBedroom) / cfg.rent.twoBedroom) * 100),
    twoBedroomRentVsStatePercent: round1(((twoBedroomRent - stateTwoBedroomRent) / stateTwoBedroomRent) * 100),
    rent,
    rentSource: source,
    rentSourceCityName: sourceCityName,
    rentAsOf: asOf,
    categories,
  };
}

/**
 * Every city gets a cost-of-living profile — never an empty page:
 *  - "major" tier cities get their own researched/derived profile.
 *  - "lga" tier cities (no researched data of their own) borrow the *entire*
 *    profile from their state's reference major city, verbatim, clearly
 *    flagged via `estimatedFromMajor` + `majorCityName` so the UI can show a
 *    prominent "this is an estimate based on X" notice up front.
 *
 * Reads cities/rent/config live from Firestore with automatic static fallback.
 */
export async function getCostOfLivingProfile(city: CityData): Promise<CostOfLivingProfile | null> {
  const allCities = await getCitiesLive();

  if (city.tier === "major" && city.costOfLivingIndex !== undefined) {
    return buildMajorProfile(city, allCities);
  }

  const referenceCity = await getStateReferenceCity(city.stateSlug);
  if (!referenceCity || referenceCity.costOfLivingIndex === undefined) return null;

  const majorProfile = await buildMajorProfile(referenceCity, allCities);
  return {
    ...majorProfile,
    citySlug: city.slug,
    cityName: city.name,
    stateName: city.stateName,
    // The major's own rent figure might itself be researched, borrowed from a
    // different major, or a national estimate — pass that through honestly
    // rather than claiming "researched for {referenceCity}" when it isn't.
    rentSource: majorProfile.rentSource === "national-estimate" ? "national-estimate" : "state-reference",
    rentSourceCityName:
      majorProfile.rentSource === "national-estimate" ? undefined : majorProfile.rentSourceCityName ?? referenceCity.name,
    rentAsOf: majorProfile.rentSource === "national-estimate" ? undefined : majorProfile.rentAsOf,
    estimatedFromMajor: true,
    majorCityName: referenceCity.name,
  };
}

export function buildAiSummary(profile: CostOfLivingProfile): string {
  const direction = profile.score >= 100 ? "more expensive" : "more affordable";
  const diff = Math.abs(profile.vsNationalPercent).toFixed(1);
  return `The cost of living in ${profile.cityName}, ${profile.stateName} is relatively ${
    profile.score >= 100 ? "high" : "affordable"
  }. ${profile.cityName} carries a BestPlaceNG cost of living score of ${profile.score.toFixed(
    1
  )}, which is ${diff}% ${direction} than the Nigerian national average. A typical 2-bedroom flat rents for around ₦${profile.twoBedroomRent.toLocaleString()} per year, and a modest home in the area costs roughly ₦${profile.medianHomeCost.toLocaleString()}. Day-to-day costs such as groceries, transport, and utilities track ${
    profile.score >= 100 ? "somewhat higher" : "somewhat lower"
  } than average for Nigeria, making ${profile.cityName} ${
    profile.score >= 110 ? "a premium" : profile.score <= 85 ? "a budget-friendly" : "a moderately priced"
  } place to live relative to other major Nigerian cities.`;
}
