import Link from "next/link";
import { Home, ThumbsUp, ThumbsDown, Trophy, MapPin } from "lucide-react";
import { cities, type CityData } from "@/data/cities";
import { getCostOfLivingProfile, getStateReferenceCity } from "@/data/costOfLiving";
import { getJobsProfile } from "@/data/insights";
import { getEconomyProfile, getPeopleStatsProfile, getElectricityProfile, getCommuteProfile } from "@/data/infrastructure";
import { formatNaira } from "@/data/apartments";
import CityResearchCard from "@/components/CityResearchCard";

/** BestPlaces-style city overview: a warm relocation guide built entirely from
 * the app's database-backed data — lifestyle first, no politics (that lives in
 * its own section). Works for all 750+ cities via state-reference estimates. */
export default async function CityOverview({ city }: { city: CityData }) {
  // Cities without their own indices borrow their state reference city's, clearly labelled.
  const ref = city.costOfLivingIndex !== undefined ? city : (await getStateReferenceCity(city.stateSlug)) ?? city;
  const estimated = ref.slug !== city.slug;

  const [col, jobs, economy, people, power, commute] = await Promise.all([
    getCostOfLivingProfile(city),
    getJobsProfile(ref),
    getEconomyProfile(city),
    getPeopleStatsProfile(city),
    getElectricityProfile(city),
    getCommuteProfile(city),
  ]);

  const costIdx = ref.costOfLivingIndex;
  const safety = ref.safetyIndex;
  const school = ref.schoolRating;
  const climate = ref.climate;
  const costVs = costIdx !== undefined ? costIdx - 100 : undefined;

  /* ── Warm intro paragraph, generated from data ─────────────── */
  const character =
    costIdx !== undefined && costIdx <= 88 && (safety ?? 0) >= 75
      ? "one of Nigeria's best-value places to call home"
      : costIdx !== undefined && costIdx >= 115
      ? "a fast-paced city with big-city opportunities to match its costs"
      : (safety ?? 0) >= 80
      ? "a calm, welcoming place to settle"
      : "a city with plenty to offer new residents";
  const introParts: string[] = [];
  introParts.push(`Living in ${city.name}, ${city.stateName} State is a rewarding experience — ${character}.`);
  if (city.description) introParts.push(city.description);
  introParts.push(
    `Around ${city.population.toLocaleString()} people live here (${city.populationYear} est.), and everyday life runs on ${economy.keyIndustries.slice(0, 3).join(", ").toLowerCase() || "trade and services"}.`
  );
  if (climate) introParts.push(`Expect warm days around ${climate.tempHighC}°C, cooler nights near ${climate.tempLowC}°C, and a rainy season roughly ${climate.rainySeasonMonths}.`);
  if (costVs !== undefined)
    introParts.push(
      `The cost of living is about ${Math.abs(costVs)}% ${costVs <= 0 ? "lower" : "higher"} than the Nigerian average${estimated ? ` (estimated from ${ref.name}, the reference city for ${city.stateName} State)` : ""}, and you'll hear ${people.languages.slice(0, 2).join(" and ")} on the street alongside English.`
    );

  /* ── Rankings ──────────────────────────────────────────────── */
  const majors = cities.filter((c) => c.tier === "major");
  const rankIn = (arr: CityData[], val: (c: CityData) => number | undefined, asc: boolean) => {
    const list = arr.filter((c) => val(c) !== undefined).sort((a, b) => (asc ? val(a)! - val(b)! : val(b)! - val(a)!));
    const i = list.findIndex((c) => c.slug === city.slug);
    return i >= 0 ? { pos: i + 1, of: list.length } : null;
  };
  const stateCities = cities.filter((c) => c.stateSlug === city.stateSlug);
  const statePopRank = rankIn(stateCities, (c) => c.population, false);
  const affordRank = city.tier === "major" ? rankIn(majors, (c) => c.costOfLivingIndex, true) : null;
  const safetyRank = city.tier === "major" ? rankIn(majors, (c) => c.safetyIndex, false) : null;
  const schoolRank = city.tier === "major" ? rankIn(majors, (c) => c.schoolRating, false) : null;
  const rankings = [
    statePopRank && { label: `Largest cities in ${city.stateName}`, pos: statePopRank.pos, of: statePopRank.of },
    affordRank && { label: "Most affordable major cities", pos: affordRank.pos, of: affordRank.of },
    safetyRank && { label: "Safest major cities", pos: safetyRank.pos, of: safetyRank.of },
    schoolRank && { label: "Best major cities for schools", pos: schoolRank.pos, of: schoolRank.of },
  ].filter(Boolean) as { label: string; pos: number; of: number }[];

  /* ── Pros & cons, generated from data ──────────────────────── */
  const pros: string[] = [];
  const cons: string[] = [];
  if (costIdx !== undefined && costIdx <= 88) pros.push("Affordable cost of living");
  if ((safety ?? 0) >= 78) pros.push("Safer than most big cities");
  if ((school ?? 0) >= 6.8) pros.push("Strong schools & universities");
  if (power.gridHours >= 12) pros.push("Better-than-average power supply");
  if (commute.cityMinutes <= 30) pros.push("Easy daily commutes");
  if (climate && climate.tempHighC <= 30) pros.push("Milder climate than most of Nigeria");
  if (city.isStateCapital || city.isFederalCapital) pros.push("Capital-city amenities & institutions");
  if (city.growthRatePercent >= 3) pros.push("Fast-growing, plenty of new development");
  if (city.population < 400000) pros.push("Small-town, community feel");
  if (costIdx !== undefined && costIdx >= 110) cons.push("High housing & living costs");
  if (safety !== undefined && safety <= 68) cons.push("Security needs extra caution in places");
  if (power.gridHours <= 9) cons.push("Unreliable grid power — budget for backup");
  if (commute.cityMinutes >= 60) cons.push("Heavy traffic at peak hours");
  if (climate && climate.tempHighC >= 34) cons.push("Intense heat much of the year");
  if (climate && /march|april/i.test(climate.rainySeasonMonths) && /october|november/i.test(climate.rainySeasonMonths)) cons.push("Long rainy season — check flood-prone streets");
  if ((school ?? 10) <= 6) cons.push("Fewer top-tier school options");
  if (city.population > 3000000) cons.push("Big-city hustle, noise and crowds");
  if (cons.length < 3) cons.push("Rent is typically a full year upfront");
  if (pros.length < 3 && costIdx !== undefined && costIdx <= 100) pros.push("Money stretches further than the big hubs");
  if (pros.length < 3) pros.push("Growing rental market with new listings");

  /* ── Dig deeper paragraphs ─────────────────────────────────── */
  const dig: { title: string; text: string }[] = [
    {
      title: "The place",
      text: `${city.name} sits in ${city.lga} LGA, ${city.stateName} State, in Nigeria's ${city.region}. ${
        city.isFederalCapital ? "As the federal capital, it hosts the seat of national government and a large professional population." :
        city.isStateCapital ? `As the ${city.stateName} State capital, it concentrates the state's institutions, services and formal jobs.` :
        `It is one of ${city.stateName} State's ${stateCities.length} local government areas, within reach of ${ref.slug !== city.slug ? ref.name : "the state's main hubs"}.`
      }`,
    },
    {
      title: "Work & money",
      text: `The local economy leans on ${economy.keyIndustries.slice(0, 4).join(", ").toLowerCase() || "trade, services and agriculture"}. A typical monthly income here is roughly ${formatNaira(jobs.estMonthlyIncome)} (estimate scaled from national figures)${costVs !== undefined ? `, against living costs about ${Math.abs(costVs)}% ${costVs <= 0 ? "below" : "above"} the national average` : ""}. Informal work — trade, artisans, transport — is the backbone, as everywhere in Nigeria.`,
    },
    ...(climate ? [{
      title: "Weather to expect",
      text: `Days peak around ${climate.tempHighC}°C with nights near ${climate.tempLowC}°C. The rains run ${climate.rainySeasonMonths} — plan viewings and moving days around the heaviest months, and ask how a street handles storm water before you rent.`,
    }] : []),
    {
      title: "Daily life",
      text: `You'll get around by shared minibus, keke and ride-hailing; a typical one-way commute is about ${commute.cityMinutes} minutes${commute.isCitySpecific ? "" : " (estimate for a city this size)"}. Grid power averages ~${power.gridHours} hours a day via ${power.disco}, so most households keep an inverter, solar or generator as backup. ${people.languages.length ? `${people.languages.slice(0, 3).join(", ")} and English carry most conversations.` : ""}`,
    },
    {
      title: "Advice for new residents",
      text: `Budget for a full year's rent upfront plus agency and caution fees (often 10–20% extra in year one). Visit at rush hour and after rain before committing to an area, ask which electricity band the street is on, and check our ${city.name} sections for crime, schools and current listings before you decide.`,
    },
    {
      title: "The bottom line",
      text: `${city.name} offers ${costIdx !== undefined && costIdx <= 95 ? "genuine value for money" : "opportunity that justifies its costs"} with ${((safety ?? 75) >= 75) ? "a generally manageable safety picture" : "a safety picture that rewards choosing your neighbourhood carefully"}. For most movers it's ${((costIdx ?? 100) <= 95 && (safety ?? 0) >= 75) ? "an easy city to recommend" : "worth a shortlist spot — compare it side-by-side before deciding"}.`,
    },
  ];

  const annualSingle = col ? col.singleMonthly * 12 : undefined;
  const annualFamily = col ? col.familyMonthly * 12 : undefined;

  return (
    <div className="space-y-8">
      {/* Intro */}
      <p className="text-base leading-relaxed text-zinc-600">{introParts.join(" ")}</p>

      {/* Location details */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-foreground">Location Details</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
          <Detail label="State"><Link href={`/search?q=${encodeURIComponent(city.stateName)}`} className="font-medium text-brand hover:underline">{city.stateName}</Link></Detail>
          <Detail label="ZIP code">{city.zipCode ?? "—"}</Detail>
          <Detail label="LGA">{city.lga}</Detail>
          <Detail label="Cost of living">
            {costVs !== undefined ? (
              <span className={costVs <= 0 ? "font-semibold text-green-600" : "font-semibold text-red-500"}>
                {Math.abs(costVs)}% {costVs <= 0 ? "lower" : "higher"}{estimated ? "*" : ""}
              </span>
            ) : "—"}
          </Detail>
          <Detail label="Region">{city.region}</Detail>
          <Detail label="Time zone">West Africa Time (WAT, UTC+1)</Detail>
          <Detail label="Population">{city.population.toLocaleString()} ({city.populationYear} est.)</Detail>
          <Detail label="Growth">{city.growthRatePercent}% per year</Detail>
        </div>
        {estimated && <p className="mt-3 text-xs text-zinc-400">*Estimated from {ref.name}, the reference city for {city.stateName} State.</p>}
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <p className="flex items-center gap-2 text-base font-bold text-foreground"><Home className="h-4 w-4 text-brand" /> Looking for a home in {city.name}?</p>
          <p className="text-sm text-zinc-500">Browse apartments and houses listed directly by landlords.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/city/${city.slug}/apartments`} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">View listings</Link>
          <Link href="/list-property" className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">List a property</Link>
        </div>
      </div>

      {/* Cost of living mini-panel */}
      {col && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-foreground">{city.name} Cost of Living</h2>
            <Link href={`/city/${city.slug}/cost-of-living`} className="text-sm font-semibold text-brand">Full breakdown →</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat big={formatNaira(col.medianHomeCost)} label="Median home cost" vs={col.medianHomeVsNationalPercent} />
            <Stat big={`${formatNaira(Math.round(col.twoBedroomRent / 12 / 1000) * 1000)}/mo`} label="Monthly rent (2-bed)" vs={col.twoBedroomRentVsNationalPercent} sub="paid annually upfront" />
            <Stat big={formatNaira(jobs.estMonthlyIncome)} label="Typical monthly income" sub="estimate" />
          </div>
        </div>
      )}

      {/* Safety mini-panel */}
      {safety !== undefined && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-foreground">{city.name} Safety</h2>
            <Link href={`/city/${city.slug}/crime`} className="text-sm font-semibold text-brand">How safe is {city.name}? →</Link>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <p className="text-3xl font-extrabold text-foreground">{safety}<span className="text-base font-semibold text-zinc-400">/100</span></p>
            <div className="flex-1">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-green-500 opacity-30" />
              <div className="relative -mt-3 h-3">
                <div className="absolute top-0 h-3 w-1.5 rounded bg-foreground" style={{ left: `${Math.min(99, safety)}%` }} />
              </div>
              <p className="mt-2 text-xs text-zinc-400">Safety index — higher is safer; 100 is the national average{estimated ? ` (estimated from ${ref.name})` : ""}.</p>
            </div>
          </div>
        </div>
      )}

      {/* Minimum income */}
      {annualSingle !== undefined && annualFamily !== undefined && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Minimum annual income</h2>
          <p className="text-sm text-zinc-500">To live comfortably in {city.name}, {city.stateName}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-zinc-100 p-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-foreground">{formatNaira(annualFamily)}</p>
              <p className="text-xs text-zinc-400">for a family</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{formatNaira(annualSingle)}</p>
              <p className="text-xs text-zinc-400">for a single person</p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings */}
      {rankings.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><Trophy className="h-5 w-5 text-accent" /> {city.name} Rankings</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {rankings.map((r) => (
              <div key={r.label}>
                <p className="text-lg font-extrabold text-foreground">#{r.pos} <span className="text-sm font-semibold text-zinc-400">of {r.of}</span></p>
                <p className="text-xs text-zinc-500">{r.label}</p>
              </div>
            ))}
          </div>
          <Link href="/rankings" className="mt-4 inline-block text-sm font-semibold text-brand">See full rankings →</Link>
        </div>
      )}

      {/* Pros & Cons */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-foreground">Pros &amp; Cons of {city.name}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            {pros.slice(0, 3).map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-2.5 text-sm font-medium text-foreground">
                <ThumbsUp className="h-4 w-4 shrink-0 text-blue-500" /> {p}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {cons.slice(0, 3).map((c) => (
              <div key={c} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/40 px-4 py-2.5 text-sm font-medium text-foreground">
                <ThumbsDown className="h-4 w-4 shrink-0 text-red-400" /> {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dig deeper */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-foreground">Dig Deeper on {city.name}</h2>
        <div className="space-y-4">
          {dig.map((d) => (
            <p key={d.title} className="text-sm leading-relaxed text-zinc-600">
              <strong className="text-foreground">{d.title}. </strong>{d.text}
            </p>
          ))}
        </div>
      </div>

      {/* Latest researched update (headline + highlights; details live on section pages) */}
      <CityResearchCard city={city} />

      {/* Other cities in state */}
      <SameStateCities city={city} />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex justify-between gap-4 border-b border-zinc-50 pb-1.5 sm:justify-start">
      <span className="w-32 shrink-0 font-semibold text-zinc-400">{label}:</span>
      <span className="text-foreground">{children}</span>
    </p>
  );
}

function Stat({ big, label, vs, sub }: { big: string; label: string; vs?: number; sub?: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold text-foreground">{big}</p>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      {vs !== undefined && (
        <p className={`text-xs font-semibold ${vs <= 0 ? "text-green-600" : "text-red-500"}`}>
          {Math.abs(vs).toFixed(0)}% {vs <= 0 ? "lower" : "higher"} than avg
        </p>
      )}
      {sub && <p className="text-[11px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function SameStateCities({ city }: { city: CityData }) {
  const allSameState = cities.filter((c) => c.stateSlug === city.stateSlug && c.slug !== city.slug);
  const shown = allSameState.sort((a, b) => b.population - a.population).slice(0, 12);
  const moreCount = allSameState.length - shown.length;
  if (shown.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"><MapPin className="h-4 w-4 text-brand" /> Other cities in {city.stateName} State</h3>
      <div className="flex flex-wrap gap-2">
        {shown.map((c) => (
          <Link key={c.slug} href={`/city/${c.slug}`} className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-foreground/70 hover:border-brand hover:text-brand">
            {c.name}
          </Link>
        ))}
        {moreCount > 0 && (
          <Link href={`/search?q=${encodeURIComponent(city.stateName)}`} className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs text-zinc-400 hover:border-brand hover:text-brand">
            +{moreCount} more
          </Link>
        )}
      </div>
    </div>
  );
}
