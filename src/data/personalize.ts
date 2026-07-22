import { cities, type CityData } from "@/data/cities";
import { getInfraConfig } from "@/data/infrastructure";

/** One metric in the "Where should I move?" weighted-ranking tool. `invert`
 * means a LOWER raw value scores better (cost, commute). */
export const METRICS = [
  { key: "cost", label: "Cost of Living", invert: true, hint: "National average = 100. Lower is cheaper." },
  { key: "safety", label: "Safety", invert: false, hint: "National average = 100. Higher is safer." },
  { key: "schools", label: "Schools", invert: false, hint: "Rated out of 10 by our school-quality index." },
  { key: "climate", label: "Climate Comfort", invert: false, hint: "How close to a mild, dry climate — derived from average temperature and rainy-season length." },
  { key: "power", label: "Power Supply", invert: false, hint: "Average grid electricity hours per day." },
  { key: "internet", label: "Internet", invert: false, hint: "State/region broadband penetration." },
  { key: "commute", label: "Commute", invert: true, hint: "Typical one-way commute time, in minutes. Lower is better." },
  { key: "growth", label: "Growth", invert: false, hint: "Population growth rate per year — a proxy for economic momentum." },
] as const;

export type MetricKey = (typeof METRICS)[number]["key"];

export interface PersonalizeCity {
  slug: string;
  name: string;
  stateName: string;
  population: number;
  tier: "major" | "lga";
  estimated: boolean;
  metrics: Record<MetricKey, number>;
}

/** Derives a 0-10 "how pleasant is this climate" score from temperature and
 * rainy-season length — never invents a number the dataset doesn't support. */
function climateComfort(climate?: CityData["climate"]): number {
  if (!climate) return 5;
  const avg = (climate.tempHighC + climate.tempLowC) / 2;
  const spread = climate.tempHighC - climate.tempLowC;
  const rainyMonths = (climate.rainySeasonMonths.match(/[A-Za-z]+/g) ?? []).length >= 2 ? 6 : 4;
  const score = 10 - Math.abs(avg - 25) * 0.55 - spread * 0.12 - Math.max(0, rainyMonths - 5) * 0.35;
  return Math.max(0, Math.min(10, score));
}

/** Builds the full scoreable city list (all 1,048 places) in one pass. LGA-tier
 * cities without their own researched figures borrow their state's reference
 * major city's stats, flagged via `estimated` — same fallback the city pages use. */
export async function getPersonalizeCities(): Promise<PersonalizeCity[]> {
  const cfg = await getInfraConfig();
  const majors = cities.filter((c) => c.tier === "major");

  const refByState = new Map<string, CityData>();
  for (const stateSlug of new Set(majors.map((c) => c.stateSlug))) {
    const inState = majors.filter((c) => c.stateSlug === stateSlug);
    const ref =
      inState.find((c) => c.isFederalCapital) ??
      inState.find((c) => c.isStateCapital) ??
      [...inState].sort((a, b) => b.population - a.population)[0];
    if (ref) refByState.set(stateSlug, ref);
  }

  return cities.map((c) => {
    const ref = c.tier === "major" ? c : refByState.get(c.stateSlug) ?? c;
    const power = cfg.electricity.cityAvgGridHours[c.slug] ?? cfg.electricity.tierDefaultGridHours[c.tier];
    const internet =
      cfg.internet.stateBroadbandPercent[c.stateSlug] ??
      cfg.internet.regionBroadbandPercent[c.region] ??
      cfg.internet.broadbandPenetrationPercent;
    const commute = cfg.commute.cityOneWayMinutes[c.slug] ?? cfg.commute.tierDefaultMinutes[c.tier];

    return {
      slug: c.slug,
      name: c.name,
      stateName: c.stateName,
      population: c.population,
      tier: c.tier,
      estimated: c.tier === "lga",
      metrics: {
        cost: c.costOfLivingIndex ?? ref.costOfLivingIndex ?? 100,
        safety: c.safetyIndex ?? ref.safetyIndex ?? 70,
        schools: c.schoolRating ?? ref.schoolRating ?? 6,
        climate: climateComfort(c.climate ?? ref.climate),
        power,
        internet,
        commute,
        growth: c.growthRatePercent,
      },
    };
  });
}
