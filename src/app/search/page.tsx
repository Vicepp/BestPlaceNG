import Link from "next/link";
import { redirect } from "next/navigation";
import { searchCities } from "@/data/cities";
import CitySearchBar from "@/components/CitySearchBar";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchCities(query) : [];

  // Exact single match (including disambiguated same-name cases) -> go straight to the city page.
  if (results.length === 1) {
    redirect(`/city/${results[0].slug}`);
  }

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

      {allSameName && (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
          We found {results.length} cities named &ldquo;{results[0].name}&rdquo; in different states.
          Pick the right one below.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
            No matches found. Try a different city name, state, or ZIP code — or ask the assistant in the corner.
          </div>
        )}
        {results.map((c) => (
          <Link
            key={c.slug}
            href={`/city/${c.slug}`}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-brand hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-foreground">{c.name}</p>
              <p className="text-sm text-zinc-500">
                {c.stateName} State &middot; {c.lga} LGA{c.zipCode && <> &middot; ZIP {c.zipCode}</>}
              </p>
            </div>
            <p className="text-sm text-zinc-400">{c.population.toLocaleString()} people</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
