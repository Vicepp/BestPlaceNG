/**
 * Local answer engine for the assistant's OFFLINE path (when the AI API is
 * unreachable) — computes a genuine, data-grounded answer from the bundled
 * static datasets instead of the old generic "here is 1 place worth a look".
 *
 * Pure & synchronous so it runs instantly client-side. Uses the same static
 * data that seeds Firestore, so answers match the rest of the site.
 */
import { cities, type CityData } from "./cities";
import jobsConfig from "./jobs-config.json";
import stateInsights from "./state-insights.json";

export interface LocalAnswer {
  reply: string;
  citySlug?: string;
  section?: string;
}

const NAIRA = (n: number) => `₦${n.toLocaleString()}`;

/** Find the city the user is asking about — longest name match wins (so "port harcourt" beats "port"). */
export function detectCity(query: string): CityData | undefined {
  const q = query.toLowerCase();
  const matches = cities
    .filter((c) => q.includes(c.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length);
  return matches[0];
}

/** Resolve a city to the reference city that actually has stats (its state capital / major). */
function withStats(city: CityData): CityData {
  if (city.costOfLivingIndex !== undefined) return city;
  const major = cities
    .filter((c) => c.stateSlug === city.stateSlug && c.tier === "major" && c.costOfLivingIndex !== undefined)
    .sort((a, b) => b.population - a.population)[0];
  return major ?? city;
}

function jobsAnswer(city: CityData): string {
  const ref = withStats(city);
  const index = ref.costOfLivingIndex ?? 100;
  const d = jobsConfig.categoryDampening;
  const scaled = Object.entries(jobsConfig.sectorSalariesMonthly)
    .map(([name, nat]) => [name, Math.round((nat * (1 + ((index - 100) / 100) * d)) / 1000) * 1000] as [string, number])
    .sort((a, b) => b[1] - a[1]);
  const top = scaled[0];
  const bottom = scaled[scaled.length - 1];
  const via = ref.slug !== city.slug ? ` (based on ${ref.name}, the reference city for ${city.stateName})` : "";
  return `In ${city.name}${via}, the highest-paying sector is ${top[0]} at roughly ${NAIRA(top[1])}/month, while ${bottom[0]} pays around ${NAIRA(bottom[1])}/month. Nigeria's official unemployment rate is ${jobsConfig.national.unemploymentRate}% and the minimum wage is ${NAIRA(jobsConfig.national.minimumWageMonthly)}/month. Open the Jobs tab for the full salary-by-sector breakdown and live job listings.`;
}

function costAnswer(city: CityData): string {
  const ref = withStats(city);
  const index = ref.costOfLivingIndex;
  if (index === undefined) return `We don't have a cost-of-living index for ${city.name} yet.`;
  const vs = index - 100;
  const via = ref.slug !== city.slug ? ` (using ${ref.name}, the reference city for ${city.stateName} State)` : "";
  return `${city.name}${via} has a cost-of-living index of ${index} — that's ${Math.abs(vs).toFixed(0)}% ${vs >= 0 ? "above" : "below"} the Nigerian average of 100, making it ${index >= 110 ? "one of the pricier places to live" : index <= 88 ? "quite affordable" : "moderately priced"}. Open the Cost of Living tab for rent, food and transport detail.`;
}

function safetyAnswer(city: CityData): string {
  const ref = withStats(city);
  const s = ref.safetyIndex;
  if (s === undefined) return `We don't have a safety index for ${city.name} yet.`;
  const via = ref.slug !== city.slug ? ` (based on ${ref.name})` : "";
  return `${city.name}${via} scores ${s}/100 on our safety index (higher is safer; 100 is the national average) — ${s >= 78 ? "relatively safe by Nigerian standards" : s >= 60 ? "about average, take normal city precautions" : "below average, worth researching specific neighbourhoods"}. Open the Crime tab for details and documented incidents.`;
}

function schoolAnswer(city: CityData): string {
  const ref = withStats(city);
  const r = ref.schoolRating;
  if (r === undefined) return `We don't have a school rating for ${city.name} yet — check the School Ratings tab for listed schools nearby.`;
  const via = ref.slug !== city.slug ? ` (based on ${ref.name})` : "";
  return `${city.name}${via} rates ${r}/10 for schools — ${r >= 7.5 ? "one of the stronger education environments in Nigeria" : r >= 6 ? "a solid mix of public and private options" : "more limited than the big education hubs"}. Open the School Ratings tab for the list of schools and WAEC/NECO performance.`;
}

function climateAnswer(city: CityData): string {
  const ref = withStats(city);
  if (!ref.climate) return `We don't have climate detail for ${city.name} yet.`;
  const via = ref.slug !== city.slug ? ` (based on ${ref.name})` : "";
  return `${city.name}${via} typically sees daytime highs around ${ref.climate.tempHighC}°C and overnight lows near ${ref.climate.tempLowC}°C, with the rainy season around ${ref.climate.rainySeasonMonths}. Open the Climate tab for month-by-month charts.`;
}

function religionAnswer(city: CityData): string {
  const insight = (stateInsights as Record<string, { religion?: { christian: number; muslim: number; other: number } }>)[city.stateSlug];
  if (!insight?.religion) return `We don't have religion data for ${city.stateName} yet.`;
  const r = insight.religion;
  const dominant = r.christian > r.muslim + 20 ? "predominantly Christian" : r.muslim > r.christian + 20 ? "predominantly Muslim" : "religiously mixed";
  return `${city.name} is in ${city.stateName} State, which is ${dominant} — roughly ${r.christian}% Christian, ${r.muslim}% Muslim, and ${r.other}% traditional/other. Open the Religion tab to see churches and mosques listed nearby.`;
}

function politicsAnswer(city: CityData): string {
  const insight = (stateInsights as Record<string, { elections?: { year: number; party: string }[] }>)[city.stateSlug];
  if (!insight?.elections?.length) return `We don't have voting history for ${city.stateName} yet.`;
  const latest = insight.elections[insight.elections.length - 1];
  const parties = [...new Set(insight.elections.map((e) => e.party))];
  return `In the ${latest.year} presidential election, ${city.stateName} State was won by the ${latest.party}. ${parties.length >= 3 ? "It's a genuine swing state, having backed several different parties recently." : "It has been fairly consistent in recent elections."} Open the Politics & Voting tab for the full history.`;
}

/** Try to answer the query from local data. Returns null if no clear city+intent match. */
export function answerLocally(query: string): LocalAnswer | null {
  const q = query.toLowerCase();
  const city = detectCity(query);
  if (!city) return null;

  const intents: { keywords: string[]; section: string; fn: (c: CityData) => string }[] = [
    { keywords: ["job", "salary", "work", "employment", "paying", "earn", "wage", "income", "career"], section: "jobs", fn: jobsAnswer },
    { keywords: ["cost of living", "cost", "expensive", "cheap", "affordable", "budget", "rent", "price"], section: "cost-of-living", fn: costAnswer },
    { keywords: ["safe", "safety", "crime", "secure", "dangerous", "kidnap"], section: "crime", fn: safetyAnswer },
    { keywords: ["school", "education", "university", "student", "waec", "study"], section: "school-ratings", fn: schoolAnswer },
    { keywords: ["climate", "weather", "hot", "cold", "rain", "temperature"], section: "climate", fn: climateAnswer },
    { keywords: ["religion", "church", "mosque", "christian", "muslim", "worship"], section: "religion", fn: religionAnswer },
    { keywords: ["politic", "vote", "voting", "election", "party", "governor", "president"], section: "politics-voting", fn: politicsAnswer },
  ];

  for (const intent of intents) {
    if (intent.keywords.some((kw) => q.includes(kw))) {
      return { reply: intent.fn(city), citySlug: city.slug, section: intent.section };
    }
  }

  // City named but no specific intent — give a rounded overview.
  const ref = withStats(city);
  const bits: string[] = [];
  if (ref.costOfLivingIndex !== undefined) bits.push(`cost of living ${ref.costOfLivingIndex} (100=avg)`);
  if (ref.safetyIndex !== undefined) bits.push(`safety ${ref.safetyIndex}/100`);
  if (ref.schoolRating !== undefined) bits.push(`schools ${ref.schoolRating}/10`);
  return {
    reply: `${city.name} is in ${city.stateName} State${bits.length ? ` — ${bits.join(", ")}` : ""}. Ask me about cost of living, jobs, safety, schools, climate, religion or politics in ${city.name}, or open its city page for the full profile.`,
    citySlug: city.slug,
    section: "overview",
  };
}
