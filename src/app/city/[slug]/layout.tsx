import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug } from "@/data/cities";
import CitySidebar from "@/components/CitySidebar";
import CitySearchBar from "@/components/CitySearchBar";

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  return (
    <div>
      <div className="border-b border-zinc-100 bg-gradient-to-b from-brand-light to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs text-zinc-400">
            <Link href="/" className="hover:text-brand">Home</Link> /{" "}
            <Link href={`/search?q=${encodeURIComponent(city.stateName)}`} className="hover:text-brand">{city.stateName}</Link> /{" "}
            <span className="text-foreground">{city.name}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {city.name}, {city.stateName}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {city.isFederalCapital ? "Federal Capital" : city.isStateCapital ? `${city.stateName} State Capital` : city.lga + " LGA"}
                {city.zipCode && <> &middot; ZIP {city.zipCode}</>}
              </p>
            </div>
            <div className="w-full max-w-sm">
              <CitySearchBar size="sm" placeholder="Search another city..." />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
        <CitySidebar citySlug={city.slug} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
