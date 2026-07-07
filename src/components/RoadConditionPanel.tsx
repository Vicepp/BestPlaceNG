import type { CityData } from "@/data/cities";
import { getRoadsProfile } from "@/data/infrastructure";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default async function RoadConditionPanel({ city }: { city: CityData }) {
  const p = await getRoadsProfile(city);
  const r = p.cfg;
  const regions = Object.entries(r.regionCondition).sort((a, b) => b[1].score - a[1].score);

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {city.name} sits in the <strong className="text-foreground">{city.region}</strong>, which scores{" "}
          <strong className="text-foreground">{p.regionScore}/100</strong> for road condition on our regional index.{" "}
          {p.regionNote} Nationally, Nigeria&apos;s road network spans about{" "}
          <strong className="text-foreground">{r.totalNetworkKm.toLocaleString()} km</strong>, of which roughly{" "}
          <strong className="text-foreground">{r.pavedSharePercent}%</strong> is paved — and about{" "}
          <strong className="text-foreground">{r.federalNeedingRehabPercent}%</strong> of federal roads need rehabilitation at
          any given time.
        </p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Road network" value={`${(r.totalNetworkKm / 1000).toFixed(0)}k km`} sub="all roads, Nigeria" />
        <StatCard label="Federal roads" value={`${(r.federalNetworkKm / 1000).toFixed(0)}k km`} sub="trunk network" />
        <StatCard label="Paved share" value={`${r.pavedSharePercent}%`} sub="engineering est." />
        <StatCard label="Needing rehab" value={`${r.federalNeedingRehabPercent}%`} sub="of federal roads" />
      </div>

      {/* Region comparison */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-foreground">Road condition by region</h3>
        <p className="mb-4 text-xs text-zinc-400">{r.conditionMetric}</p>
        <div className="space-y-3">
          {regions.map(([name, rc]) => {
            const isMine = name === city.region;
            return (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className={`font-medium ${isMine ? "font-bold text-brand-dark" : "text-foreground"}`}>
                    {name}{isMine ? ` — ${city.name}'s region` : ""}
                  </span>
                  <span className="font-semibold text-zinc-500">{rc.score}/100</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className={`h-full rounded-full ${isMine ? "bg-brand" : "bg-zinc-300"}`} style={{ width: `${rc.score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flagship projects */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">Big projects changing the map</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          {r.flagshipProjects.map((proj) => (
            <li key={proj}>— {proj}</li>
          ))}
        </ul>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— Road quality varies street by street: estate and GRA roads can be excellent while the approach road is not — inspect the <strong className="text-foreground">route to the property</strong>, in the rain if you can.</li>
          <li>— Wet season (roughly April–October in the south) is when bad roads show their true character.</li>
          <li>— {r.roadsNote}</li>
        </ul>
      </div>
    </div>
  );
}
