import { AlertTriangle, Calendar, CloudRain, Sun, Thermometer } from "lucide-react";
import { getClimateProfile, buildClimateSummary, buildCurrentMonthNote, getCurrentMonth, MONTH_NAMES } from "@/data/climate";
import ClimateLineChart from "@/components/ClimateLineChart";
import TrendChart from "@/components/TrendChart";
import ComingSoon from "@/components/ComingSoon";
import type { CityData } from "@/data/cities";

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <p className="text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default async function ClimatePanel({ city }: { city: CityData }) {
  const profile = await getClimateProfile(city);

  if (!profile) {
    return <ComingSoon topic="Climate" />;
  }

  const months = MONTH_NAMES.map((m) => m.slice(0, 3));
  const summary = buildClimateSummary(profile);
  const currentMonth = getCurrentMonth();
  const currentMonthData = profile.months[currentMonth - 1];
  const currentMonthNote = buildCurrentMonthNote(profile);

  return (
    <div className="space-y-6">
      {profile.estimatedFromMajor && (
        <div className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            {city.name} doesn&apos;t have its own weather station data, so the figures below are from{" "}
            <strong>{profile.majorCityName}</strong>, the nearest major city in {city.stateName} State with pulled
            climate data. Local conditions in {city.name} should be broadly similar, but may vary with elevation and
            distance.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">{summary}</p>
      </div>

      <div className="flex gap-3 rounded-2xl border border-brand/20 bg-brand-light p-4 text-sm text-brand-dark">
        <Calendar className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Right now: {MONTH_NAMES[currentMonth - 1]}</p>
          <p className="mt-0.5">{currentMonthNote}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Thermometer className="h-3.5 w-3.5" />} label="Hottest Month" value={`${profile.hottestMonth.avgHighC}°C`} sub={MONTH_NAMES[profile.hottestMonth.month - 1]} />
        <StatCard icon={<Thermometer className="h-3.5 w-3.5" />} label="Coldest Night" value={`${profile.coldestMonth.avgLowC}°C`} sub={MONTH_NAMES[profile.coldestMonth.month - 1]} />
        <StatCard icon={<CloudRain className="h-3.5 w-3.5" />} label="Annual Rainfall" value={`${profile.annualRainfallMm.toLocaleString()} mm`} sub={`~${profile.annualRainyDays} rainy days/yr`} />
        <StatCard icon={<Sun className="h-3.5 w-3.5" />} label="Avg Sunshine" value={`${profile.avgAnnualSunshineHoursPerDay} hrs/day`} sub={`Comfort score ${profile.overallComfortIndex}/10`} />
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <ClimateLineChart
          title={`Average Temperature in ${profile.cityName}`}
          unit="°C"
          series={[
            { label: "High", color: "#dc2626", values: profile.months.map((m) => m.avgHighC) },
            { label: "Low", color: "#2563eb", values: profile.months.map((m) => m.avgLowC) },
          ]}
          currentMonth={currentMonth}
        />
        <p className="mt-4 text-xs text-zinc-400">
          The red line is the average daytime high and the blue line is the average overnight low for each month
          (hover a point for exact figures). The highlighted column marked with a dot is the current month.{" "}
          {profile.cityName} is warmest around {MONTH_NAMES[profile.hottestMonth.month - 1]} ({profile.hottestMonth.avgHighC}°C)
          {" "}and coolest around {MONTH_NAMES[profile.coldestMonth.month - 1]} ({profile.coldestMonth.avgLowC}°C overnight).
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <TrendChart
          title={`Average Monthly Rainfall in ${profile.cityName} (mm)`}
          series={profile.months.map((m, i) => ({ label: months[i], value: m.avgPrecipMm }))}
          color="#0ea5e9"
          highlightIndex={currentMonth - 1}
        />
        <p className="mt-4 text-xs text-zinc-400">
          Taller bars mean more rain that month (hover a bar for the exact figure). {profile.cityName}&apos;s wettest
          month is typically {MONTH_NAMES[profile.wettestMonth.month - 1]} (~{profile.wettestMonth.avgPrecipMm} mm),
          while months showing 0 mm are part of the dry season with little to no rainfall.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <TrendChart
            title="Very Hot Days per Month (35°C+)"
            series={profile.months.map((m, i) => ({ label: months[i], value: m.avgVeryHotDays }))}
            color="#ea580c"
            highlightIndex={currentMonth - 1}
          />
          <p className="mt-4 text-xs text-zinc-400">
            Number of days each month with a high of 35°C or hotter. {profile.cityName} sees about{" "}
            {profile.annualVeryHotDays} such days a year in total
            {profile.annualVeryHotDays === 0 ? " — none of its months get that hot on average." : "."} (Nigeria
            doesn&apos;t get freezing days, so we track extreme heat here instead.)
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <TrendChart
            title="Heavy Rain Days per Month (10mm+)"
            series={profile.months.map((m, i) => ({ label: months[i], value: m.avgHeavyRainDays }))}
            color="#0284c7"
            highlightIndex={currentMonth - 1}
          />
          <p className="mt-4 text-xs text-zinc-400">
            Number of days each month with a substantial downpour (10mm or more), the kind that can disrupt travel.
            {" "}{profile.cityName} averages about {profile.annualHeavyRainDays} such days a year.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <TrendChart
          title="BestPlaceNG Comfort Index by Month (higher = more pleasant)"
          series={profile.months.map((m, i) => ({ label: months[i], value: m.comfortIndex }))}
          color="var(--brand)"
          highlightIndex={currentMonth - 1}
        />
        <p className="mt-4 text-xs text-zinc-400">
          Our own derived score (0-10), based on how close each month&apos;s temperatures sit to a comfortable
          21-29°C range, minus a penalty for frequent rain. Not an official metric. This month ({MONTH_NAMES[currentMonth - 1]})
          {" "}scores {currentMonthData.comfortIndex}/10.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-bold text-foreground">Month-by-Month Detail</h3>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-2 font-medium">Month</th>
              <th className="px-6 py-2 font-medium">High</th>
              <th className="px-6 py-2 font-medium">Low</th>
              <th className="px-6 py-2 font-medium">Rainfall</th>
              <th className="px-6 py-2 font-medium">Rainy Days</th>
            </tr>
          </thead>
          <tbody>
            {profile.months.map((m, i) => (
              <tr
                key={m.month}
                className={m.month === currentMonth ? "bg-brand-light" : i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}
              >
                <td className="px-6 py-2.5 font-medium text-foreground">
                  {MONTH_NAMES[m.month - 1]}
                  {m.month === currentMonth ? " (this month)" : ""}
                </td>
                <td className="px-6 py-2.5 text-zinc-600">{m.avgHighC}°C</td>
                <td className="px-6 py-2.5 text-zinc-600">{m.avgLowC}°C</td>
                <td className="px-6 py-2.5 text-zinc-600">{m.avgPrecipMm} mm</td>
                <td className="px-6 py-2.5 text-zinc-500">{m.avgRainyDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-6 py-3 text-xs text-zinc-400">
          Source: Open-Meteo historical weather archive, {profile.asOf}
          {profile.estimatedFromMajor ? ` for ${profile.majorCityName}` : ""}.
        </p>
      </div>
    </div>
  );
}
