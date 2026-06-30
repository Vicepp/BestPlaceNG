import Link from "next/link";
import { getApartmentsLive, formatNaira } from "@/data/apartments";
import { getCityBySlug } from "@/data/cities";

export default async function ApartmentsPage() {
  const apartments = await getApartmentsLive();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Apartments &amp; Properties</h1>
          <p className="mt-2 text-zinc-500">
            Browse listings across Nigeria, or search a city first to see what&apos;s available there.
          </p>
        </div>
        <Link href="/list-property" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
          List Your Property
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {apartments.map((listing) => {
          const city = getCityBySlug(listing.citySlug);
          return (
            <Link
              key={listing.id}
              href={`/city/${listing.citySlug}/apartments`}
              className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                {listing.type} &middot; For {listing.purpose}
              </p>
              <h3 className="mt-1 text-base font-bold text-foreground">{listing.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {listing.area}, {city?.name ?? ""}
              </p>
              <p className="mt-3 text-lg font-bold text-brand-dark">
                {formatNaira(listing.priceNaira)}
                {listing.pricePeriod === "year" && <span className="text-xs font-normal text-zinc-400">/year</span>}
              </p>
            </Link>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-zinc-400">
        Don&apos;t see what you&apos;re looking for? <Link href="/list-property" className="font-semibold text-brand">List your own property</Link> to help grow the marketplace.
      </p>
    </div>
  );
}
