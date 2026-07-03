import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, MapPin, ArrowLeft, Tag } from "lucide-react";
import { getListingById } from "@/data/directoryListings";
import { cities } from "@/data/cities";

const CATEGORY_LABEL: Record<string, string> = {
  job: "Job", school: "School", hospital: "Hospital", pharmacy: "Pharmacy",
  hotel: "Hotel", event: "Event", market: "Market", "shopping-mall": "Shopping Mall",
  "police-station": "Police Station", church: "Church", mosque: "Mosque",
};

const CATEGORY_SECTION: Record<string, string> = {
  job: "jobs", school: "school-ratings", hospital: "health", pharmacy: "health",
  hotel: "hotels", event: "events", market: "market", "shopping-mall": "shopping-malls",
  "police-station": "police-stations", church: "religion", mosque: "religion",
};

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const city = cities.find((c) => c.slug === listing.citySlug);
  const backSection = CATEGORY_SECTION[listing.category] ?? "overview";
  const backHref = `/city/${listing.citySlug}/${backSection}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {CATEGORY_LABEL[listing.category] ?? "listings"} in {city?.name ?? "city"}
      </Link>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-block rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark">
          {CATEGORY_LABEL[listing.category] ?? listing.category}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-foreground">{listing.name}</h1>
        {listing.subtitle && <p className="mt-1 text-sm font-semibold text-brand">{listing.subtitle}</p>}
        {listing.meta && <p className="mt-1 text-sm text-zinc-500">{listing.meta}</p>}

        <div className="mt-5 space-y-2 border-y border-zinc-100 py-5">
          {listing.address && (
            <p className="flex items-center gap-2 text-sm text-zinc-600">
              <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
              {listing.address}{city ? `, ${city.name}, ${city.stateName} State` : ""}
            </p>
          )}
          {listing.phone && (
            <p className="flex items-center gap-2 text-sm text-zinc-600">
              <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
              <a href={`tel:${listing.phone.replace(/\s/g, "")}`} className="font-medium text-brand hover:underline">{listing.phone}</a>
            </p>
          )}
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-bold text-foreground">About</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{listing.description}</p>
        </div>

        {listing.tags && listing.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {listing.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">
                <Tag className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-zinc-400">
        Is this your listing?{" "}
        <Link href="/list-business" className="font-semibold text-brand">Add or update a listing</Link>
      </p>
    </div>
  );
}
