import Link from "next/link";
import { getListingsLive, type ListingCategory } from "@/data/directoryListings";

export default async function ListingGroup({
  citySlug,
  cityName,
  category,
  label,
}: {
  citySlug: string;
  cityName: string;
  category: ListingCategory;
  label: string;
}) {
  const listings = await getListingsLive(citySlug, category);

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No {label.toLowerCase()} listed yet in {cityName}</p>
        <p className="mt-1 text-xs text-zinc-400">Know one nearby? Create an account to add it.</p>
        <Link href="/list-business" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Add {label}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <div key={listing.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              {listing.subtitle && (
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">{listing.subtitle}</p>
              )}
              <h3 className="mt-1 text-base font-bold text-foreground">{listing.name}</h3>
              {listing.address && <p className="text-sm text-zinc-500">{listing.address}</p>}
            </div>
            {listing.meta && <p className="text-sm font-semibold text-brand-dark">{listing.meta}</p>}
          </div>
          <p className="mt-3 text-sm text-zinc-600">{listing.description}</p>
          {listing.tags && listing.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {listing.tags.map((t) => (
                <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
      <Link href="/list-business" className="inline-block text-sm font-semibold text-brand">
        + Add another {label.toLowerCase()}
      </Link>
    </div>
  );
}
