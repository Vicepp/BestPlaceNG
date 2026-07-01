"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Building2, Home, MoreVertical, Eye, EyeOff, Archive, RotateCcw, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPropertiesForOwner, type Property } from "@/data/properties";
import { getApartmentsByOwnerLive, formatNaira, setListingStatus, type ApartmentListing, type ListingStatus } from "@/data/apartments";

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  archived: "bg-zinc-100 text-zinc-500",
};

function UnitDotMenu({ unit, onRefresh }: { unit: ApartmentListing; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const status = unit.status ?? "active";

  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function changeStatus(s: ListingStatus) {
    await setListingStatus(unit.id, s);
    setOpen(false);
    onRefresh();
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-xl">
          {status !== "active" && (
            <button onClick={() => changeStatus("active")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <Eye className="h-4 w-4 text-green-500" /> Make Active
            </button>
          )}
          {status !== "rented" && (
            <button onClick={() => changeStatus("rented")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <EyeOff className="h-4 w-4 text-blue-500" /> Mark as Rented
            </button>
          )}
          {status !== "archived" && (
            <button onClick={() => changeStatus("archived")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <Archive className="h-4 w-4 text-zinc-400" /> Archive (Delist)
            </button>
          )}
          {status === "archived" && (
            <button onClick={() => changeStatus("active")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <RotateCcw className="h-4 w-4 text-brand" /> Relist
            </button>
          )}
          <Link href={`/dashboard/properties/${unit.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
            <Building2 className="h-4 w-4 text-zinc-400" /> Manage Unit
          </Link>
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property, units, onRefresh }: { property: Property; units: ApartmentListing[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const activeUnits = units.filter((u) => (u.status ?? "active") === "active").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      {/* Property header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-3 min-w-0">
          {property.images?.[0] ? (
            <img src={property.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Building2 className="h-7 w-7" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-bold text-foreground">{property.name}</p>
            <p className="text-sm text-zinc-500">{property.area}, {property.city} · {property.stateName}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {units.length} unit{units.length !== 1 ? "s" : ""} · {activeUnits} active
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/list-property?propertyId=${property.id}`}
            className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
            <Plus className="h-3.5 w-3.5" /> Add Unit
          </Link>
          <button onClick={() => setExpanded((v) => !v)} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-50">
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Units list */}
      {expanded && (
        <div className="border-t border-zinc-100">
          {units.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">
              No units yet.{" "}
              <Link href={`/list-property?propertyId=${property.id}`} className="font-semibold text-brand">Add the first unit →</Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {units.map((unit) => {
                const status = unit.status ?? "active";
                return (
                  <div key={unit.id} className={`flex items-center justify-between gap-3 px-5 py-3 ${status === "archived" ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Home className="h-4 w-4 shrink-0 text-zinc-300" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{unit.title}</p>
                        <p className="text-xs text-zinc-400">{unit.bedrooms}bd · {formatNaira(unit.priceNaira)}{unit.pricePeriod === "year" ? "/yr" : unit.pricePeriod === "month" ? "/mo" : ""}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[status]}`}>{status}</span>
                      <UnitDotMenu unit={unit} onRefresh={onRefresh} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const [p, u] = await Promise.all([
      getPropertiesForOwner(user.uid),
      getApartmentsByOwnerLive(user.uid),
    ]);
    setProperties(p);
    setUnits(u);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Standalone units (no propertyId) — listed individually
  const standaloneUnits = units.filter((u) => !u.propertyId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {properties.length} building{properties.length !== 1 ? "s" : ""} · {units.length} unit{units.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/list-property" className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">
            <Plus className="h-4 w-4" /> Add Standalone Unit
          </Link>
          <Link href="/create-property" className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Building2 className="h-4 w-4" /> New Building
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : (
        <>
          {/* Properties with their units */}
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              units={units.filter((u) => u.propertyId === p.id)}
              onRefresh={load}
            />
          ))}

          {/* Standalone unit listings (no parent building) */}
          {standaloneUnits.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <p className="px-5 pt-4 text-sm font-bold text-foreground">Standalone listings</p>
              <p className="px-5 pb-2 text-xs text-zinc-400">These units haven't been tied to a building yet.</p>
              <div className="border-t border-zinc-100 divide-y divide-zinc-50">
                {standaloneUnits.map((unit) => {
                  const status = unit.status ?? "active";
                  return (
                    <div key={unit.id} className={`flex items-center justify-between gap-3 px-5 py-3 ${status === "archived" ? "opacity-60" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Home className="h-4 w-4 shrink-0 text-zinc-300" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{unit.title}</p>
                          <p className="text-xs text-zinc-400">{unit.area} · {formatNaira(unit.priceNaira)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[status]}`}>{status}</span>
                        <UnitDotMenu unit={unit} onRefresh={load} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {properties.length === 0 && standaloneUnits.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
              <p className="text-sm font-medium text-foreground">No properties yet</p>
              <p className="mt-1 text-xs text-zinc-400">Create a building to organise your units, or add a standalone listing.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/create-property" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">New Building</Link>
                <Link href="/list-property" className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-600">Single Listing</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
