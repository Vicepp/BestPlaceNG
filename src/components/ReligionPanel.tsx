import { Church, Star } from "lucide-react";
import type { CityData } from "@/data/cities";
import { getStateInsight, getReligionConfig, INSIGHTS_SOURCE } from "@/data/insights";
import ListingGroup from "@/components/ListingGroup";
import ComingSoon from "@/components/ComingSoon";

const BARS: { key: "christian" | "muslim" | "other"; label: string; color: string }[] = [
  { key: "christian", label: "Christian", color: "bg-brand" },
  { key: "muslim", label: "Muslim", color: "bg-blue-500" },
  { key: "other", label: "Traditional / Other", color: "bg-accent" },
];

export default async function ReligionPanel({ city }: { city: CityData }) {
  const [insight, religionCfg] = await Promise.all([getStateInsight(city.stateSlug), getReligionConfig()]);
  if (!insight?.religion) {
    return <ComingSoon topic="Religion" />;
  }

  const r = insight.religion;
  const stateLabel = city.stateName === "Federal Capital Territory" ? "the FCT" : `${city.stateName} State`;
  const dominant =
    r.christian > r.muslim + 20 ? "predominantly Christian"
    : r.muslim > r.christian + 20 ? "predominantly Muslim"
    : "religiously mixed, with sizeable Christian and Muslim communities living side by side";
  // Which denomination list to feature first, based on the state's majority faith.
  const christianFirst = r.christian >= r.muslim;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {city.name} is in {stateLabel}, which is <strong className="text-foreground">{dominant}</strong>. Around{" "}
          <strong className="text-foreground">{r.christian}%</strong> of residents identify as Christian,{" "}
          <strong className="text-foreground">{r.muslim}%</strong> as Muslim, and{" "}
          <strong className="text-foreground">{r.other}%</strong> follow traditional or other faiths. Religion plays a big
          role in daily life across Nigeria — expect active churches and mosques, religious public holidays, and faith-based
          community networks that are often the fastest way for newcomers to settle in.
        </p>
      </div>

      {/* Composition bars */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Church className="h-4 w-4 text-brand" />
          <h3 className="text-base font-bold text-foreground">Religious Composition ({stateLabel})</h3>
        </div>
        <div className="mt-4 space-y-3">
          {BARS.map((b) => (
            <div key={b.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{b.label}</span>
                <span className="font-semibold text-zinc-600">{r[b.key]}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.max(2, r[b.key])}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          State-level estimates — city-by-city breakdowns aren&apos;t published for Nigeria.{" "}
          {INSIGHTS_SOURCE.split("Religion:")[1]?.trim()}
        </p>
      </div>

      {/* Top denominations / groups nationally (which people usually attend) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(christianFirst ? ["christian", "muslim"] : ["muslim", "christian"]).map((faith) => {
          const list = faith === "christian" ? religionCfg.topChristianDenominations : religionCfg.topMuslimGroups;
          const title = faith === "christian" ? "Largest Christian Denominations" : "Largest Muslim Groups";
          return (
            <div key={faith} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                <h3 className="text-base font-bold text-foreground">{title}</h3>
              </div>
              <p className="mt-1 text-xs text-zinc-400">Most common across Nigeria — local presence varies by area.</p>
              <ol className="mt-3 space-y-2">
                {list.map((d, i) => (
                  <li key={d.name} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.name}</p>
                      <p className="text-xs text-zinc-500">{d.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      {/* Church listings in this city (user-addable) */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Churches in {city.name}</h3>
        <ListingGroup citySlug={city.slug} cityName={city.name} category="church" label="Church" />
      </div>

      {/* Mosque listings in this city (user-addable) */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Mosques in {city.name}</h3>
        <ListingGroup citySlug={city.slug} cityName={city.name} category="mosque" label="Mosque" />
      </div>
    </div>
  );
}
