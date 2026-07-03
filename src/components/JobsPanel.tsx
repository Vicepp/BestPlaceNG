import { Briefcase } from "lucide-react";
import type { CityData } from "@/data/cities";
import { getJobsProfile } from "@/data/insights";
import ListingGroup from "@/components/ListingGroup";
import TrendChart from "@/components/TrendChart";
import IndustryEarningsBars from "@/components/IndustryEarningsBars";

function naira(n: number) {
  return `₦${n.toLocaleString()}`;
}

export default async function JobsPanel({ city }: { city: CityData }) {
  const p = await getJobsProfile(city);
  const index = city.costOfLivingIndex ?? 100;

  const marketRead =
    index >= 105
      ? `${p.cityName} is one of Nigeria's higher-cost job markets, which usually goes hand in hand with more formal employment, larger companies, and better-paying roles — but also stiffer competition.`
      : index <= 85
      ? `${p.cityName} is an affordable job market — salaries run below the national big-city average, but so does the cost of living, so take-home pay often stretches further here.`
      : `${p.cityName} sits close to the national average as a job market — a balance of opportunity and affordability.`;

  const bestSector = p.sectors[0];
  const worstSector = p.sectors[p.sectors.length - 1];

  return (
    <div className="space-y-6">
      {/* Narrative intro — generated from the data, never a static string */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {marketRead} Nigeria&apos;s official unemployment rate is{" "}
          <strong className="text-foreground">{p.unemploymentRate}%</strong> ({p.asOf}, revised NBS methodology), with youth
          unemployment at <strong className="text-foreground">{p.youthUnemploymentRate}%</strong>. About{" "}
          <strong className="text-foreground">{p.informalEmploymentRate}%</strong> of working Nigerians are in informal
          employment — trade, artisan work, and self-employment dominate the real job market in every city, including {p.cityName}.
        </p>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— The national minimum wage is <strong className="text-foreground">{naira(p.minimumWageMonthly)}/month</strong> (2024 act).</li>
          <li>— A typical monthly income in {p.cityName} is roughly <strong className="text-foreground">{naira(p.estMonthlyIncome)}</strong> (estimate scaled from the national median of {naira(p.nationalMedianMonthlyIncome)}).</li>
          <li>— Best-paying sector: <strong className="text-foreground">{bestSector[0]}</strong> (~{naira(bestSector[1])}/month in {p.cityName}).</li>
          <li>— Lowest-paying sector: <strong className="text-foreground">{worstSector[0]}</strong> (~{naira(worstSector[1])}/month).</li>
        </ul>
      </div>

      {/* Unemployment Trends chart (national history) */}
      {p.unemploymentTrend.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <TrendChart
            title="Unemployment Trends — Nigeria (annual %)"
            unit="%"
            series={p.unemploymentTrend.map(([year, rate]) => ({ label: String(year), value: rate }))}
            color="#2563eb"
          />
          <p className="mt-3 text-xs text-zinc-400">{p.unemploymentNote}</p>
        </div>
      )}

      {/* Job Industry Earnings — horizontal hover bars */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Job Industry Earnings</h3>
            <p className="mt-1 text-xs text-zinc-400">Estimated average annual salary by sector in {p.cityName}. Hover a bar for the figure.</p>
          </div>
        </div>
        <IndustryEarningsBars sectors={p.sectors.map(([name, cityMonthly]) => ({ name, annual: cityMonthly * 12 }))} />
      </div>

      {/* Salary by sector table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-bold text-foreground">Average Monthly Salary by Sector</h3>
          <p className="mt-1 text-xs text-zinc-400">
            City figures are estimates — the national figure scaled by {p.cityName}&apos;s cost-of-living index. {p.source}
          </p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-2 font-medium">Sector</th>
              <th className="px-6 py-2 font-medium">{p.cityName} (est.)</th>
              <th className="px-6 py-2 font-medium">Nigeria</th>
            </tr>
          </thead>
          <tbody>
            {p.sectors.map(([name, cityVal, natVal], i) => (
              <tr key={name} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-6 py-2.5 font-medium text-foreground">{name}</td>
                <td className="px-6 py-2.5 text-zinc-600">{naira(cityVal)}</td>
                <td className="px-6 py-2.5 text-zinc-500">{naira(natVal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live job listings */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Briefcase className="h-4 w-4 text-brand" /> Open Jobs in {city.name}
        </h3>
        <ListingGroup citySlug={city.slug} cityName={city.name} category="job" label="Job" />
      </div>
    </div>
  );
}
