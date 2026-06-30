import type { CityData } from "./cities";
import { getStateReferenceCity } from "./costOfLiving";
import climateNormalsData from "./climate-normals.json";
import { getFirestoreCollectionAsMap } from "@/lib/firestoreData";

export interface MonthClimate {
  month: number; // 1-12
  avgHighC: number;
  avgLowC: number;
  avgPrecipMm: number;
  avgRainyDays: number;
  avgSunshineHoursPerDay: number;
  avgVeryHotDays: number; // days with a high of 35°C+
  avgHeavyRainDays: number; // days with 10mm+ rain
  avgSunnyDays: number; // days with 8+ hours of sunshine
  comfortIndex: number; // 0-10, our own derived metric, see computeComfortIndex
}

export interface ClimateProfile {
  citySlug: string;
  cityName: string;
  months: MonthClimate[];
  annualRainfallMm: number;
  annualRainyDays: number;
  annualVeryHotDays: number;
  annualHeavyRainDays: number;
  avgAnnualSunshineHoursPerDay: number;
  hottestMonth: MonthClimate;
  coldestMonth: MonthClimate;
  wettestMonth: MonthClimate;
  overallComfortIndex: number;
  source: "live" | "state-reference";
  sourceCityName?: string;
  estimatedFromMajor?: boolean;
  majorCityName?: string;
  asOf: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export { MONTH_NAMES };

type RawMonth = {
  month: number;
  avgHighC: number;
  avgLowC: number;
  avgPrecipMm: number;
  avgRainyDays: number;
  avgSunshineHoursPerDay: number;
  avgVeryHotDays?: number;
  avgHeavyRainDays?: number;
  avgSunnyDays?: number;
};
const STATIC_CLIMATE_NORMALS = climateNormalsData as Record<string, RawMonth[]>;

let liveClimateCache: Record<string, { months: RawMonth[] }> | null = null;
async function getClimateNormalsLive(): Promise<Record<string, RawMonth[]>> {
  if (liveClimateCache) return Object.fromEntries(Object.entries(liveClimateCache).map(([k, v]) => [k, v.months]));
  const remote = await getFirestoreCollectionAsMap<{ months: RawMonth[] }>("climateNormals");
  if (remote && Object.keys(remote).length > 0) {
    liveClimateCache = remote;
    return Object.fromEntries(Object.entries(remote).map(([k, v]) => [k, v.months]));
  }
  return STATIC_CLIMATE_NORMALS;
}

/** Today's month, 1-12 - drives the "right now" panel and chart highlighting. */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Our own derived comfort score (0-10, higher = more pleasant), not an official
 * index - built from how close the month's high/low sit to a comfortable
 * 21-29°C range, minus a penalty for frequent rain.
 */
function computeComfortIndex(m: RawMonth): number {
  const idealHigh = 28;
  const idealLow = 20;
  const tempPenalty = Math.abs(m.avgHighC - idealHigh) * 0.28 + Math.abs(m.avgLowC - idealLow) * 0.22;
  const rainPenalty = Math.min(3, (m.avgRainyDays / 31) * 4);
  const score = 10 - tempPenalty - rainPenalty;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function buildProfile(citySlug: string, cityName: string, raw: RawMonth[]): Omit<ClimateProfile, "source" | "sourceCityName" | "estimatedFromMajor" | "majorCityName"> {
  const months: MonthClimate[] = raw.map((m) => ({
    ...m,
    avgVeryHotDays: m.avgVeryHotDays ?? 0,
    avgHeavyRainDays: m.avgHeavyRainDays ?? 0,
    avgSunnyDays: m.avgSunnyDays ?? 0,
    comfortIndex: computeComfortIndex(m),
  }));
  const annualRainfallMm = Math.round(months.reduce((s, m) => s + m.avgPrecipMm, 0));
  const annualRainyDays = Math.round(months.reduce((s, m) => s + m.avgRainyDays, 0));
  const annualVeryHotDays = Math.round(months.reduce((s, m) => s + m.avgVeryHotDays, 0));
  const annualHeavyRainDays = Math.round(months.reduce((s, m) => s + m.avgHeavyRainDays, 0));
  const avgAnnualSunshineHoursPerDay = Math.round((months.reduce((s, m) => s + m.avgSunshineHoursPerDay, 0) / 12) * 10) / 10;
  const hottestMonth = [...months].sort((a, b) => b.avgHighC - a.avgHighC)[0];
  const coldestMonth = [...months].sort((a, b) => a.avgLowC - b.avgLowC)[0];
  const wettestMonth = [...months].sort((a, b) => b.avgPrecipMm - a.avgPrecipMm)[0];
  const overallComfortIndex = Math.round((months.reduce((s, m) => s + m.comfortIndex, 0) / 12) * 10) / 10;

  return {
    citySlug,
    cityName,
    months,
    annualRainfallMm,
    annualRainyDays,
    annualVeryHotDays,
    annualHeavyRainDays,
    avgAnnualSunshineHoursPerDay,
    hottestMonth,
    coldestMonth,
    wettestMonth,
    overallComfortIndex,
    asOf: "2021-2023 average (Open-Meteo historical archive)",
  };
}

/**
 * Every city gets a climate profile, never an empty page:
 *  - "major" tier cities with live-pulled normals use their own data.
 *  - everything else (LGA tier, or any major missing from the pulled dataset)
 *    borrows its state's reference major city's profile, flagged via `estimatedFromMajor`.
 */
export async function getClimateProfile(city: CityData): Promise<ClimateProfile | null> {
  const normals = await getClimateNormalsLive();
  const own = normals[city.slug];
  if (own) {
    return { ...buildProfile(city.slug, city.name, own), source: "live" };
  }

  const referenceCity = await getStateReferenceCity(city.stateSlug);
  const refData = referenceCity ? normals[referenceCity.slug] : undefined;
  if (!referenceCity || !refData) return null;

  const profile = buildProfile(city.slug, city.name, refData);
  return {
    ...profile,
    source: "state-reference",
    sourceCityName: referenceCity.name,
    estimatedFromMajor: true,
    majorCityName: referenceCity.name,
  };
}

export async function getAllClimateCitySlugs() {
  const normals = await getClimateNormalsLive();
  return Object.keys(normals);
}

function seasonLabel(months: number[]): string {
  const names = months.map((m) => MONTH_NAMES[m - 1].slice(0, 3));
  if (names.length === 1) return names[0];
  return `${names[0]} through ${names[names.length - 1]}`;
}

/**
 * Generates the climate overview paragraph entirely from the live-pulled data
 * in `profile` - nothing here is a fixed sentence with numbers spliced in, the
 * wording itself branches on the actual figures (how wet, how hot, how mild),
 * so updating climate-normals.json changes both the numbers AND the
 * description automatically.
 */
export function buildClimateSummary(profile: ClimateProfile): string {
  const subjectName = profile.estimatedFromMajor ? profile.majorCityName : profile.cityName;
  const wetMonths = profile.months.filter((m) => m.avgRainyDays >= 8).map((m) => m.month);
  const dryMonths = profile.months.filter((m) => m.avgRainyDays < 2).map((m) => m.month);
  const tempSwing = profile.hottestMonth.avgHighC - profile.coldestMonth.avgLowC;

  const heatLine =
    profile.hottestMonth.avgHighC >= 33
      ? `${subjectName} runs hot for much of the year, peaking around ${profile.hottestMonth.avgHighC}°C in ${MONTH_NAMES[profile.hottestMonth.month - 1]}`
      : profile.hottestMonth.avgHighC >= 29
      ? `Daytime temperatures in ${subjectName} stay warm year-round, topping out near ${profile.hottestMonth.avgHighC}°C in ${MONTH_NAMES[profile.hottestMonth.month - 1]}`
      : `${subjectName} is noticeably milder than most of Nigeria, with highs only reaching about ${profile.hottestMonth.avgHighC}°C even in its warmest month, ${MONTH_NAMES[profile.hottestMonth.month - 1]}`;

  const nightLine =
    profile.coldestMonth.avgLowC <= 16
      ? `nights can turn genuinely cool, dropping to around ${profile.coldestMonth.avgLowC}°C in ${MONTH_NAMES[profile.coldestMonth.month - 1]}`
      : `nights stay fairly mild even in the coolest stretch, rarely dropping below ${profile.coldestMonth.avgLowC}°C in ${MONTH_NAMES[profile.coldestMonth.month - 1]}`;

  const rainLine =
    wetMonths.length > 0
      ? dryMonths.length > 0
        ? `Rain is concentrated in a clear wet season around ${seasonLabel(wetMonths)}, while ${seasonLabel(dryMonths)} stays largely dry`
        : `Rain falls fairly often across most of the year, heaviest around ${seasonLabel(wetMonths)}`
      : `Rainfall is light and spread thinly across the year rather than arriving in a strong wet season`;

  const totals = `Altogether, ${subjectName} sees about ${profile.annualRainfallMm.toLocaleString()} mm of rain across roughly ${profile.annualRainyDays} days a year, with an average of ${profile.avgAnnualSunshineHoursPerDay} hours of sunshine a day.`;

  const comfortLine =
    profile.overallComfortIndex >= 7.5
      ? `Taken together, the climate here scores well on comfort (${profile.overallComfortIndex}/10) for most of the year.`
      : profile.overallComfortIndex >= 5.5
      ? `It balances out to a moderate comfort score of ${profile.overallComfortIndex}/10 — pleasant stretches, with a few more demanding months.`
      : `The swings between heat, humidity and rain bring the overall comfort score down to ${profile.overallComfortIndex}/10.`;

  const swingNote = tempSwing >= 14 ? ` Day-to-night and season-to-season temperature swings are wider here than in most Nigerian cities.` : "";

  const topComfort = [...profile.months].sort((a, b) => b.comfortIndex - a.comfortIndex).slice(0, 3);
  const pleasantNames = topComfort
    .sort((a, b) => a.month - b.month)
    .map((m) => MONTH_NAMES[m.month - 1]);
  const pleasantLine = ` The most pleasant stretch tends to be ${
    pleasantNames.length > 1 ? `${pleasantNames.slice(0, -1).join(", ")} and ${pleasantNames[pleasantNames.length - 1]}` : pleasantNames[0]
  }.`;

  return `${heatLine}, while ${nightLine}. ${rainLine}. ${totals}${swingNote} ${comfortLine}${pleasantLine}`;
}

/**
 * "Right now" read on the current calendar month, generated from the same
 * data - used for the "this month in {city}" callout on the climate page.
 */
export function buildCurrentMonthNote(profile: ClimateProfile): string {
  const idx = getCurrentMonth() - 1;
  const m = profile.months[idx];
  const subjectName = profile.estimatedFromMajor ? profile.majorCityName : profile.cityName;
  const monthName = MONTH_NAMES[idx];
  const rainNote =
    m.avgRainyDays >= 12
      ? `expect rain on roughly ${Math.round(m.avgRainyDays)} of the month's days`
      : m.avgRainyDays >= 3
      ? `there's a moderate chance of rain (~${Math.round(m.avgRainyDays)} days typically see some)`
      : `it's usually dry, with little to no rain expected`;
  return `In ${monthName}, ${subjectName} typically sees daytime highs around ${m.avgHighC}°C and overnight lows near ${m.avgLowC}°C, and ${rainNote}. This month rates ${m.comfortIndex}/10 on our comfort scale.`;
}
