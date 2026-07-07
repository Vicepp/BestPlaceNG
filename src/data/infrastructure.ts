/**
 * City infrastructure & civic profiles: economy, education stats, people,
 * commute, internet, electricity, transportation and road condition.
 *
 * Every number lives in infrastructure-config.json (seeded to Firestore as
 * config/infrastructure, which takes precedence when present — edit it there
 * to change what the site shows). This file only contains the logic that
 * resolves a city to its profile: city override → state → region → tier
 * default, so no page is ever empty.
 */
import { getFirestoreDoc } from "@/lib/firestoreData";
import type { CityData } from "./cities";
import staticConfig from "./infrastructure-config.json";

/* ── Config shape ─────────────────────────────────────────────── */

export interface InfraConfig {
  _source: string;
  asOf: string;
  economy: {
    gdpTrillionNaira: number;
    gdpNote: string;
    gdpGrowthPercent: number;
    gdpGrowthYear: string;
    vatPercent: number;
    incomeTaxNote: string;
    inflationTrend: { year: number; rate: number }[];
    inflationNote: string;
    stateKeyIndustries: Record<string, string[]>;
    regionKeyIndustries: Record<string, string[]>;
  };
  education: {
    nationalLiteracyPercent: number;
    literacyMetric: string;
    universities: number;
    polytechnics: number;
    collegesOfEducation: number;
    tertiaryNote: string;
    primaryEnrollmentPercent: number;
    outOfSchoolChildrenMillions: number;
    enrollmentNote: string;
    stateLiteracy: Record<string, number>;
  };
  people: {
    medianAgeYears: number;
    lifeExpectancyYears: number;
    avgHouseholdSize: number;
    urbanSharePercent: number;
    fertilityRate: number;
    under15SharePercent: number;
    languagesNote: string;
    peopleNote: string;
    regionProfiles: Record<string, { householdSize: number; languages: string[] }>;
  };
  commute: {
    nationalAvgOneWayMinutes: number;
    commuteNote: string;
    tierDefaultMinutes: { major: number; lga: number };
    cityOneWayMinutes: Record<string, number>;
    modes: { name: string; sharePercent: number }[];
    modesNote: string;
  };
  internet: {
    internetSubscriptionsMillions: number;
    broadbandPenetrationPercent: number;
    avgMobileDownloadMbps: number;
    typicalDataCostPerGBNaira: number;
    internetNote: string;
    providers: { name: string; note: string }[];
    stateBroadbandPercent: Record<string, number>;
    regionBroadbandPercent: Record<string, number>;
  };
  electricity: {
    gridInstalledMW: number;
    gridTypicalDeliveredMW: number;
    gridNote: string;
    generatorHouseholdsPercent: number;
    bands: { band: string; hoursPerDay: string; tariffPerKWh: number }[];
    bandsNote: string;
    tierDefaultGridHours: { major: number; lga: number };
    cityAvgGridHours: Record<string, number>;
    gridHoursNote: string;
    discoByState: Record<string, string>;
  };
  transportation: {
    petrolPerLitreNaira: number;
    dieselPerLitreNaira: number;
    fuelNote: string;
    modes: { name: string; typicalFare: string; note: string }[];
    cityHighlights: Record<string, string>;
    intercity: { name: string; typicalFare: string; note: string }[];
  };
  roads: {
    totalNetworkKm: number;
    federalNetworkKm: number;
    pavedSharePercent: number;
    federalNeedingRehabPercent: number;
    roadsNote: string;
    flagshipProjects: string[];
    regionCondition: Record<string, { score: number; note: string }>;
    conditionMetric: string;
  };
}

const STATIC: InfraConfig = staticConfig as unknown as InfraConfig;

/** Live-with-fallback read of the whole infrastructure config. */
export async function getInfraConfig(): Promise<InfraConfig> {
  const remote = await getFirestoreDoc<InfraConfig>("config", "infrastructure");
  return remote?.economy ? remote : STATIC;
}

/* ── Per-section city profiles ────────────────────────────────── */

export interface EconomyProfile {
  cfg: InfraConfig["economy"];
  asOf: string;
  source: string;
  keyIndustries: string[];
  industriesScope: "state" | "region";
  latestInflation: number;
}

export async function getEconomyProfile(city: CityData): Promise<EconomyProfile> {
  const c = await getInfraConfig();
  const stateInd = c.economy.stateKeyIndustries[city.stateSlug];
  const trend = c.economy.inflationTrend;
  return {
    cfg: c.economy,
    asOf: c.asOf,
    source: c._source,
    keyIndustries: stateInd ?? c.economy.regionKeyIndustries[city.region] ?? [],
    industriesScope: stateInd ? "state" : "region",
    latestInflation: trend[trend.length - 1]?.rate ?? 0,
  };
}

export interface EducationStatsProfile {
  cfg: InfraConfig["education"];
  asOf: string;
  stateLiteracy: number;
  nationalLiteracy: number;
}

export async function getEducationStatsProfile(city: CityData): Promise<EducationStatsProfile> {
  const c = await getInfraConfig();
  return {
    cfg: c.education,
    asOf: c.asOf,
    stateLiteracy: c.education.stateLiteracy[city.stateSlug] ?? c.education.nationalLiteracyPercent,
    nationalLiteracy: c.education.nationalLiteracyPercent,
  };
}

export interface PeopleStatsProfile {
  cfg: InfraConfig["people"];
  asOf: string;
  householdSize: number;
  languages: string[];
}

export async function getPeopleStatsProfile(city: CityData): Promise<PeopleStatsProfile> {
  const c = await getInfraConfig();
  const region = c.people.regionProfiles[city.region];
  return {
    cfg: c.people,
    asOf: c.asOf,
    householdSize: region?.householdSize ?? c.people.avgHouseholdSize,
    languages: region?.languages ?? [],
  };
}

export interface CommuteProfile {
  cfg: InfraConfig["commute"];
  asOf: string;
  cityMinutes: number;
  isCitySpecific: boolean;
  nationalMinutes: number;
}

export async function getCommuteProfile(city: CityData): Promise<CommuteProfile> {
  const c = await getInfraConfig();
  const specific = c.commute.cityOneWayMinutes[city.slug];
  return {
    cfg: c.commute,
    asOf: c.asOf,
    cityMinutes: specific ?? c.commute.tierDefaultMinutes[city.tier],
    isCitySpecific: specific !== undefined,
    nationalMinutes: c.commute.nationalAvgOneWayMinutes,
  };
}

export interface InternetProfile {
  cfg: InfraConfig["internet"];
  asOf: string;
  broadbandPercent: number;
  broadbandScope: "state" | "region" | "national";
}

export async function getInternetProfile(city: CityData): Promise<InternetProfile> {
  const c = await getInfraConfig();
  const state = c.internet.stateBroadbandPercent[city.stateSlug];
  const region = c.internet.regionBroadbandPercent[city.region];
  return {
    cfg: c.internet,
    asOf: c.asOf,
    broadbandPercent: state ?? region ?? c.internet.broadbandPenetrationPercent,
    broadbandScope: state !== undefined ? "state" : region !== undefined ? "region" : "national",
  };
}

export interface ElectricityProfile {
  cfg: InfraConfig["electricity"];
  asOf: string;
  disco: string;
  gridHours: number;
  isCitySpecific: boolean;
}

export async function getElectricityProfile(city: CityData): Promise<ElectricityProfile> {
  const c = await getInfraConfig();
  const specific = c.electricity.cityAvgGridHours[city.slug];
  return {
    cfg: c.electricity,
    asOf: c.asOf,
    disco: c.electricity.discoByState[city.stateSlug] ?? "—",
    gridHours: specific ?? c.electricity.tierDefaultGridHours[city.tier],
    isCitySpecific: specific !== undefined,
  };
}

export interface TransportProfile {
  cfg: InfraConfig["transportation"];
  asOf: string;
  cityHighlight?: string;
}

export async function getTransportProfile(city: CityData): Promise<TransportProfile> {
  const c = await getInfraConfig();
  return {
    cfg: c.transportation,
    asOf: c.asOf,
    cityHighlight: c.transportation.cityHighlights[city.slug],
  };
}

export interface RoadsProfile {
  cfg: InfraConfig["roads"];
  asOf: string;
  regionScore: number;
  regionNote: string;
}

export async function getRoadsProfile(city: CityData): Promise<RoadsProfile> {
  const c = await getInfraConfig();
  const region = c.roads.regionCondition[city.region];
  return {
    cfg: c.roads,
    asOf: c.asOf,
    regionScore: region?.score ?? 45,
    regionNote: region?.note ?? "",
  };
}
