import type { CityData } from "@/data/cities";
import { getTransportProfile } from "@/data/infrastructure";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default async function TransportationPanel({ city }: { city: CityData }) {
  const p = await getTransportProfile(city);
  const t = p.cfg;

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {p.cityHighlight ? (
            <>
              <strong className="text-foreground">{city.name}:</strong> {p.cityHighlight}{" "}
            </>
          ) : (
            <>
              Getting around {city.name} means the classic Nigerian mix — shared minibuses and keke for daily runs,
              ride-hailing for comfort, okada where allowed.{" "}
            </>
          )}
          Petrol sells for about <strong className="text-foreground">₦{t.petrolPerLitreNaira}/litre</strong> and diesel about{" "}
          <strong className="text-foreground">₦{t.dieselPerLitreNaira}/litre</strong> — fuel is the single biggest input in
          every fare below.
        </p>
      </div>

      {/* Fuel */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Petrol (PMS)" value={`₦${t.petrolPerLitreNaira}/L`} sub="typical pump price" />
        <StatCard label="Diesel (AGO)" value={`₦${t.dieselPerLitreNaira}/L`} sub="typical pump price" />
      </div>
      <p className="-mt-3 text-xs text-zinc-400">{t.fuelNote}</p>

      {/* City modes & fares */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <h3 className="px-6 pt-6 text-base font-bold text-foreground">Getting around town</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-2 font-medium">Mode</th>
              <th className="px-6 py-2 font-medium">Typical fare</th>
              <th className="hidden px-6 py-2 font-medium sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {t.modes.map((m, i) => (
              <tr key={m.name} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-6 py-2.5 font-medium text-foreground">{m.name}</td>
                <td className="px-6 py-2.5 text-zinc-600">{m.typicalFare}</td>
                <td className="hidden px-6 py-2.5 text-zinc-500 sm:table-cell">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Intercity */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <h3 className="px-6 pt-6 text-base font-bold text-foreground">Travelling out of {city.name}</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-2 font-medium">Option</th>
              <th className="px-6 py-2 font-medium">Typical fare</th>
              <th className="hidden px-6 py-2 font-medium sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {t.intercity.map((m, i) => (
              <tr key={m.name} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-6 py-2.5 font-medium text-foreground">{m.name}</td>
                <td className="px-6 py-2.5 text-zinc-600">{m.typicalFare}</td>
                <td className="hidden px-6 py-2.5 text-zinc-500 sm:table-cell">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— Fares are <strong className="text-foreground">negotiable</strong> everywhere except BRT, rail and app rides — agree the price before entering.</li>
          <li>— Fuel price swings move fares within days; the figures above are a guide, not a promise.</li>
          <li>— For daily commuting costs in context, see the Cost of Living section&apos;s transport line.</li>
        </ul>
      </div>
    </div>
  );
}
