import Link from "next/link";
import { cities } from "@/data/cities";

const metrics = [
  { key: "population", label: "Largest Population", getValue: (c: (typeof cities)[number]) => c.population, format: (v: number) => v.toLocaleString(), sort: "desc" as const, majorsOnly: false },
  { key: "cost-of-living", label: "Most Affordable (Cost of Living)", getValue: (c: (typeof cities)[number]) => c.costOfLivingIndex ?? 0, format: (v: number) => v.toString(), sort: "asc" as const, majorsOnly: true },
  { key: "safety", label: "Safest Cities", getValue: (c: (typeof cities)[number]) => c.safetyIndex ?? 0, format: (v: number) => v.toString(), sort: "desc" as const, majorsOnly: true },
  { key: "schools", label: "Best School Ratings", getValue: (c: (typeof cities)[number]) => c.schoolRating ?? 0, format: (v: number) => v.toFixed(1), sort: "desc" as const, majorsOnly: true },
  { key: "growth", label: "Fastest Growing", getValue: (c: (typeof cities)[number]) => c.growthRatePercent, format: (v: number) => `${v}%`, sort: "desc" as const, majorsOnly: false },
];

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ metric?: string }>;
}) {
  const { metric: metricParam } = await searchParams;
  const metric = metrics.find((m) => m.key === metricParam) ?? metrics[0];

  const pool = metric.majorsOnly ? cities.filter((c) => c.tier === "major") : cities;
  const sorted = [...pool]
    .sort((a, b) => {
      const diff = metric.getValue(a) - metric.getValue(b);
      return metric.sort === "asc" ? diff : -diff;
    })
    .slice(0, 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">Nigeria City Rankings</h1>
      <p className="mt-2 text-zinc-500">
        Pick a metric to rank cities in our database{metric.majorsOnly ? " (limited to our researched major cities for this metric)" : ""}.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {metrics.map((m) => (
          <Link
            key={m.key}
            href={`/rankings?metric=${m.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              m.key === metric.key ? "bg-brand text-white" : "bg-zinc-100 text-foreground/70 hover:bg-brand-light"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-100">
        {sorted.map((c, i) => (
          <Link
            key={c.slug}
            href={`/city/${c.slug}`}
            className="flex items-center justify-between border-b border-zinc-50 bg-white px-5 py-3.5 text-sm last:border-b-0 hover:bg-zinc-50"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                {i + 1}
              </span>
              <span className="font-medium text-foreground">{c.name}, {c.stateName}</span>
            </span>
            <span className="font-semibold text-brand">{metric.format(metric.getValue(c))}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
