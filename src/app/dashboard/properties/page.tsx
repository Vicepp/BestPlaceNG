"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApartmentsByOwnerLive, formatNaira, type ApartmentListing } from "@/data/apartments";

const TYPE_COLORS: Record<string, string> = {
  Apartment: "bg-brand-light text-brand-dark",
  House: "bg-blue-100 text-blue-700",
  Duplex: "bg-purple-100 text-purple-700",
  Land: "bg-yellow-100 text-yellow-700",
  "Self-Contain": "bg-zinc-100 text-zinc-600",
  "Shop/Office": "bg-orange-100 text-orange-700",
};

export default function PropertiesPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Rent" | "Sale">("All");

  useEffect(() => {
    if (!user) return;
    getApartmentsByOwnerLive(user.uid).then((a) => {
      setListings(a);
      setLoading(false);
    });
  }, [user]);

  const filtered = filter === "All" ? listings : listings.filter((a) => a.purpose === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Properties</h1>
          <p className="mt-1 text-sm text-zinc-500">{listings.length} total listing{listings.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-zinc-100 p-1 text-xs font-semibold">
            {(["All", "Rent", "Sale"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 transition ${filter === f ? "bg-white text-foreground shadow-sm" : "text-zinc-500 hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <Link href="/list-property" className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Plus className="h-4 w-4" /> Add New
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No properties yet</p>
          <p className="mt-1 text-xs text-zinc-400">Create your first listing to start accepting tenant inquiries.</p>
          <Link href="/list-property" className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Add Property
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((listing) => (
            <div key={listing.id} className="flex flex-wrap items-start gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[listing.type] ?? "bg-zinc-100 text-zinc-500"}`}>{listing.type}</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">For {listing.purpose}</span>
                </div>
                <h3 className="mt-2 text-base font-bold text-foreground">{listing.title}</h3>
                <p className="flex items-center gap-1 text-sm text-zinc-500">
                  <MapPin className="h-3.5 w-3.5" /> {listing.area}
                </p>
                <p className="mt-3 text-sm text-zinc-600 line-clamp-2">{listing.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-brand-dark">{formatNaira(listing.priceNaira)}</p>
                {listing.pricePeriod && listing.pricePeriod !== "one-time" && <p className="text-xs text-zinc-400">/{listing.pricePeriod}</p>}
                {listing.id && (
                  <Link href={`/dashboard/properties/${listing.id}`} className="mt-3 inline-block rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light">
                    Manage
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
