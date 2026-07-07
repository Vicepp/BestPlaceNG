import Link from "next/link";
import type { CityData } from "@/data/cities";
import { getEducationStatsProfile } from "@/data/infrastructure";
import { getWaecProfile } from "@/data/insights";
import TrendChart from "@/components/TrendChart";
import IndexBar from "@/components/IndexBar";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default async function EducationStatsPanel({ city }: { city: CityData }) {
  const [p, waec] = await Promise.all([getEducationStatsProfile(city), getWaecProfile()]);
  const e = p.cfg;
  const diff = p.stateLiteracy - p.nationalLiteracy;

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          Adult literacy in <strong className="text-foreground">{city.stateName} State</strong> is roughly{" "}
          <strong className="text-foreground">{p.stateLiteracy}%</strong> —{" "}
          {Math.abs(diff) < 3 ? (
            <>about the same as the national average of {p.nationalLiteracy}%</>
          ) : (
            <>
              <strong className="text-foreground">{Math.abs(diff)} points {diff >= 0 ? "above" : "below"}</strong> the national
              average of {p.nationalLiteracy}%
            </>
          )}
          . Nationally, {waec.latest}% of WAEC candidates earned five credits including English and Maths in {waec.asOf} — the
          benchmark for university admission that secondary schools in {city.name} work toward.
        </p>
      </div>

      {/* Literacy comparison */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:grid-cols-2">
        <IndexBar label={`${city.stateName} State literacy`} value={p.stateLiteracy} max={100} helpText={e.literacyMetric} />
        <IndexBar label="Nigeria literacy" value={p.nationalLiteracy} max={100} helpText="National adult literacy" />
      </div>

      {/* Tertiary landscape */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Universities" value={String(e.universities)} sub="nationwide" />
        <StatCard label="Polytechnics" value={String(e.polytechnics)} sub="nationwide" />
        <StatCard label="Colleges of Education" value={String(e.collegesOfEducation)} sub="nationwide" />
        <StatCard label="Primary enrollment" value={`${e.primaryEnrollmentPercent}%`} sub="net, UBEC est." />
      </div>
      <p className="-mt-3 text-xs text-zinc-400">{e.tertiaryNote}</p>

      {/* WAEC trend */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <TrendChart
          title={`WAEC pass rate — ${waec.metric}`}
          unit="%"
          series={waec.trend.map(([year, rate]) => ({ label: String(year), value: rate }))}
          color="#16a34a"
        />
        <p className="mt-3 text-xs text-zinc-400">{waec.source}</p>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— An estimated <strong className="text-foreground">{e.outOfSchoolChildrenMillions} million</strong> Nigerian children are out of school. {e.enrollmentNote.replace("UNICEF/UBEC estimates — ", "")}</li>
          <li>— Literacy and school quality vary far more <em>within</em> a state (urban vs rural) than the state average suggests — {city.name} itself will typically sit above the {city.stateName} State figure.</li>
          <li>— Looking for actual schools? See the{" "}
            <Link href={`/city/${city.slug}/school-ratings`} className="font-semibold text-brand">School Ratings</Link> section for schools listed in {city.name}.
          </li>
        </ul>
      </div>

      <p className="text-xs text-zinc-400">Source: {e.literacyMetric}</p>
    </div>
  );
}
