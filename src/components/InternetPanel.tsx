import type { CityData } from "@/data/cities";
import { getInternetProfile } from "@/data/infrastructure";
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

export default async function InternetPanel({ city }: { city: CityData }) {
  const p = await getInternetProfile(city);
  const n = p.cfg;

  const scopeLabel =
    p.broadbandScope === "state" ? `${city.stateName} State` : p.broadbandScope === "region" ? `${city.region} (regional est.)` : "Nigeria";

  const read =
    p.broadbandPercent >= 55
      ? `${city.name} sits in one of Nigeria's best-connected corridors — 4G is standard, 5G is live in parts, and fibre-to-home is available in many estates.`
      : p.broadbandPercent >= 40
      ? `Connectivity in ${city.name} is solid by national standards — 4G covers the city proper, though speeds dip at peak hours.`
      : `Connectivity in ${city.name} trails the national leaders — 4G works in town, but coverage thins out quickly beyond it. Starlink has become a popular fallback.`;

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {read} Broadband penetration in {scopeLabel} is around{" "}
          <strong className="text-foreground">{p.broadbandPercent}%</strong>, against a national figure of{" "}
          <strong className="text-foreground">{n.broadbandPenetrationPercent}%</strong>. Average mobile download speeds
          nationwide run about <strong className="text-foreground">{n.avgMobileDownloadMbps} Mbps</strong>, and a gigabyte of
          data costs roughly <strong className="text-foreground">₦{n.typicalDataCostPerGBNaira}</strong> on typical bundles.
        </p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Internet subs (NG)" value={`${n.internetSubscriptionsMillions}M`} sub="NCC" />
        <StatCard label={`Broadband (${p.broadbandScope})`} value={`${p.broadbandPercent}%`} sub={scopeLabel} />
        <StatCard label="Avg mobile speed" value={`${n.avgMobileDownloadMbps} Mbps`} sub="download, national" />
        <StatCard label="Data cost" value={`₦${n.typicalDataCostPerGBNaira}/GB`} sub="typical bundle" />
      </div>

      {/* Broadband comparison */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:grid-cols-2">
        <IndexBar label={scopeLabel} value={p.broadbandPercent} max={100} helpText="Broadband penetration" />
        <IndexBar label="Nigeria" value={n.broadbandPenetrationPercent} max={100} helpText="National broadband penetration" />
      </div>

      {/* Providers */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <h3 className="px-6 pt-6 text-base font-bold text-foreground">Who provides internet in {city.name}</h3>
        <div className="mt-3 divide-y divide-zinc-50">
          {n.providers.map((pr) => (
            <div key={pr.name} className="flex flex-col gap-0.5 px-6 py-3">
              <p className="text-sm font-semibold text-foreground">{pr.name}</p>
              <p className="text-xs text-zinc-500">{pr.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— Most homes run on <strong className="text-foreground">mobile data or 4G routers</strong>, not fixed lines — check which network is strongest on your exact street before signing a lease.</li>
          <li>— Power cuts take down home Wi-Fi; remote workers keep a phone-hotspot plan on a second network as backup.</li>
          <li>— {n.internetNote}</li>
        </ul>
      </div>
    </div>
  );
}
