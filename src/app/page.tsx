import Link from "next/link";
import CitySearchBar from "@/components/CitySearchBar";
import NigeriaMap from "@/components/NigeriaMap";
import { cities } from "@/data/cities";
import { Building2, MapPin, Mic, ShieldCheck, TrendingUp } from "lucide-react";

const featured = cities
  .filter((c) => c.tier === "major")
  .sort((a, b) => b.population - a.population)
  .slice(0, 8);

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-light via-white to-white">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-light px-4 py-1.5 text-xs font-semibold text-brand-dark">
            <MapPin className="h-3.5 w-3.5" /> Nigeria&apos;s city &amp; rental data platform
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Find the Best Place to Live <br className="hidden sm:block" />
            in <span className="text-brand">Nigeria</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500">
            Compare cost of living, safety, climate, schools and more across
            Nigerian cities — then find an apartment to rent once you&apos;ve
            picked your spot.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <CitySearchBar />
            <p className="mt-3 text-xs text-zinc-400">
              Try a city name, state, or ZIP code — e.g. &ldquo;Enugu&rdquo;, &ldquo;Lagos&rdquo;, or &ldquo;100001&rdquo;
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Mic className="h-4 w-4 text-brand" />
            <span>
              Prefer to talk? Use the assistant button in the bottom-right corner.
            </span>
          </div>
        </div>
      </section>

      <section id="map" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Explore Nigeria by State
          </h2>
          <p className="mt-2 text-zinc-500">
            Click any state on the map to see its cities.
          </p>
        </div>
        <NigeriaMap />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Most Popular Cities
            </h2>
            <p className="mt-2 text-zinc-500">
              Start your search with Nigeria&apos;s largest cities.
            </p>
          </div>
          <Link href="/rankings" className="hidden text-sm font-semibold text-brand sm:block">
            View all rankings &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c) => (
            <Link
              key={c.slug}
              href={`/city/${c.slug}`}
              className="group rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                {c.stateName}
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground group-hover:text-brand">
                {c.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Pop. {c.population.toLocaleString()}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                <span>Cost {c.costOfLivingIndex ?? "—"}</span>
                <span>&middot;</span>
                <span>Safety {c.safetyIndex ?? "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Everything you need before you move
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Feature
              icon={<TrendingUp className="h-6 w-6" />}
              title="Compare City Data"
              text="Cost of living, crime, climate, schools, jobs and more — side by side for any Nigerian city."
            />
            <Feature
              icon={<Building2 className="h-6 w-6" />}
              title="Find an Apartment"
              text="Browse rentals and sales in the city you choose, with landlords listing directly on the platform."
            />
            <Feature
              icon={<ShieldCheck className="h-6 w-6" />}
              title="AI-Powered Recommendations"
              text="Chat or speak with our assistant to get city suggestions tailored to what matters most to you."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{text}</p>
    </div>
  );
}
