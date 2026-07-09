import { Newspaper, History } from "lucide-react";
import { getLatestCityResearch, getStateResearchHistory } from "@/data/cityResearch";
import type { CityData } from "@/data/cities";

/** "Latest on-the-ground update" card on a city's overview — shows the most
 * recent research snapshot for the city (falling back to its state's), with a
 * note of how many historical snapshots exist. Renders nothing if none. */
export default async function CityResearchCard({ city }: { city: CityData }) {
  const cityRes = await getLatestCityResearch(city.slug);
  const stateHistory = cityRes ? [] : await getStateResearchHistory(city.stateSlug);
  const snapshot = cityRes?.latest ?? stateHistory[0] ?? null;
  if (!snapshot) return null;

  const isState = !cityRes;
  const historyCount = cityRes?.historyCount ?? stateHistory.length;

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-light/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Newspaper className="h-4 w-4 text-brand" />
          Latest on-the-ground update{isState ? ` — ${city.stateName} State` : ""}
        </h3>
        <span className="text-xs font-semibold text-zinc-400">as of {snapshot.asOf}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{snapshot.headline}</p>
      {snapshot.highlights && snapshot.highlights.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
          {snapshot.highlights.slice(0, 4).map((h) => <li key={h}>— {h}</li>)}
        </ul>
      )}
      {snapshot.sections && Object.keys(snapshot.sections).length > 0 && (
        <p className="mt-2 text-xs text-zinc-500">
          Topic-by-topic details appear on their own pages: {Object.keys(snapshot.sections).filter((s) => s !== "overview").map((s) => s.replace(/-/g, " ")).join(", ")}.
        </p>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
        <History className="h-3.5 w-3.5" />
        {snapshot.sources.length} source{snapshot.sources.length === 1 ? "" : "s"} · {historyCount} snapshot{historyCount === 1 ? "" : "s"} on record (history is never overwritten)
      </p>
    </div>
  );
}
