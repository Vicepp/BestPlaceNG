import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Clock, ArrowLeft, Store } from "lucide-react";
import { getListingById, parseYouTubeId, CATEGORY_LABELS } from "@/data/directoryListings";
import { getCityBySlug } from "@/data/cities";
import ReportListingButton from "@/components/ReportListingButton";

/** Public detail page for one directory listing (church, school, market,
 * hotel, job…) — reached from the city section lists. */
export default async function DirectoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const city = getCityBySlug(listing.citySlug);
  const categoryLabel = CATEGORY_LABELS[listing.category] ?? listing.category;
  const videoId = listing.youtubeUrl ? parseYouTubeId(listing.youtubeUrl) : null;
  const sectionSlug = sectionForCategory(listing.category);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {city && (
        <Link href={`/city/${city.slug}/${sectionSlug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          <ArrowLeft className="h-4 w-4" /> All {pluralize(categoryLabel.toLowerCase())} in {city.name}
        </Link>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.name} className="h-64 w-full object-cover" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-brand-light">
            <Store className="h-12 w-12 text-brand/40" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">{categoryLabel}</span>
            {listing.subtitle && <span className="text-xs font-semibold text-zinc-400">{listing.subtitle}</span>}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">{listing.name}</h1>
          {city && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <MapPin className="h-4 w-4 text-zinc-400" />
              {listing.address ? `${listing.address} · ` : ""}{city.name}, {city.stateName}
            </p>
          )}

          <p className="mt-4 text-base leading-relaxed text-zinc-600">{listing.description}</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {listing.meta && (
              <div className="flex items-start gap-2 rounded-xl bg-zinc-50 p-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Details</p>
                  <p className="text-sm font-medium text-foreground">{listing.meta}</p>
                </div>
              </div>
            )}
            {listing.phone && (
              <a href={`tel:${listing.phone.replace(/\s/g, "")}`} className="flex items-start gap-2 rounded-xl bg-zinc-50 p-3 transition hover:bg-brand-light">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Phone</p>
                  <p className="text-sm font-medium text-brand">{listing.phone}</p>
                </div>
              </a>
            )}
          </div>

          {listing.tags && listing.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.tags.map((t) => (
                <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">{t}</span>
              ))}
            </div>
          )}

          {/* YouTube video — embedded via the standard nocookie player */}
          {videoId && (
            <div className="mt-6 overflow-hidden rounded-xl">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={`${listing.name} — video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <p className="text-xs text-zinc-400">
              Listed{listing.createdAt ? ` ${new Date(listing.createdAt).toLocaleDateString()}` : ""} on BestPlaceNG
            </p>
            <ReportListingButton listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}

function pluralize(label: string): string {
  return label.endsWith("ch") || label.endsWith("s") ? `${label}es` : `${label}s`;
}

/** Map a listing category back to its city-page section slug. */
function sectionForCategory(category: string): string {
  switch (category) {
    case "job": return "jobs";
    case "school": return "school-ratings";
    case "hospital": case "pharmacy": return "health";
    case "hotel": return "hotels";
    case "event": return "events";
    case "market": return "market";
    case "shopping-mall": return "shopping-malls";
    case "police-station": return "police-stations";
    case "church": case "mosque": return "religion";
    default: return "overview";
  }
}
