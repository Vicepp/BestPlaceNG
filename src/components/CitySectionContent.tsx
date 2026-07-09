import { Suspense } from "react";
import Link from "next/link";
import { cities, type CityData } from "@/data/cities";
import { getSaleListingsByCityLive, formatNaira } from "@/data/apartments";
import { citySections } from "@/data/citySections";
import { getReviewsLive } from "@/data/reviews";
import IndexBar from "@/components/IndexBar";
import ComingSoon from "@/components/ComingSoon";
import ListingGroup from "@/components/ListingGroup";
import CostOfLivingPanel from "@/components/CostOfLivingPanel";
import CrimePanel from "@/components/CrimePanel";
import ClimatePanel from "@/components/ClimatePanel";
import JobsPanel from "@/components/JobsPanel";
import PoliticsPanel from "@/components/PoliticsPanel";
import ReligionPanel from "@/components/ReligionPanel";
import SchoolPanel from "@/components/SchoolPanel";
import EconomyPanel from "@/components/EconomyPanel";
import EducationStatsPanel from "@/components/EducationStatsPanel";
import PeopleStatsPanel from "@/components/PeopleStatsPanel";
import CommutePanel from "@/components/CommutePanel";
import InternetPanel from "@/components/InternetPanel";
import ElectricityPanel from "@/components/ElectricityPanel";
import TransportationPanel from "@/components/TransportationPanel";
import RoadConditionPanel from "@/components/RoadConditionPanel";
import CityReviewsOverview from "@/components/CityReviewsOverview";
import CityOverview from "@/components/CityOverview";
import { getLatestCityResearch, getStateResearchHistory, type ResearchSectionFinding } from "@/data/cityResearch";
import { getCostOfLivingProfile } from "@/data/costOfLiving";
import ReviewBox from "@/components/ReviewBox";
import ApartmentsExplorer from "@/components/ApartmentsExplorer";

export default async function CitySectionContent({
  city,
  section,
}: {
  city: CityData;
  section: string;
}) {
  const sectionLabel = citySections.find((s) => s.slug === section)?.label ?? section.replace(/-/g, " ");
  const [body, initialReviews, note] = await Promise.all([
    renderSectionBody(city, section),
    getReviewsLive(city.slug, section),
    getSectionResearchNote(city, section),
  ]);
  return (
    <div>
      {note}
      {body}
      <ReviewBox citySlug={city.slug} section={section} sectionLabel={sectionLabel} cityName={city.name} initialReviews={initialReviews} />
    </div>
  );
}

/** Researched updates land on THEIR OWN section page: the latest snapshot's
 * finding for this section (city snapshot first, else the state's) renders as
 * a dated strip above the section body. The overview only gets the headline
 * card — details are distributed here, not piled on the overview. */
async function getSectionResearchNote(city: CityData, section: string) {
  if (section === "overview") return null;
  const key = section === "weather" ? "climate" : section;
  const cityRes = await getLatestCityResearch(city.slug);
  let snapshot = cityRes?.latest ?? null;
  let finding: ResearchSectionFinding | undefined = snapshot?.sections?.[key];
  if (!finding?.note) {
    const stateHistory = await getStateResearchHistory(city.stateSlug);
    snapshot = stateHistory[0] ?? null;
    finding = snapshot?.sections?.[key];
  }
  if (!snapshot || !finding?.note) return null;
  return (
    <div className="mb-6 rounded-2xl border border-brand/20 bg-brand-light/40 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">
        Latest researched update · as of {snapshot.asOf}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-700">{finding.note}</p>
      {finding.areas && finding.areas.length > 0 && (
        <p className="mt-1.5 text-xs text-zinc-500">
          {finding.areas.map((a) => `${a.area}${a.twoBedroom ? `: 2-bed ~₦${a.twoBedroom.toLocaleString()}/yr` : ""}`).join(" · ")}
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-zinc-400">{snapshot.sources.length} source{snapshot.sources.length === 1 ? "" : "s"} · full history kept in the database</p>
    </div>
  );
}

async function renderSectionBody(city: CityData, section: string) {
  switch (section) {
    case "overview":
      // BestPlaces-style relocation guide: intro, location details, cost/safety
      // panels, minimum income, rankings, pros & cons, "Dig Deeper" — built
      // from database-backed data; lifestyle-focused (politics stays in its
      // own section).
      return <CityOverview city={city} />;

    case "cost-of-living":
      return <CostOfLivingPanel city={city} />;

    case "crime":
      return <CrimePanel city={city} />;

    case "climate":
    case "weather":
      return <ClimatePanel city={city} />;

    case "school-ratings":
      return <SchoolPanel city={city} />;

    case "education-stats":
      return <EducationStatsPanel city={city} />;

    case "economy":
      return <EconomyPanel city={city} />;

    case "jobs":
      return <JobsPanel city={city} />;

    case "people-stats":
      return <PeopleStatsPanel city={city} />;

    case "housing-stats": {
      const [saleListings, colProfile] = await Promise.all([
        getSaleListingsByCityLive(city.slug),
        getCostOfLivingProfile(city),
      ]);
      const rentBars: { label: string; yearly: number; color: string }[] = colProfile
        ? [
            { label: "3 Bedroom Flat", yearly: colProfile.rent.threeBedroom, color: "bg-purple-500" },
            { label: "2 Bedroom Flat", yearly: colProfile.rent.twoBedroom, color: "bg-amber-400" },
            { label: "1 Bedroom Flat", yearly: colProfile.rent.oneBedroom, color: "bg-blue-400" },
            { label: "Self-Contain / Studio", yearly: colProfile.rent.selfContain, color: "bg-green-500" },
          ]
        : [];
      const maxYearly = Math.max(...rentBars.map((b) => b.yearly), 1);
      return (
        <div className="space-y-6">
          {/* Narrative intro — generated from the live cost-of-living profile */}
          {colProfile && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-zinc-600">
                The median home cost in {city.name} is roughly{" "}
                <strong className="text-foreground">{formatNaira(colProfile.medianHomeCost)}</strong>, which is{" "}
                <strong className="text-foreground">
                  {Math.abs(colProfile.medianHomeVsNationalPercent).toFixed(0)}%{" "}
                  {colProfile.medianHomeVsNationalPercent >= 0 ? "above" : "below"}
                </strong>{" "}
                the Nigerian average. A typical 2-bedroom flat rents for about{" "}
                <strong className="text-foreground">{formatNaira(colProfile.twoBedroomRent)}/year</strong> — remember that
                Nigerian rent is almost always paid annually, often with first-year extras like caution and agency fees.
                {colProfile.estimatedFromMajor && ` (Figures are based on ${colProfile.majorCityName}, the reference city for ${city.stateName} State.)`}
              </p>
            </div>
          )}

          {/* Median rent by bedrooms — BestPlaces-style gradient bars (shown monthly) */}
          {rentBars.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground">Median Monthly Rent by Number of Bedrooms</h3>
              <p className="mt-1 text-xs text-zinc-400">Annual rent divided by 12 — Nigerian landlords typically collect the full year upfront.</p>
              <div className="mt-4 space-y-4">
                {rentBars.map((b) => {
                  const monthly = Math.round(b.yearly / 12 / 1000) * 1000;
                  return (
                    <div key={b.label}>
                      <p className="mb-1 text-xs font-medium text-zinc-500">{b.label}</p>
                      <div className="h-6 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`flex h-full items-center justify-end rounded-full px-3 ${b.color}`}
                          style={{ width: `${Math.max(18, (b.yearly / maxYearly) * 100)}%` }}
                        >
                          <span className="text-xs font-bold text-white">{formatNaira(monthly)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Housing comparison table */}
          {colProfile && (
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <h3 className="px-6 pt-6 text-base font-bold text-foreground">Housing: {city.name} vs Nigeria</h3>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                    <th className="px-6 py-2 font-medium">Housing</th>
                    <th className="px-6 py-2 font-medium">{city.name}</th>
                    <th className="px-6 py-2 font-medium">Nigeria</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-6 py-2.5 font-medium text-zinc-500">Median Home Cost</td>
                    <td className="px-6 py-2.5 font-semibold text-foreground">{formatNaira(colProfile.medianHomeCost)}</td>
                    <td className="px-6 py-2.5 text-zinc-500">₦28,000,000</td>
                  </tr>
                  <tr className="bg-zinc-50/50">
                    <td className="px-6 py-2.5 font-medium text-zinc-500">2-Bed Annual Rent</td>
                    <td className="px-6 py-2.5 font-semibold text-foreground">{formatNaira(colProfile.twoBedroomRent)}</td>
                    <td className="px-6 py-2.5 text-zinc-500">₦1,500,000</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-2.5 font-medium text-zinc-500">Cost of Living Index</td>
                    <td className="px-6 py-2.5 font-semibold text-foreground">{colProfile.score}</td>
                    <td className="px-6 py-2.5 text-zinc-500">100</td>
                  </tr>
                </tbody>
              </table>
              <p className="px-6 py-3 text-xs text-zinc-400">
                Rent source: {colProfile.rentSource === "researched" ? `researched for ${city.name}` : colProfile.rentSource === "state-reference" ? `based on ${colProfile.rentSourceCityName}` : "national estimate scaled by cost-of-living index"}
                {colProfile.rentAsOf ? `, as of ${colProfile.rentAsOf}` : ""}.
              </p>
            </div>
          )}

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

    case "apartments":
      // Client-side explorer: browse listings and open a full in-page detail
      // (carousel, YouTube, request/message/become-tenant) without leaving the page.
      return (
        <Suspense fallback={<p className="text-sm text-zinc-400">Loading listings…</p>}>
          <ApartmentsExplorer citySlug={city.slug} cityName={city.name} />
        </Suspense>
      );

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
      return <CityReviewsOverview city={city} />;

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
      return <ReligionPanel city={city} />;

    case "politics-voting":
      return <PoliticsPanel city={city} />;

    case "commute-time":
      return <CommutePanel city={city} />;

    case "internet":
      return <InternetPanel city={city} />;

    case "electricity":
      return <ElectricityPanel city={city} />;

    case "transportation":
      return <TransportationPanel city={city} />;

    case "road-condition":
      return <RoadConditionPanel city={city} />;

    default:
      // Unreachable for the current citySections list — every section has a
      // real panel. Kept as a safety net for sections added in the future.
      return <ComingSoon topic={section.replace(/-/g, " ")} />;
  }
}
