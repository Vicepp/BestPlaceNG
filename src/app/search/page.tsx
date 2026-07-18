import Link from "next/link";
import { redirect } from "next/navigation";
import { searchCities } from "@/data/cities";
import { searchTowns } from "@/data/lagosTowns";
import CitySearchBar from "@/components/CitySearchBar";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchCities(query) : [];
  const townHits = query ? searchTowns(query).slice(0, 12) : [];

  const ql = query.toLowerCase();
  const exactTowns = townHits.filter((t) => t.town.toLowerCase() === ql);
  // Cities that are just the parent of a same-named town (e.g. "Mushin" town
  // inside Mushin city) are the SAME place — never show both.
  const townParents = new Set(exactTowns.map((t) => t.citySlug));
  const distinctCities = results.filter((c) => !(c.name.toLowerCase() === ql && townParents.has(c.slug)));

  // One destination, no detours:
  //  - city searched  -> straight to the city page
  //  - town searched  -> straight to its parent city page, with the town's
  //                      name carried along and shown in the city header
  //  - same name, several genuinely different places -> the chooser below
  if (exactTowns.length > 0 && distinctCities.length === 0 && new Set(exactTowns.map((t) => t.citySlug)).size === 1) {
    redirect(`/city/${exactTowns[0].citySlug}?town=${encodeURIComponent(exactTowns[0].town)}`);
  }
  if (distinctCities.length === 1 && exactTowns.length === 0 && townHits.length === 0) {
    redirect(`/city/${distinctCities[0].slug}`);
  }
  if (results.length === 0 && townHits.length === 1) {
    redirect(`/city/${townHits[0].citySlug}?town=${encodeURIComponent(townHits[0].town)}`);
  }

  // Otherwise: several genuinely different places share the name — this page
  // becomes the chooser.
  const nameCollision = exactTowns.length + distinctCities.filter((c) => c.name.toLowerCase() === ql).length > 1;

  // If every result shares the same city name, this is the classic "same city name, different state" case.
  const allSameName =
    results.length > 1 && results.every((c) => c.name.toLowerCase() === results[0].name.toLowerCase());

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground">Search Results</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Showing matches for &ldquo;{query}&rdquo;
      </p>
      <div className="mt-6">
        <CitySearchBar size="sm" />
      </div>

      {(allSameName || nameCollision) && (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
          <p className="font-bold">Several places share the name &ldquo;{query}&rdquo;.</p>
          <p className="mt-0.5">
            Nigeria reuses names across states — check each option&apos;s city and state below and pick the exact one you mean.
          </p>
        </div>
      )}

      {/* Towns that match: they belong to a parent city where all the data lives */}
      {townHits.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
            Towns in Lagos matching &ldquo;{query}&rdquo;
          </p>
          <div className="space-y-3">
            {townHits.map((t) => (
              <Link
                key={`${t.citySlug}-${t.town}`}
                href={`/city/${t.citySlug}?town=${encodeURIComponent(t.town)}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand-light/20 p-4 shadow-sm transition hover:border-brand hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {t.town} {t.hq && <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">★ MAIN TOWN</span>}
                  </p>
                  <p className="text-sm text-zinc-500">
                    Town in <span className="font-semibold text-brand-dark">{t.lga}</span>, Lagos State
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-brand">Open {t.lga} →</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {distinctCities.length === 0 && townHits.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
            No matches found. Try a different city or town name, state, or ZIP code — or ask the assistant in the corner.
          </div>
        )}
        {distinctCities.map((c) => (
          <Link
            key={c.slug}
            href={`/city/${c.slug}`}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-foreground">{c.name}</p>
              <p className="text-sm text-zinc-500">
                City in {c.stateName} State{c.zipCode && <> &middot; ZIP {c.zipCode}</>}
              </p>
            </div>
            <p className="text-sm text-zinc-400">{c.population.toLocaleString()} people</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
