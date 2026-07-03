import { Church } from "lucide-react";
import type { CityData } from "@/data/cities";
import { getStateInsight, INSIGHTS_SOURCE } from "@/data/insights";
import ComingSoon from "@/components/ComingSoon";

const BARS: { key: "christian" | "muslim" | "other"; label: string; color: string }[] = [
  { key: "christian", label: "Christian", color: "bg-brand" },
  { key: "muslim", label: "Muslim", color: "bg-blue-500" },
  { key: "other", label: "Traditional / Other", color: "bg-accent" },
];

export default async function ReligionPanel({ city }: { city: CityData }) {
  const insight = await getStateInsight(city.stateSlug);
  if (!insight?.religion) {
    return <ComingSoon topic="Religion" />;
  }

  const r = insight.religion;
  const stateLabel = city.stateName === "Federal Capital Territory" ? "the FCT" : `${city.stateName} State`;
  const dominant =
    r.christian > r.muslim + 20 ? "predominantly Christian"
    : r.muslim > r.christian + 20 ? "predominantly Muslim"
    : "religiously mixed, with sizeable Christian and Muslim communities living side by side";

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
    </div>
  );
}
