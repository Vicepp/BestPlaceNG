import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { getCostOfLivingProfile, buildAiSummary } from "@/data/costOfLiving";
import type { CityData } from "@/data/cities";
import ComingSoon from "@/components/ComingSoon";

function naira(n: number) {
  return `₦${n.toLocaleString()}`;
}

function Delta({ percent }: { percent: number }) {
  const up = percent >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${up ? "text-red-600" : "text-green-600"}`}>
      {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      {Math.abs(percent).toFixed(1)}%
    </span>
  );
}

const RENT_UNITS: { key: "selfContain" | "oneBedroom" | "twoBedroom" | "threeBedroom" | "shop"; label: string }[] = [
  { key: "selfContain", label: "Self-Contain" },
  { key: "oneBedroom", label: "1 Bedroom Flat" },
  { key: "twoBedroom", label: "2 Bedroom Flat" },
  { key: "threeBedroom", label: "3 Bedroom Flat" },
  { key: "shop", label: "Shop / Small Office" },
];

export default async function CostOfLivingPanel({ city }: { city: CityData }) {
  const profile = await getCostOfLivingProfile(city);

  if (!profile) {
    return <ComingSoon topic="Cost of living" />;
  }

  const aiSummary = buildAiSummary(profile);
  const stateLabel = profile.stateName === "Federal Capital Territory" ? profile.stateName : `${profile.stateName} State`;
  const maxRent = Math.max(...RENT_UNITS.map((u) => profile.rent[u.key]));

  return (
    <div className="space-y-6">
      {profile.estimatedFromMajor && (
        <div className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            {city.name} doesn&apos;t have its own cost-of-living data yet, so everything below is borrowed from{" "}
            <strong>{profile.majorCityName}</strong>, the major city we&apos;ve researched in {stateLabel}. These
            numbers reflect {profile.majorCityName}, not an exact figure for {city.name} itself — use them as a
            general guide for planning a move to this area, not a precise quote.
          </p>
        </div>
      )}

      {/* How much do I need to live */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">
          How much do I need to live in {profile.cityName}, {profile.stateName}?
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-3xl font-extrabold text-brand-dark">
              {naira(profile.familyMonthly)}
              <span className="text-base font-normal text-zinc-400">/month</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              for a family, <Delta percent={profile.vsNationalPercent} /> than the national average. A total of{" "}
              {naira(profile.familyMonthly * 12)} for the year for a family.
            </p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand-dark">
              {naira(profile.singleMonthly)}
              <span className="text-base font-normal text-zinc-400">/month</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              for a single person, <Delta percent={profile.vsNationalPercent} /> than the national average. A total
              of {naira(profile.singleMonthly * 12)} for the year for a single person.
            </p>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">{profile.cityName} cost of living score</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-4xl font-extrabold text-brand-dark">{profile.score.toFixed(1)}</p>
            <p className="text-sm text-zinc-500">{profile.score >= 100 ? "More expensive" : "More affordable"}</p>
          </div>
          <div>
            <Delta percent={profile.vsNationalPercent} />
            <p className="text-sm text-zinc-500">than the Nigeria average</p>
          </div>
          <div>
            <Delta percent={profile.vsStatePercent} />
            <p className="text-sm text-zinc-500">than the {stateLabel} average</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600">
          {profile.cityName}, {profile.stateName} gets a BestPlaceNG cost of living score of {profile.score.toFixed(1)},
          which means the total cost of housing, food, transportation, healthcare, and other necessities is{" "}
          {Math.abs(profile.vsNationalPercent).toFixed(1)}% {profile.vsNationalPercent >= 0 ? "higher" : "lower"} than
          the Nigeria average and {Math.abs(profile.vsStatePercent).toFixed(1)}%{" "}
          {profile.vsStatePercent >= 0 ? "higher" : "lower"} than the average for {stateLabel}.
        </p>
      </div>

      {/* Housing costs + can I afford */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Housing costs in {profile.cityName}?</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          A typical home costs {naira(profile.medianHomeCost)}, which is{" "}
          <Delta percent={profile.medianHomeVsNationalPercent} /> than the national average and{" "}
          <Delta percent={profile.medianHomeVsStatePercent} /> than the {stateLabel} average. Renting a
          2-bedroom flat in {profile.cityName} costs {naira(profile.twoBedroomRent)} per year (rent in Nigeria is
          typically paid annually, not monthly), which is{" "}
          <Delta percent={profile.twoBedroomRentVsNationalPercent} /> than the national average and{" "}
          <Delta percent={profile.twoBedroomRentVsStatePercent} /> than the {stateLabel} average.
        </p>

        <h3 className="mt-6 text-base font-bold text-foreground">Can I afford {profile.cityName}?</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          To live comfortably in {profile.cityName}, {profile.stateName}, a minimum monthly income of{" "}
          {naira(profile.familyMonthly)} for a family, and {naira(profile.singleMonthly)} for a single person is
          recommended.
        </p>
      </div>

      {/* AI summary */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">What does AI say about {profile.cityName}?</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{aiSummary}</p>
      </div>

      {/* Categories table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-bold text-foreground">Cost of living score by category</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Higher than 100 is more expensive than the national average. Lower than 100 is less expensive.
          </p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-2 font-medium">Category</th>
              <th className="px-6 py-2 font-medium">{profile.cityName}</th>
              <th className="px-6 py-2 font-medium">{stateLabel}</th>
              <th className="px-6 py-2 font-medium">Nigeria</th>
            </tr>
          </thead>
          <tbody>
            {profile.categories.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-6 py-3 font-medium text-foreground">{row.label}</td>
                <td className="px-6 py-3 font-semibold text-brand-dark">{row.city.toFixed(1)}</td>
                <td className="px-6 py-3 text-zinc-500">{row.state.toFixed(1)}</td>
                <td className="px-6 py-3 text-zinc-500">{row.country.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-6 py-3 text-xs text-zinc-400">
          100 = National Average. Compare the {profile.cityName} column against State and Nigeria to see which
          categories drive the difference — here it&apos;s{" "}
          {[...profile.categories].filter((c) => c.label !== "Overall").sort((a, b) => Math.abs(b.city - 100) - Math.abs(a.city - 100))[0].label.toLowerCase()}{" "}
          that swings furthest from the national average, {profile.score >= 100 ? "pushing costs up" : "keeping costs down"} the most.
        </p>
      </div>

      {/* Average rent by unit type */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Average Rent by Unit Type (per year)</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Rent in Nigeria is almost always paid annually, not monthly — figures below are per year by common
          Nigerian unit types. These are averages, not exact quotes — actual prices vary by neighbourhood and
          finishing.
        </p>
        <div className="mt-5 space-y-4">
          {RENT_UNITS.map((u) => (
            <div key={u.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{u.label}</span>
                <span className="font-semibold text-brand-dark">{naira(profile.rent[u.key])}/year</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(4, Math.round((profile.rent[u.key] / maxRent) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
          {profile.rentSource === "researched" && (
            <>
              <span className="font-semibold text-foreground">Source:</span> Based on real estate listings and rent
              reports for {profile.cityName} ({profile.rentAsOf}).
            </>
          )}
          {profile.rentSource === "state-reference" && (
            <>
              <span className="font-semibold text-foreground">Source:</span> City-specific rent data for{" "}
              {profile.cityName} isn&apos;t available online yet, so these figures are based on{" "}
              {profile.rentSourceCityName} — the reference city we have researched data for in {stateLabel} ({profile.rentAsOf}). Use
              this as a general guide for {stateLabel}, not an exact quote for {profile.cityName}.
            </>
          )}
          {profile.rentSource === "national-estimate" && (
            <>
              <span className="font-semibold text-foreground">Source:</span> We haven&apos;t found published rent
              data for {profile.cityName} or a reference city in {stateLabel} yet, so these figures are estimated by
              comparing {profile.cityName}&apos;s cost-of-living index against the national average. Treat this as a
              rough starting point, not a market quote.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
