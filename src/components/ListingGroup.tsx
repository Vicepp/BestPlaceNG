import Link from "next/link";
import { ChevronRight, CirclePlay } from "lucide-react";
import { getListingsLive, parseYouTubeId, type ListingCategory } from "@/data/directoryListings";

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
        <Link
          key={listing.id}
          href={`/directory/${listing.id}`}
          className="group block rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
        >
          <div className="flex gap-4">
            {listing.imageUrl && (
              <img src={listing.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {listing.subtitle && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">{listing.subtitle}</p>
                  )}
                  <h3 className="mt-1 flex items-center gap-2 text-base font-bold text-foreground group-hover:text-brand">
                    {listing.name}
                    {listing.youtubeUrl && parseYouTubeId(listing.youtubeUrl) && <CirclePlay className="h-4 w-4 shrink-0 text-red-500" />}
                  </h3>
                  {listing.address && <p className="text-sm text-zinc-500">{listing.address}</p>}
                </div>
                {listing.meta && <p className="text-sm font-semibold text-brand-dark">{listing.meta}</p>}
              </div>
              <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{listing.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {listing.phone && <span className="text-xs text-zinc-500">📞 {listing.phone}</span>}
                {listing.tags?.map((t) => (
                  <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">{t}</span>
                ))}
                <span className="ml-auto flex items-center gap-0.5 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                  View details <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
      <Link href="/list-business" className="inline-block text-sm font-semibold text-brand">
        + Add another {label.toLowerCase()}
      </Link>
    </div>
  );
}
