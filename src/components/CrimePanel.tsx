import Link from "next/link";
import { AlertTriangle, ShieldAlert, Calendar } from "lucide-react";
import { getCrimeProfile, getNotableIncidents, describeTrend, getCrimeHistoryLive, getCrimeConfigLive, type RiskLevel } from "@/data/crime";
import type { CityData } from "@/data/cities";
import TrendChart from "@/components/TrendChart";

function naira(n: number) {
  return n.toLocaleString();
}

const RISK_STYLES: Record<RiskLevel, string> = {
  None: "bg-zinc-100 text-zinc-500",
  Low: "bg-green-100 text-green-700",
  Moderate: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Severe: "bg-red-100 text-red-700",
};

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${RISK_STYLES[level]}`}>{level}</span>
  );
}

function ComparisonBars({
  label,
  city,
  state,
  country,
  max,
}: {
  label: string;
  city: number;
  state: number;
  country: number;
  max: number;
}) {
  const rows = [
    { label: "City", value: city, color: "bg-brand" },
    { label: "State", value: state, color: "bg-accent" },
    { label: "Nigeria", value: country, color: "bg-zinc-400" },
  ];
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-zinc-500">{r.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div className={`h-full rounded-full ${r.color}`} style={{ width: `${Math.max(4, Math.round((r.value / max) * 100))}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold text-foreground">{r.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CrimePanel({ city }: { city: CityData }) {
  const [profile, incidents, crimeHistory, crimeConfig] = await Promise.all([
    getCrimeProfile(city),
    getNotableIncidents(city),
    getCrimeHistoryLive(),
    getCrimeConfigLive(),
  ]);
  const NATIONAL_AVG_VIOLENT = crimeConfig.nationalAvgViolentCrimeIndex;
  const NATIONAL_AVG_PROPERTY = crimeConfig.nationalAvgPropertyCrimeIndex;
  const maxIndex = Math.max(profile.violentCrimeIndex, profile.propertyCrimeIndex, profile.stateAvgViolent, profile.stateAvgProperty, 60);

  return (
    <div className="space-y-6">
      {profile.estimatedFromMajor && (
        <div className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            {city.name} doesn&apos;t have its own crime data yet, so the figures below are borrowed from{" "}
            <strong>{profile.majorCityName}</strong>, the nearest major city we&apos;ve researched in {city.stateName}{" "}
            State. Use this as a general guide for the area, not an exact figure for {city.name} itself.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {profile.cityName}&apos;s violent crime index is rated{" "}
          <strong className="text-foreground">{profile.violentCrimeIndex}</strong>, which is{" "}
          <span className={profile.violentVsNationalPercent >= 0 ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
            {Math.abs(profile.violentVsNationalPercent).toFixed(0)}% {profile.violentVsNationalPercent >= 0 ? "above" : "below"}
          </span>{" "}
          the national average of {NATIONAL_AVG_VIOLENT}. The property crime index is rated{" "}
          <strong className="text-foreground">{profile.propertyCrimeIndex}</strong>, which is{" "}
          <span className={profile.propertyVsNationalPercent >= 0 ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
            {Math.abs(profile.propertyVsNationalPercent).toFixed(0)}% {profile.propertyVsNationalPercent >= 0 ? "above" : "below"}
          </span>{" "}
          average. Crime is ranked on a scale of 1 (low) to 100 (high).
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2">
          <p className="text-sm">
            <span className="font-bold text-foreground">{profile.cityName} violent crime is {profile.violentCrimeIndex}.</span>{" "}
            <span className="text-zinc-400">(Nigeria average is ~{NATIONAL_AVG_VIOLENT})</span>
          </p>
          <p className="text-sm">
            <span className="font-bold text-foreground">{profile.cityName} property crime is {profile.propertyCrimeIndex}.</span>{" "}
            <span className="text-zinc-400">(Nigeria average is ~{NATIONAL_AVG_PROPERTY})</span>
          </p>
        </div>
      </div>

      {profile.source !== "researched" && !profile.estimatedFromMajor && (
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
          <span className="font-semibold text-foreground">Note:</span>{" "}
          {profile.source === "qualitative" &&
            `${profile.cityName} doesn't have a published Numbeo crime index, so this is a researched qualitative estimate based on news/security reporting${profile.asOf ? ` (${profile.asOf})` : ""}, not a precise statistic.`}
          {profile.source === "state-reference" &&
            `${profile.cityName}-specific crime data isn't available, so these figures are based on ${profile.sourceCityName}, the reference city we have data for in ${profile.stateName} State.`}
          {profile.source === "national-estimate" &&
            `We haven't found published or qualitative crime data for ${profile.cityName} yet, so this is estimated from its general safety profile compared to the national average.`}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-foreground">Nigeria-Specific Risk Factors</h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-50 pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Kidnapping Risk</p>
              {profile.kidnappingNote && <p className="mt-1 text-sm text-zinc-600">{profile.kidnappingNote}</p>}
            </div>
            <RiskBadge level={profile.kidnappingRisk} />
          </div>
          <div className="flex items-start justify-between gap-4 border-b border-zinc-50 pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Terrorism / Insurgency Risk</p>
              {profile.terrorismNote && <p className="mt-1 text-sm text-zinc-600">{profile.terrorismNote}</p>}
            </div>
            <RiskBadge level={profile.terrorismRisk} />
          </div>
          {profile.policeConductNote && (
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
              <div>
                <p className="text-sm font-semibold text-foreground">Police Conduct</p>
                <p className="mt-1 text-sm text-zinc-600">{profile.policeConductNote}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <ComparisonBars label="Crime by Location" city={profile.violentCrimeIndex} state={profile.stateAvgViolent} country={NATIONAL_AVG_VIOLENT} max={maxIndex} />
        <div className="mt-5">
          <ComparisonBars label="" city={profile.propertyCrimeIndex} state={profile.stateAvgProperty} country={NATIONAL_AVG_PROPERTY} max={maxIndex} />
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Crime is ranked on a scale of 1 (low crime) to 100 (high crime). The green bar is {profile.cityName}, the
          orange bar is the {profile.stateName} State average, and the grey bar is the Nigeria average — so you can
          see at a glance whether {profile.cityName} runs {profile.violentCrimeIndex >= profile.stateAvgViolent ? "above" : "below"} its own state, and{" "}
          {profile.violentCrimeIndex >= NATIONAL_AVG_VIOLENT ? "above" : "below"} the national picture.
        </p>
      </div>

      {profile.nearby.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <div className="px-6 pt-6">
            <h3 className="text-base font-bold text-foreground">Crime in Nearby {profile.stateName} Cities</h3>
            <p className="mt-1 text-xs text-zinc-400">Other researched cities in {profile.stateName} State, for comparison.</p>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-6 py-2 font-medium">City</th>
                <th className="px-6 py-2 font-medium">Violent</th>
                <th className="px-6 py-2 font-medium">Property</th>
                <th className="px-6 py-2 font-medium">Population</th>
              </tr>
            </thead>
            <tbody>
              {profile.nearby.map((n, i) => (
                <tr key={n.slug} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-6 py-3 font-medium text-foreground">
                    <Link href={`/city/${n.slug}`} className="hover:text-brand">{n.name}</Link>
                  </td>
                  <td className="px-6 py-3 text-zinc-600">{n.violentCrimeIndex}</td>
                  <td className="px-6 py-3 text-zinc-600">{n.propertyCrimeIndex}</td>
                  <td className="px-6 py-3 text-zinc-500">{naira(n.population)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {incidents.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground">
            Notable Documented Incidents{profile.estimatedFromMajor ? ` (${profile.majorCityName})` : ""}
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Specific dated, sourced events reported in or near {profile.estimatedFromMajor ? profile.majorCityName : profile.cityName} — not a full incident log, just what we&apos;ve documented so far.
          </p>
          <div className="mt-4 space-y-4">
            {incidents
              .sort((a, b) => b.year - a.year)
              .map((inc, i) => (
                <div key={i} className="flex gap-3 border-b border-zinc-50 pb-4 last:border-b-0 last:pb-0">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {inc.month ? `${inc.month} ` : ""}
                      {inc.year} &middot; {inc.place} &middot; <span className="text-brand-dark">{inc.type}</span>
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">{inc.description}</p>
                    {(inc.victimCount || inc.murderCount || inc.robberyCount) && (
                      <p className="mt-1 text-xs font-medium text-zinc-500">
                        {inc.victimCount && `${inc.victimCount.toLocaleString()} affected`}
                        {inc.murderCount && `${inc.murderCount.toLocaleString()} murder cases`}
                        {inc.murderCount && inc.robberyCount && " · "}
                        {inc.robberyCount && `${inc.robberyCount.toLocaleString()} robbery cases`}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">Source: {inc.source}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Nigeria Crime Trend (National)</h3>
        <p className="mt-1 text-xs text-zinc-400">
          City- and state-level multi-year crime data isn&apos;t consistently published in Nigeria, so the trend
          below is at the national level — useful context for whether crime is rising or falling overall, alongside
          {" "}{profile.cityName}&apos;s own index above.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <TrendChart
              title="Kidnap Victims (12-month rolling windows)"
              series={crimeHistory.kidnappingTrend.map((k) => ({ label: k.period.replace(" - ", " -\n"), value: k.victims, sublabel: `${k.incidents} incidents` }))}
              color="#dc2626"
            />
            <p className="mt-3 text-xs text-zinc-400">
              Each bar is a 12-month window (not a calendar year) — the number of people reported kidnapped
              nationwide in that period.{" "}
              {describeTrend(
                crimeHistory.kidnappingTrend.map((k) => k.victims),
                "Kidnap victims",
                [crimeHistory.kidnappingTrend[0].period, crimeHistory.kidnappingTrend[crimeHistory.kidnappingTrend.length - 1].period]
              )}
            </p>
          </div>
          <div>
            <TrendChart
              title="Murder Cases Reported by Year"
              series={crimeHistory.national.filter((n) => n.murder).map((n) => ({ label: String(n.year), value: n.murder! }))}
            />
            <p className="mt-3 text-xs text-zinc-400">
              Each bar is the total number of murder cases the police recorded nationwide that calendar year.{" "}
              {(() => {
                const rows = crimeHistory.national.filter((n) => n.murder);
                return describeTrend(rows.map((n) => n.murder!), "Murder cases", [String(rows[0].year), String(rows[rows.length - 1].year)]);
              })()}
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs text-zinc-400">
          Sources: {crimeHistory.national[0]?.source} (annual police-reported case totals); {crimeHistory.kidnappingTrend[0]?.source} (independent open-source incident tracking, 12-month rolling windows rather than calendar years). The two series use different methodologies and aren&apos;t directly comparable to each other.
        </p>
      </div>
    </div>
  );
}
