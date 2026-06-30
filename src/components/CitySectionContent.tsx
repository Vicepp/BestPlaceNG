import Link from "next/link";
import { cities, type CityData } from "@/data/cities";
import { getApartmentsByCityLive, getSaleListingsByCityLive, formatNaira } from "@/data/apartments";
import { citySections } from "@/data/citySections";
import { getReviewsLive } from "@/data/reviews";
import IndexBar from "@/components/IndexBar";
import ComingSoon from "@/components/ComingSoon";
import ListingGroup from "@/components/ListingGroup";
import CostOfLivingPanel from "@/components/CostOfLivingPanel";
import CrimePanel from "@/components/CrimePanel";
import ClimatePanel from "@/components/ClimatePanel";
import ReviewBox from "@/components/ReviewBox";
import RentThisButton from "@/components/RentThisButton";
import MessageLandlordButton from "@/components/MessageLandlordButton";
import { Star } from "lucide-react";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

export default async function CitySectionContent({
  city,
  section,
}: {
  city: CityData;
  section: string;
}) {
  const sectionLabel = citySections.find((s) => s.slug === section)?.label ?? section.replace(/-/g, " ");
  const [body, initialReviews] = await Promise.all([
    renderSectionBody(city, section),
    getReviewsLive(city.slug, section),
  ]);
  return (
    <div>
      {body}
      <ReviewBox citySlug={city.slug} section={section} sectionLabel={sectionLabel} cityName={city.name} initialReviews={initialReviews} />
    </div>
  );
}

async function renderSectionBody(city: CityData, section: string) {
  switch (section) {
    case "overview": {
      const allSameState = cities.filter(
        (c) => c.stateSlug === city.stateSlug && c.slug !== city.slug
      );
      const sameStateCities = allSameState
        .sort((a, b) => b.population - a.population)
        .slice(0, 12);
      const moreCount = allSameState.length - sameStateCities.length;
      return (
        <div className="space-y-8">
          <p className="text-base leading-relaxed text-zinc-600">
            {city.description ??
              `${city.name} is an LGA in ${city.stateName} State (${city.region}). Detailed profile data for ${city.name} is coming soon.`}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Population" value={city.population.toLocaleString()} />
            <StatCard label="LGA" value={city.lga} />
            {city.zipCode && <StatCard label="ZIP Code" value={city.zipCode} />}
            <StatCard label="Region" value={city.region} />
          </div>
          {city.tier === "major" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <IndexBar label="Cost of Living Index" value={city.costOfLivingIndex!} helpText="National average = 100" />
              <IndexBar label="Safety Index" value={city.safetyIndex!} helpText="Higher = perceived safer (100 = national average)" />
            </div>
          ) : (
            <ComingSoon topic="Cost of living and safety index" />
          )}
          {sameStateCities.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Other cities in {city.stateName} State
              </h3>
              <div className="flex flex-wrap gap-2">
                {sameStateCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/city/${c.slug}`}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-foreground/70 hover:border-brand hover:text-brand"
                  >
                    {c.name}
                  </Link>
                ))}
                {moreCount > 0 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(city.stateName)}`}
                    className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs text-zinc-400 hover:border-brand hover:text-brand"
                  >
                    +{moreCount} more
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    case "cost-of-living":
      return <CostOfLivingPanel city={city} />;

    case "crime":
      return <CrimePanel city={city} />;

    case "climate":
    case "weather":
      return <ClimatePanel city={city} />;

    case "school-ratings":
      return (
        <div className="space-y-6">
          {city.schoolRating !== undefined ? (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">School Rating</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(city.schoolRating!) ? "fill-accent text-accent" : "text-zinc-200"}`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-foreground">{city.schoolRating.toFixed(1)} / 10</span>
              </div>
            </div>
          ) : (
            <ComingSoon topic="School rating" />
          )}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Schools in {city.name}</h3>
            <ListingGroup citySlug={city.slug} cityName={city.name} category="school" label="School" />
          </div>
        </div>
      );

    case "education-stats":
      return <ComingSoon topic="Education statistics" />;

    case "economy":
      return (
        <div className="space-y-6">
          {city.description && <p className="text-sm text-zinc-600">{city.description}</p>}
          {city.costOfLivingIndex !== undefined && (
            <IndexBar label="Cost of Living (proxy for local economic activity)" value={city.costOfLivingIndex} helpText="National average = 100" />
          )}
          <ComingSoon topic="Economic" />
        </div>
      );

    case "jobs":
      return <ListingGroup citySlug={city.slug} cityName={city.name} category="job" label="Job" />;

    case "people-stats":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Population" value={city.population.toLocaleString()} />
          <StatCard label="Annual Growth" value={`${city.growthRatePercent}%`} />
          <StatCard label="Region" value={city.region} />
          <StatCard label="Population Rank (NG)" value={`#${city.rank}`} />
        </div>
      );

    case "housing-stats": {
      const saleListings = await getSaleListingsByCityLive(city.slug);
      return (
        <div className="space-y-6">
          {city.costOfLivingIndex !== undefined && (
            <IndexBar label="Cost of Living Index" value={city.costOfLivingIndex} helpText="National average = 100" />
          )}
          <Link
            href={`/city/${city.slug}/apartments`}
            className="inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            View Apartments for Rent in {city.name}
          </Link>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Houses &amp; Land for Sale in {city.name}</h3>
            {saleListings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No houses or land listed for sale yet in {city.name}</p>
                <p className="mt-1 text-xs text-zinc-400">Are you a landlord, agent, or property owner? Create an account to list one.</p>
                <Link href="/list-property" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
                  List a Property for Sale
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {saleListings.map((listing) => (
                  <div key={listing.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{listing.type} &middot; For Sale</p>
                        <h3 className="mt-1 text-base font-bold text-foreground">{listing.title}</h3>
                        <p className="text-sm text-zinc-500">{listing.area}, {city.name}</p>
                      </div>
                      <p className="text-lg font-bold text-brand-dark">{formatNaira(listing.priceNaira)}</p>
                    </div>
                    <p className="mt-3 text-sm text-zinc-600">{listing.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    case "apartments": {
      const listings = await getApartmentsByCityLive(city.slug);
      return (
        <div className="space-y-4">
          {listings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No listings yet in {city.name}</p>
              <p className="mt-1 text-xs text-zinc-400">
                Are you a landlord or agent? Create an account to list a property here.
              </p>
              <Link href="/list-property" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
                List a Property
              </Link>
            </div>
          )}
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                    {listing.type} &middot; For {listing.purpose}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">{listing.title}</h3>
                  <p className="text-sm text-zinc-500">{listing.area}, {city.name}</p>
                </div>
                <p className="text-lg font-bold text-brand-dark">
                  {formatNaira(listing.priceNaira)}
                  {listing.pricePeriod === "year" && <span className="text-xs font-normal text-zinc-400">/year</span>}
                  {listing.pricePeriod === "month" && <span className="text-xs font-normal text-zinc-400">/month</span>}
                </p>
              </div>
              <p className="mt-3 text-sm text-zinc-600">{listing.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">
                    {a}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-50 pt-3">
                <RentThisButton listing={listing} />
                <MessageLandlordButton listing={listing} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "rankings": {
      const sorted = [...cities].sort((a, b) => a.rank - b.rank);
      const idx = sorted.findIndex((c) => c.slug === city.slug);
      const neighbours = sorted.slice(Math.max(0, idx - 2), idx + 3);
      return (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            {city.name} ranks <span className="font-semibold text-brand">#{city.rank}</span> by population among cities in our database.
          </p>
          <div className="overflow-hidden rounded-xl border border-zinc-100">
            {neighbours.map((c) => (
              <Link
                key={c.slug}
                href={`/city/${c.slug}`}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  c.slug === city.slug ? "bg-brand-light font-semibold text-brand-dark" : "bg-white text-foreground/80 hover:bg-zinc-50"
                }`}
              >
                <span>#{c.rank} {c.name}, {c.stateName}</span>
                <span className="text-xs text-zinc-400">{c.population.toLocaleString()}</span>
              </Link>
            ))}
          </div>
          <Link href="/rankings" className="inline-block text-sm font-semibold text-brand">
            See full rankings &rarr;
          </Link>
        </div>
      );
    }

    case "reviews":
      return (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">Reviews are organized by topic</p>
          <p className="mt-1 text-xs text-zinc-400">
            Visit any section of {city.name} — like Cost of Living, Crime, or Apartments — and scroll down to read or
            leave a review for that topic. No account needed.
          </p>
        </div>
      );

    case "interactive-map":
      return (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            {city.name} is located in {city.stateName} State ({city.region}).
          </p>
          <Link href="/#map" className="inline-block text-sm font-semibold text-brand">
            View on the full Nigeria map &rarr;
          </Link>
        </div>
      );

    case "health":
      return (
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Hospitals in {city.name}</h3>
            <ListingGroup citySlug={city.slug} cityName={city.name} category="hospital" label="Hospital" />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Pharmacies in {city.name}</h3>
            <ListingGroup citySlug={city.slug} cityName={city.name} category="pharmacy" label="Pharmacy" />
          </div>
        </div>
      );

    case "hotels":
      return <ListingGroup citySlug={city.slug} cityName={city.name} category="hotel" label="Hotel" />;

    case "events":
      return <ListingGroup citySlug={city.slug} cityName={city.name} category="event" label="Event" />;

    case "market":
      return <ListingGroup citySlug={city.slug} cityName={city.name} category="market" label="Market" />;

    case "shopping-malls":
      return <ListingGroup citySlug={city.slug} cityName={city.name} category="shopping-mall" label="Shopping Mall" />;

    case "police-stations":
      return <ListingGroup citySlug={city.slug} cityName={city.name} category="police-station" label="Police Station" />;

    case "religion":
    case "politics-voting":
    case "commute-time":
    case "internet":
    case "electricity":
    case "transportation":
    case "road-condition":
    default:
      return <ComingSoon topic={section.replace(/-/g, " ")} />;
  }
}
