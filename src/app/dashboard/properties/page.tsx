"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus, Building2, Home, MoreVertical, Eye, EyeOff,
  Archive, RotateCcw, Pencil, MapPin, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPropertiesForOwner, type Property } from "@/data/properties";
import {
  getApartmentsByOwnerLive, formatNaira, setListingStatus,
  assignUnitToProperty, removeUnitFromProperty,
  type ApartmentListing, type ListingStatus,
} from "@/data/apartments";

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  archived: "bg-zinc-100 text-zinc-500",
};

/* ── Building card (grid tile) ─────────────────────────────── */
function BuildingCard({ property, unitCount, activeCount }: { property: Property; unitCount: number; activeCount: number }) {
  return (
    <Link
      href={`/dashboard/buildings/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      {property.images?.[0] ? (
        <img src={property.images[0]} alt={property.name} className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-brand-light">
          <Building2 className="h-10 w-10 text-brand/50" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-bold text-foreground line-clamp-2">{property.name}</h3>
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3" />{property.area}, {property.city}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="text-xs text-zinc-400">
            <span className="font-semibold text-foreground">{activeCount}</span> active /{" "}
            <span className="font-semibold text-foreground">{unitCount}</span> units
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Standalone unit 3-dot menu ────────────────────────────── */
function UnitDotMenu({
  unit, onRefresh, availableProperties,
}: { unit: ApartmentListing; onRefresh: () => void; availableProperties: Property[] }) {
  const [open, setOpen] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const status = unit.status ?? "active";

  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowAssign(false); } }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function changeStatus(next: ListingStatus) {
    await setListingStatus(unit.id, next);
    setOpen(false);
    onRefresh();
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100">
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && !showAssign && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-xl">
          <Link href={`/list-property?edit=${unit.id}`} onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
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
          <Link href={`/dashboard/properties/${unit.id}`} onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
            <Building2 className="h-4 w-4 text-zinc-400" /> Manage Tenants
          </Link>
          {unit.propertyId ? (
            <button onClick={async () => { await removeUnitFromProperty(unit.id); setOpen(false); onRefresh(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50">
              <Building2 className="h-4 w-4" /> Remove from building
            </button>
          ) : availableProperties.length > 0 ? (
            <button onClick={() => setShowAssign(true)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <Building2 className="h-4 w-4 text-brand" /> Assign to building
            </button>
          ) : null}
        </div>
      )}

      {showAssign && (
        <div className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Choose building</p>
          {availableProperties.map((p) => (
            <button key={p.id}
              onClick={async () => { await assignUnitToProperty(unit.id, p.id, p.name); setShowAssign(false); onRefresh(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-brand-light hover:text-brand">
              <Building2 className="h-4 w-4" /> {p.name}
            </button>
          ))}
          <button onClick={() => setShowAssign(false)}
            className="flex w-full items-center px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-50">Cancel</button>
        </div>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  async function load() {
    if (!user) return;
    const [p, u] = await Promise.all([getPropertiesForOwner(user.uid), getApartmentsByOwnerLive(user.uid)]);
    setProperties(p);
    setUnits(u);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const standaloneUnits = units.filter((u) => !u.propertyId && (u.status ?? "active") !== "archived");
  const archivedUnits = units.filter((u) => (u.status ?? "active") === "archived");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {properties.length} building{properties.length !== 1 ? "s" : ""} ·{" "}
            {units.length} unit{units.length !== 1 ? "s" : ""} ·{" "}
            <span className="font-semibold text-green-600">{units.filter((u) => (u.status ?? "active") === "active").length} active</span>{" · "}
            <span className="font-semibold text-blue-600">{units.filter((u) => u.status === "rented").length} rented</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/list-property"
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">
            <Plus className="h-4 w-4" /> Add Unit
          </Link>
          <Link href="/create-property"
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Building2 className="h-4 w-4" /> New Building
          </Link>
        </div>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading…</p> : (
        <>
          {/* Buildings grid */}
          {properties.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wide">Buildings &amp; Estates</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((p) => {
                  const pUnits = units.filter((u) => u.propertyId === p.id);
                  const activeCount = pUnits.filter((u) => (u.status ?? "active") === "active").length;
                  return (
                    <BuildingCard key={p.id} property={p} unitCount={pUnits.length} activeCount={activeCount} />
                  );
                })}
              </div>
            </section>
          )}

          {/* Standalone units */}
          {standaloneUnits.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wide">Standalone Listings</h2>
              <p className="mb-3 text-xs text-zinc-400">These listings aren't tied to a building yet — use the 3-dot menu to assign them.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {standaloneUnits.map((unit) => {
                  const status = unit.status ?? "active";
                  return (
                    <div key={unit.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                      {unit.images?.[0] ? (
                        <img src={unit.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                          <Home className="h-5 w-5 text-zinc-300" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{unit.title}</p>
                        <p className="text-xs text-zinc-400">{unit.area} · {formatNaira(unit.priceNaira)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[status]}`}>{status}</span>
                        <UnitDotMenu unit={unit} onRefresh={load} availableProperties={properties} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Archived */}
          {archivedUnits.length > 0 && (
            <section>
              <button onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-600">
                <Archive className="h-4 w-4" />
                {showArchived ? "Hide Archived" : `Show Archived Units (${archivedUnits.length})`}
              </button>
              {showArchived && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedUnits.map((unit) => (
                    <div key={unit.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 opacity-70">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                        <Home className="h-5 w-5 text-zinc-300" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-600">{unit.title}</p>
                        <p className="text-xs text-zinc-400">{unit.area} · {formatNaira(unit.priceNaira)}</p>
                      </div>
                      <UnitDotMenu unit={unit} onRefresh={load} availableProperties={properties} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {properties.length === 0 && units.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
              <p className="text-sm font-medium text-foreground">No properties yet</p>
              <p className="mt-1 text-xs text-zinc-400">Create a building to group multiple units, or add a standalone listing.</p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/create-property"
                  className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                  New Building
                </Link>
                <Link href="/list-property"
                  className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">
                  Add Unit
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
