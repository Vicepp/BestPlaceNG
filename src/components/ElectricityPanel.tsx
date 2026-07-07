import type { CityData } from "@/data/cities";
import { getElectricityProfile } from "@/data/infrastructure";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default async function ElectricityPanel({ city }: { city: CityData }) {
  const p = await getElectricityProfile(city);
  const e = p.cfg;
  const pct = Math.round((p.gridHours / 24) * 100);

  const read =
    p.gridHours >= 14
      ? `${city.name} gets comparatively good grid supply — many neighbourhoods are on better feeders, and backup power is a convenience rather than a lifeline.`
      : p.gridHours >= 9
      ? `Grid power in ${city.name} is usable but unreliable — most households and businesses plan around outages with inverters, solar or generators.`
      : `Grid supply in ${city.name} is thin — solar-plus-inverter setups and generators do much of the real work here.`;

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          Homes in {city.name} average roughly{" "}
          <strong className="text-foreground">{p.gridHours} hours of grid power a day</strong>
          {p.isCitySpecific ? "" : " (estimated for cities of this size)"}, supplied by{" "}
          <strong className="text-foreground">{p.disco}</strong>. {read}
        </p>
      </div>

      {/* Grid hours meter */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-base font-bold text-foreground">Average daily grid supply</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{p.gridHours} of 24 hours</span>
          <span className="font-semibold text-brand">{pct}%</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-400">{e.gridHoursNote}</p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Your DisCo" value={p.disco.split(" (")[0]} sub={`${city.stateName} State`} />
        <StatCard label="Grid capacity" value={`${(e.gridInstalledMW / 1000).toFixed(1)}GW`} sub="installed, Nigeria" />
        <StatCard label="Typically delivered" value={`${(e.gridTypicalDeliveredMW / 1000).toFixed(1)}GW`} sub="nationwide" />
        <StatCard label="Homes with gen" value={`${e.generatorHouseholdsPercent}%`} sub="backup power, est." />
      </div>

      {/* Tariff bands */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-bold text-foreground">Electricity tariff bands</h3>
          <p className="mt-1 text-xs text-zinc-400">{e.bandsNote}</p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-2 font-medium">Band</th>
              <th className="px-6 py-2 font-medium">Promised supply</th>
              <th className="px-6 py-2 font-medium">Tariff</th>
            </tr>
          </thead>
          <tbody>
            {e.bands.map((b, i) => (
              <tr key={b.band} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-6 py-2.5 font-semibold text-foreground">Band {b.band}</td>
                <td className="px-6 py-2.5 text-zinc-600">{b.hoursPerDay}</td>
                <td className="px-6 py-2.5 text-zinc-600">₦{b.tariffPerKWh}/kWh</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— Before renting, ask <strong className="text-foreground">which band the street&apos;s feeder is on</strong> — it determines both your light hours and your tariff.</li>
          <li>— &ldquo;Estate power&rdquo; (shared generator/solar) is common in serviced apartments and adds ₦20,000–₦100,000+/month to service charges.</li>
          <li>— {e.gridNote}</li>
        </ul>
      </div>
    </div>
  );
}
