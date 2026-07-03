import Link from "next/link";
import { Star, GraduationCap, School as SchoolIcon, AlertTriangle, Phone, MapPin } from "lucide-react";
import type { CityData } from "@/data/cities";
import { getListingsLive, type DirectoryListing } from "@/data/directoryListings";
import { getStateReferenceCity } from "@/data/costOfLiving";
import { getWaecProfile } from "@/data/insights";
import TrendChart from "@/components/TrendChart";

const TERTIARY_KEYWORDS = ["university", "polytechnic", "college of education", "college", "poly"];

function isTertiary(l: DirectoryListing): boolean {
  const hay = `${l.subtitle ?? ""} ${l.name} ${l.meta ?? ""}`.toLowerCase();
  return TERTIARY_KEYWORDS.some((k) => hay.includes(k));
}

function SchoolCard({ l, cityName }: { l: DirectoryListing; cityName: string }) {
  return (
    <Link
      href={`/listing/${l.id}`}
      className="block rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {l.subtitle && <p className="text-xs font-semibold uppercase tracking-wide text-brand">{l.subtitle}</p>}
          <h4 className="mt-0.5 text-base font-bold text-foreground">{l.name}</h4>
          <p className="flex items-center gap-1 text-sm text-zinc-500">
            <MapPin className="h-3.5 w-3.5" /> {l.address ?? cityName}
          </p>
        </div>
        {l.meta && <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{l.meta}</span>}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{l.description}</p>
      <div className="mt-2 flex items-center gap-3 text-xs">
        {l.phone && <span className="flex items-center gap-1 text-brand"><Phone className="h-3 w-3" /> {l.phone}</span>}
        <span className="font-semibold text-brand">View details →</span>
      </div>
    </Link>
  );
}

export default async function SchoolPanel({ city }: { city: CityData }) {
  const waec = await getWaecProfile();

  // Schools listed in this city; if none, fall back to the state's reference city.
  let schools = await getListingsLive(city.slug, "school");
  let sourcedFrom: string | null = null;
  if (schools.length === 0) {
    const ref = await getStateReferenceCity(city.stateSlug);
    if (ref && ref.slug !== city.slug) {
      const refSchools = await getListingsLive(ref.slug, "school");
      if (refSchools.length > 0) {
        schools = refSchools;
        sourcedFrom = ref.name;
      }
    }
  }
  const tertiary = schools.filter(isTertiary);
  const basic = schools.filter((s) => !isTertiary(s));

  const ratingText =
    city.schoolRating !== undefined
      ? `${city.name} scores ${city.schoolRating.toFixed(1)}/10 on our schools index — ${
          city.schoolRating >= 7.5 ? "one of the stronger education environments in Nigeria."
          : city.schoolRating >= 6 ? "a solid mix of public and private options."
          : "more limited than the big education hubs, so visiting shortlisted schools in person helps."
        }`
      : `${city.name} doesn't have its own schools index yet — most families choose between local public schools and neighbourhood private academies.`;

  return (
    <div className="space-y-6">
      {/* Narrative + star rating */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-zinc-600">
          {ratingText} Nigerian parents typically weigh WAEC/NECO results, teacher quality, fees and security when choosing
          schools. Fees range widely — from budget neighbourhood academies to premium international curricula.
        </p>
        {city.schoolRating !== undefined && (
          <div className="mt-4 flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <Star key={i} className={`h-5 w-5 ${i < Math.round(city.schoolRating!) ? "fill-accent text-accent" : "text-zinc-200"}`} />
            ))}
            <span className="ml-2 text-sm font-semibold text-foreground">{city.schoolRating.toFixed(1)} / 10</span>
          </div>
        )}
      </div>

      {/* WAEC pass-rate trend */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <TrendChart
          title="WAEC WASSCE Pass Rate — Nigeria (5 credits incl. English & Maths, %)"
          unit="%"
          series={waec.trend.map(([year, rate]) => ({ label: String(year), value: rate }))}
          color="#16a34a"
        />
        <p className="mt-3 text-xs text-zinc-400">
          National pass rate reached {waec.latest}% in {waec.asOf}. {waec.source}
        </p>
      </div>

      {sourcedFrom && (
        <div className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            No schools have been listed in {city.name} yet, so the schools below are from <strong>{sourcedFrom}</strong>, the
            nearest city in {city.stateName} State with listings. Know a school in {city.name}?{" "}
            <Link href="/list-business" className="font-semibold underline">Add it here</Link>.
          </p>
        </div>
      )}

      {/* Tertiary institutions */}
      {tertiary.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <GraduationCap className="h-4 w-4 text-brand" /> Universities, Polytechnics &amp; Colleges
            {sourcedFrom ? ` (in ${sourcedFrom})` : ` in ${city.name}`}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tertiary.map((l) => <SchoolCard key={l.id} l={l} cityName={sourcedFrom ?? city.name} />)}
          </div>
        </div>
      )}

      {/* Primary & secondary schools */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <SchoolIcon className="h-4 w-4 text-brand" /> Primary &amp; Secondary Schools
          {sourcedFrom ? ` (in ${sourcedFrom})` : ` in ${city.name}`}
        </h3>
        {basic.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {basic.map((l) => <SchoolCard key={l.id} l={l} cityName={sourcedFrom ?? city.name} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No primary/secondary schools listed yet in {city.name}</p>
            <p className="mt-1 text-xs text-zinc-400">Know one? Help others by adding it.</p>
            <Link href="/list-business" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
              Add a School
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
