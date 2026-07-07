import type { CityData } from "@/data/cities";
import { getCommuteProfile } from "@/data/infrastructure";

export default async function CommutePanel({ city }: { city: CityData }) {
  const p = await getCommuteProfile(city);
  const c = p.cfg;
  const diff = p.cityMinutes - p.nationalMinutes;
  const maxMin = Math.max(p.cityMinutes, p.nationalMinutes, 90);

  const read =
    p.cityMinutes >= 70
      ? `Commuting is the defining daily struggle in ${city.name} — plan where you live around where you work, not the other way round.`
      : p.cityMinutes >= 45
      ? `Commutes in ${city.name} are substantial by national standards — living close to your daily route pays off.`
      : `Getting around ${city.name} is relatively painless by Nigerian big-city standards.`;

  return (
    <div className="space-y-6">
      {/* Narrative intro */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          A typical one-way commute in {city.name} runs about{" "}
          <strong className="text-foreground">{p.cityMinutes} minutes</strong>
          {p.isCitySpecific ? "" : " (estimated from cities of similar size)"} —{" "}
          {Math.abs(diff) <= 5 ? (
            <>right around the national urban average of {p.nationalMinutes} minutes.</>
          ) : (
            <>
              <strong className="text-foreground">{Math.abs(diff)} minutes {diff > 0 ? "longer" : "shorter"}</strong> than the
              national urban average of {p.nationalMinutes} minutes.
            </>
          )}{" "}
          {read}
        </p>
      </div>

      {/* Commute comparison bars */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-foreground">Average one-way commute</h3>
        {[
          { label: city.name, minutes: p.cityMinutes, color: "bg-brand" },
          { label: "Nigeria (urban average)", minutes: p.nationalMinutes, color: "bg-zinc-400" },
        ].map((row) => (
          <div key={row.label} className="mb-4 last:mb-0">
            <p className="mb-1 text-xs font-medium text-zinc-500">{row.label}</p>
            <div className="h-6 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`flex h-full items-center justify-end rounded-full px-3 ${row.color}`}
                style={{ width: `${Math.max(15, (row.minutes / maxMin) * 100)}%` }}
              >
                <span className="text-xs font-bold text-white">{row.minutes} min</span>
              </div>
            </div>
          </div>
        ))}
        <p className="mt-3 text-xs text-zinc-400">{c.commuteNote}</p>
      </div>

      {/* How people get to work */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-bold text-foreground">How people get around</h3>
          <p className="mt-1 text-xs text-zinc-400">{c.modesNote}</p>
        </div>
        <div className="mt-4 space-y-3 px-6 pb-6">
          {c.modes.map((m) => (
            <div key={m.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{m.name}</span>
                <span className="font-semibold text-zinc-500">{m.sharePercent}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(m.sharePercent / c.modes[0].sharePercent) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* You Should Know */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">You Should Know</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>— Rush hours run roughly <strong className="text-foreground">6:30–9:30am</strong> and <strong className="text-foreground">4:30–8pm</strong>; a 30-minute off-peak trip can triple in peak traffic.</li>
          <li>— Rain changes everything — flooded roads and surge-priced rides mean adding a buffer in the wet season.</li>
          <li>— &ldquo;Junction pricing&rdquo; is normal: fares on shared transport are quoted per stage, not per km.</li>
        </ul>
      </div>
    </div>
  );
}
