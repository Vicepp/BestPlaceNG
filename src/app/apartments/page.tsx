"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, Search, MapPin, Image as ImageIcon, Play } from "lucide-react";
import { getApartmentsPublicLive, formatNaira, type ApartmentListing } from "@/data/apartments";
import { extractYouTubeId } from "@/data/properties";
import { cities } from "@/data/cities";

const PROPERTY_TYPES: ApartmentListing["type"][] = ["Apartment", "House", "Duplex", "Land", "Self-Contain", "Shop/Office"];
const BEDROOM_OPTIONS = [0, 1, 2, 3, 4, 5];

/** All unique Nigerian state names present in the cities dataset. */
const STATE_NAMES = [...new Set(cities.map((c) => c.stateName))].sort();

interface Filters {
  query: string;
  state: string;
  type: string;
  purpose: string;
  bedrooms: string;
  maxPrice: string;
}

const EMPTY_FILTERS: Filters = { query: "", state: "", type: "", purpose: "", bedrooms: "", maxPrice: "" };

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark">
      {label}
      <button onClick={onRemove} aria-label="Remove filter"><X className="h-3 w-3" /></button>
    </span>
  );
}

export default function ApartmentsPage() {
  const [all, setAll] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    getApartmentsPublicLive().then((a) => { setAll(a); setLoading(false); });
  }, []);

  function set(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function clear() { setFilters(EMPTY_FILTERS); }

  const filtered = useMemo(() => {
    return all.filter((a) => {
      const city = cities.find((c) => c.slug === a.citySlug);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.area.toLowerCase().includes(q) && !(city?.name ?? "").toLowerCase().includes(q)) return false;
      }
      if (filters.state && city?.stateName !== filters.state) return false;
      if (filters.type && a.type !== filters.type) return false;
      if (filters.purpose && a.purpose !== filters.purpose) return false;
      if (filters.bedrooms !== "" && a.bedrooms !== Number(filters.bedrooms)) return false;
      if (filters.maxPrice && a.priceNaira > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [all, filters]);

  const activeCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Apartments &amp; Properties</h1>
          <p className="mt-1 text-zinc-500">Browse {all.length} listings across Nigeria</p>
        </div>
        <Link href="/list-property" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
          List Your Property
        </Link>
      </div>

      {/* Search + filter trigger */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={filters.query}
            onChange={(e) => set("query", e.target.value)}
            placeholder="Search by title, area, or city..."
            className="w-full rounded-full border border-zinc-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand"
          />
          {filters.query && (
            <button onClick={() => set("query", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            panelOpen || activeCount > 0 ? "border-brand bg-brand text-white" : "border-zinc-200 text-zinc-600 hover:border-brand hover:text-brand"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {/* Filter panel */}
      {panelOpen && (
        <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">State</label>
              <select value={filters.state} onChange={(e) => set("state", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="">All States</option>
                {STATE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">Type</label>
              <select value={filters.type} onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="">All Types</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">Purpose</label>
              <select value={filters.purpose} onChange={(e) => set("purpose", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="">Rent &amp; Sale</option>
                <option value="Rent">For Rent</option>
                <option value="Sale">For Sale</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">Bedrooms</label>
              <select value={filters.bedrooms} onChange={(e) => set("bedrooms", e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="">Any</option>
                {BEDROOM_OPTIONS.map((n) => <option key={n} value={String(n)}>{n === 0 ? "Studio / Shop" : `${n} bed`}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-400">Max Price (₦)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => set("maxPrice", e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="flex items-end">
              <button onClick={clear} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-red-300 hover:text-red-600">
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && !panelOpen && (
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.state && <FilterChip label={filters.state} onRemove={() => set("state", "")} />}
          {filters.type && <FilterChip label={filters.type} onRemove={() => set("type", "")} />}
          {filters.purpose && <FilterChip label={`For ${filters.purpose}`} onRemove={() => set("purpose", "")} />}
          {filters.bedrooms !== "" && <FilterChip label={`${filters.bedrooms} bed`} onRemove={() => set("bedrooms", "")} />}
          {filters.maxPrice && <FilterChip label={`≤ ${formatNaira(Number(filters.maxPrice))}`} onRemove={() => set("maxPrice", "")} />}
          <button onClick={clear} className="text-xs font-semibold text-zinc-400 hover:text-red-500">Clear all</button>
        </div>
      )}

      {/* Results count */}
      <p className="mb-4 text-sm text-zinc-500">
        {loading ? "Loading..." : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}${activeCount > 0 ? " (filtered)" : ""}`}
      </p>

      {/* Listings grid */}
      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">No properties match your filters</p>
          <p className="mt-1 text-xs text-zinc-400">Try adjusting or clearing some filters.</p>
          <button onClick={clear} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => {
            const city = cities.find((c) => c.slug === listing.citySlug);
            return (
              <Link
                key={listing.id}
                href={`/city/${listing.citySlug}/apartments`}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lg"
              >
                {/* Thumbnail: first image, YouTube thumbnail, or nothing */}
                {(() => {
                  const img = listing.images?.[0];
                  const ytId = extractYouTubeId(listing.youtubeUrl ?? "");
                  if (img) return (
                    <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
                      <img src={img} alt={listing.title} className="h-full w-full object-cover" />
                      {ytId && (
                        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                          <Play className="h-3 w-3 fill-white" /> Video
                        </span>
                      )}
                      {(listing.images?.length ?? 0) > 1 && (
                        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                          <ImageIcon className="h-3 w-3" /> {listing.images!.length}
                        </span>
                      )}
                    </div>
                  );
                  if (ytId) return (
                    <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg">
                          <Play className="h-5 w-5 fill-white text-white" />
                        </div>
                      </div>
                    </div>
                  );
                  return null;
                })()}

                <div className="flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                      {listing.type} · For {listing.purpose}
                    </p>
                    {listing.bedrooms > 0 && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                        {listing.bedrooms} bed
                      </span>
                    )}
                  </div>
                  {listing.businessName && (
                    <p className="mt-0.5 text-xs font-semibold text-brand">{listing.businessName}</p>
                  )}
                  <h3 className="mt-1 text-base font-bold text-foreground line-clamp-2">{listing.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {listing.area}{city ? `, ${city.name}` : ""}
                  </p>
                  {city?.stateName && <p className="text-xs text-zinc-400">{city.stateName} State</p>}
                  <p className="mt-auto pt-3 text-lg font-bold text-brand-dark">
                    {formatNaira(listing.priceNaira)}
                    {listing.pricePeriod === "year" && <span className="text-xs font-normal text-zinc-400">/year</span>}
                    {listing.pricePeriod === "month" && <span className="text-xs font-normal text-zinc-400">/month</span>}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-zinc-400">
        Don&apos;t see what you&apos;re looking for?{" "}
        <Link href="/list-property" className="font-semibold text-brand">List your own property</Link>
      </p>
    </div>
  );
}
