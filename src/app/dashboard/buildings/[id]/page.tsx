"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2, Home, Plus, MoreVertical, Eye, EyeOff,
  Archive, RotateCcw, Pencil, Trash2, ArrowLeft, MapPin,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPropertyById, type Property } from "@/data/properties";
import {
  getApartmentsByPropertyLive, formatNaira, setListingStatus,
  type ApartmentListing, type ListingStatus,
} from "@/data/apartments";
import { setFirestoreDoc } from "@/lib/firestoreWrite";

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  archived: "bg-zinc-100 text-zinc-500",
};

function UnitCard({ unit, onRefresh }: { unit: ApartmentListing; onRefresh: () => void }) {
  const status = unit.status ?? "active";
  const [menuOpen, setMenuOpen] = useState(false);

  async function changeStatus(next: ListingStatus) {
    await setListingStatus(unit.id, next);
    setMenuOpen(false);
    onRefresh();
  }

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition ${status === "archived" ? "opacity-60" : ""}`}>
      {/* Thumbnail */}
      {unit.images?.[0] ? (
        <img src={unit.images[0]} alt={unit.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-zinc-50">
          <Home className="h-8 w-8 text-zinc-200" />
        </div>
      )}

      {/* Status badge + 3-dot */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[status]}`}>{status}</span>
      </div>
      <div className="absolute right-2 top-2">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <MoreVertical className="h-4 w-4 text-zinc-600" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-xl">
            <Link
              href={`/list-property?edit=${unit.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50"
            >
              <Pencil className="h-4 w-4 text-zinc-400" /> Edit listing
            </Link>
            {status === "active" && (
              <button onClick={() => changeStatus("rented")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
                <EyeOff className="h-4 w-4 text-zinc-400" /> Mark as Rented
              </button>
            )}
            {status === "rented" && (
              <button onClick={() => changeStatus("active")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
                <Eye className="h-4 w-4 text-brand" /> Mark Available
              </button>
            )}
            {status !== "archived" && (
              <button onClick={() => changeStatus("archived")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50">
                <Archive className="h-4 w-4" /> Archive / Delist
              </button>
            )}
            {status === "archived" && (
              <button onClick={() => changeStatus("active")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand hover:bg-brand-light">
                <RotateCcw className="h-4 w-4" /> Re-list
              </button>
            )}
            <Link
              href={`/dashboard/properties/${unit.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50"
            >
              <Building2 className="h-4 w-4 text-zinc-400" /> Manage Tenants
            </Link>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">{unit.type} · For {unit.purpose}</p>
        <h3 className="text-sm font-bold text-foreground line-clamp-2">{unit.title}</h3>
        {unit.bedrooms > 0 && (
          <p className="text-xs text-zinc-400">{unit.bedrooms} bed · {unit.bathrooms} bath</p>
        )}
        <p className="mt-auto pt-2 text-base font-bold text-brand-dark">
          {formatNaira(unit.priceNaira)}
          <span className="text-xs font-normal text-zinc-400">
            {unit.pricePeriod === "year" ? "/yr" : unit.pricePeriod === "month" ? "/mo" : ""}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function BuildingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  async function load() {
    const [p, u] = await Promise.all([getPropertyById(id), getApartmentsByPropertyLive(id)]);
    if (!p || p.ownerId !== user?.uid) { router.replace("/dashboard/properties"); return; }
    setProperty(p);
    setUnits(u);
    setLoading(false);
  }

  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line

  if (loading) return <p className="p-6 text-sm text-zinc-400">Loading building…</p>;
  if (!property) return null;

  const activeUnits = units.filter((u) => (u.status ?? "active") !== "archived");
  const archivedUnits = units.filter((u) => (u.status ?? "active") === "archived");
  const visibleUnits = showArchived ? units : activeUnits;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <button onClick={() => router.push("/dashboard/properties")}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Buildings
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {property.images?.[0] ? (
            <img src={property.images[0]} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Building2 className="h-8 w-8" />
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{property.name}</h1>
            <p className="flex items-center gap-1 text-sm text-zinc-500">
              <MapPin className="h-3.5 w-3.5" /> {property.area}, {property.city} · {property.stateName}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {units.length} unit{units.length !== 1 ? "s" : ""} · {activeUnits.filter(u => u.status === "active" || !u.status).length} active
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/edit-property/${id}`}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">
            <Pencil className="h-4 w-4" /> Edit Building
          </Link>
          <Link href={`/list-property?propertyId=${id}`}
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Plus className="h-4 w-4" /> Add Unit
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      {archivedUnits.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchived((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${showArchived ? "border-brand bg-brand-light text-brand-dark" : "border-zinc-200 text-zinc-500"}`}>
            <Archive className="h-3.5 w-3.5" /> {showArchived ? "Hide Archived" : `Show Archived (${archivedUnits.length})`}
          </button>
        </div>
      )}

      {/* Units grid */}
      {visibleUnits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
          <Home className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
          <p className="text-sm font-medium text-foreground">No units yet</p>
          <p className="mt-1 text-xs text-zinc-400">Add individual apartment, shop, or room listings under this building.</p>
          <Link href={`/list-property?propertyId=${id}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Plus className="h-4 w-4" /> Add First Unit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
