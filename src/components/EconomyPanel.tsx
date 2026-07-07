import type { CityData } from "@/data/cities";
import { getEconomyProfile } from "@/data/infrastructure";
import { getJobsProfile } from "@/data/insights";
import TrendChart from "@/components/TrendChart";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default async function EconomyPanel({ city }: { city: CityData }) {
  const [p, jobs] = await Promise.all([getEconomyProfile(city), getJobsProfile(city)]);
  const e = p.cfg;
  const index = city.costOfLivingIndex;

  const localRead =
    index === undefined
      ? `${city.name} is part of ${city.stateName} State's economy — the figures below give the national picture plus what drives the local economy.`
      : index >= 110
      ? `${city.name} is one of Nigeria's higher-cost, higher-activity economies — more formal jobs and bigger companies, but daily life costs more too.`
      : index <= 85
      ? `${city.name} is an affordable economy by Nigerian standards — money stretches further here, with trade and agriculture doing much of the heavy lifting.`
      : `${city.name} sits close to the national average economically — a balance of opportunity and affordability.`;

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {localRead} Nigeria&apos;s economy is Africa&apos;s largest by rebased GDP —{" "}
          <strong className="text-foreground">₦{e.gdpTrillionNaira.toLocaleString()} trillion</strong> ({e.gdpNote.replace("Nominal GDP, ", "").replace(" — NBS rebased series (July 2025 release).", ", NBS rebased")}), growing at{" "}
          <strong className="text-foreground">{e.gdpGrowthPercent}%</strong> ({e.gdpGrowthYear}). Headline inflation ran at{" "}
          <strong className="text-foreground">{p.latestInflation}%</strong> in {e.inflationTrend[e.inflationTrend.length - 1]?.year} — the single
          biggest factor in how far a salary goes in {city.name}.
        </p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="GDP (Nigeria)" value={`₦${e.gdpTrillionNaira.toLocaleString()}trn`} sub="2024, rebased" />
        <StatCard label="GDP growth" value={`${e.gdpGrowthPercent}%`} sub={e.gdpGrowthYear} />
        <StatCard label="Inflation" value={`${p.latestInflation}%`} sub="latest annual avg" />
        <StatCard label="Unemployment" value={`${jobs.unemploymentRate}%`} sub={`${jobs.asOf}, ILO method`} />
      </div>

      {/* Key industries */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">
          What drives the economy {p.industriesScope === "state" ? `in ${city.stateName} State` : `across the ${city.region}`}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.keyIndustries.map((ind) => (
            <span key={ind} className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark">{ind}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          {p.industriesScope === "state"
            ? `Sectors that anchor jobs and trade in ${city.stateName} State, including ${city.name}.`
            : `State-level industry data for ${city.stateName} is pending — these are the ${city.region} region's anchor sectors.`}
        </p>
      </div>

      {/* Inflation trend */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <TrendChart
          title="Inflation — Nigeria (annual average %)"
          unit="%"
          series={e.inflationTrend.map((t) => ({ label: String(t.year), value: t.rate }))}
          color="#dc2626"
        />
        <p className="mt-3 text-xs text-zinc-400">{e.inflationNote}</p>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— VAT is <strong className="text-foreground">{e.vatPercent}%</strong> nationwide (there is no state sales tax like the US).</li>
          <li>— {e.incomeTaxNote}</li>
          <li>— The national minimum wage is <strong className="text-foreground">₦{jobs.minimumWageMonthly.toLocaleString()}/month</strong> (2024 act).</li>
          <li>— About <strong className="text-foreground">{jobs.informalEmploymentRate}%</strong> of working Nigerians are in informal work — trade, artisan services and self-employment are the real engine in {city.name}.</li>
        </ul>
      </div>

      <p className="text-xs text-zinc-400">Source: {p.source}</p>
    </div>
  );
}
