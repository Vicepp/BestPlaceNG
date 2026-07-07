import type { CityData } from "@/data/cities";
import { getPeopleStatsProfile } from "@/data/infrastructure";
import { getStateInsight } from "@/data/insights";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default async function PeopleStatsPanel({ city }: { city: CityData }) {
  const [p, insight] = await Promise.all([getPeopleStatsProfile(city), getStateInsight(city.stateSlug)]);
  const d = p.cfg;

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {city.name} is home to about <strong className="text-foreground">{city.population.toLocaleString()}</strong> people
          ({city.populationYear} est.), growing around{" "}
          <strong className="text-foreground">{city.growthRatePercent}% a year</strong> — ranked{" "}
          <strong className="text-foreground">#{city.rank}</strong> by population in our database. Like the rest of Nigeria,
          it&apos;s strikingly young: the national median age is just{" "}
          <strong className="text-foreground">{d.medianAgeYears} years</strong>, and{" "}
          <strong className="text-foreground">{d.under15SharePercent}%</strong> of the population is under 15. Households in the{" "}
          {city.region} average <strong className="text-foreground">{p.householdSize} people</strong>.
        </p>
      </div>

      {/* City stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Population" value={city.population.toLocaleString()} sub={`${city.populationYear} est.`} />
        <StatCard label="Annual growth" value={`${city.growthRatePercent}%`} />
        <StatCard label="Population rank" value={`#${city.rank}`} sub="in our database" />
        <StatCard label="LGA" value={city.lga} sub={`${city.stateName} State`} />
      </div>

      {/* National demographics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Median age (NG)" value={`${d.medianAgeYears} yrs`} sub="one of the world's youngest" />
        <StatCard label="Life expectancy" value={`${d.lifeExpectancyYears} yrs`} sub="WHO estimate" />
        <StatCard label={`Household size (${city.region})`} value={String(p.householdSize)} sub={`national avg ${d.avgHouseholdSize}`} />
        <StatCard label="Urban share (NG)" value={`${d.urbanSharePercent}%`} sub="and rising fast" />
      </div>

      {/* Languages */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Languages you&apos;ll hear in {city.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.languages.map((l) => (
            <span key={l} className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark">{l}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">{d.languagesNote}</p>
      </div>

      {/* Religion split (state-level) */}
      {insight && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Religious composition — {city.stateName} State</h3>
          <div className="mt-4 flex h-6 w-full overflow-hidden rounded-full">
            <div className="flex items-center justify-center bg-blue-500 text-[10px] font-bold text-white" style={{ width: `${insight.religion.christian}%` }}>
              {insight.religion.christian >= 12 ? `${insight.religion.christian}%` : ""}
            </div>
            <div className="flex items-center justify-center bg-green-600 text-[10px] font-bold text-white" style={{ width: `${insight.religion.muslim}%` }}>
              {insight.religion.muslim >= 12 ? `${insight.religion.muslim}%` : ""}
            </div>
            <div className="flex items-center justify-center bg-zinc-400 text-[10px] font-bold text-white" style={{ width: `${insight.religion.other}%` }}>
              {insight.religion.other >= 12 ? `${insight.religion.other}%` : ""}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Christian {insight.religion.christian}%</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-600" />Muslim {insight.religion.muslim}%</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-zinc-400" />Traditional / other {insight.religion.other}%</span>
          </div>
        </div>
      )}

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— Nigeria&apos;s fertility rate is <strong className="text-foreground">{d.fertilityRate} children per woman</strong> — cities like {city.name} keep growing even without migration.</li>
          <li>— Over half of Nigerians now live in urban areas, and the share rises every year — housing demand in {city.name} reflects that.</li>
          <li>— English works everywhere official; Pidgin works everywhere else.</li>
        </ul>
      </div>

      <p className="text-xs text-zinc-400">{d.peopleNote}</p>
    </div>
  );
}
