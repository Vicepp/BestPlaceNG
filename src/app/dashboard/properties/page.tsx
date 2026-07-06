"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus, Building2, Home, MoreVertical, Eye, EyeOff,
  Archive, RotateCcw, Pencil, MapPin, ChevronRight, Copy, Trash2, ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPropertiesForOwner, duplicateProperty, deleteProperty, type Property } from "@/data/properties";
import {
  getApartmentsByOwnerLive, formatNaira, setListingStatus,
  assignUnitToProperty, removeUnitFromProperty, duplicateApartment, deleteApartment,
  type ApartmentListing, type ListingStatus,
} from "@/data/apartments";
import { getFirebaseAuth } from "@/lib/firebase";
import TransferModal from "@/components/dashboard/TransferModal";
import type { UserProfile } from "@/context/AuthContext";

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  archived: "bg-zinc-100 text-zinc-500",
};

/* ── Building card (grid tile) ─────────────────────────────── */
function BuildingCard({
  property, unitCount, activeCount, rentedCount, onRefresh, onTransfer,
}: { property: Property; unitCount: number; activeCount: number; rentedCount: number; onRefresh: () => void; onTransfer: (p: Property) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
      {/* 3-dot menu (absolute so it doesn't trigger navigation) */}
      <div ref={ref} className="absolute right-2 top-2 z-10">
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-500 shadow hover:bg-white"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-xl">
            <Link href={`/edit-property/${property.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <Pencil className="h-4 w-4 text-zinc-400" /> Edit building
            </Link>
            <button onClick={async () => { await duplicateProperty(property); setMenuOpen(false); onRefresh(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <Copy className="h-4 w-4 text-zinc-400" /> Duplicate building
            </button>
            <button onClick={() => { setMenuOpen(false); onTransfer(property); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
              <ArrowRightLeft className="h-4 w-4 text-zinc-400" /> Transfer building
            </button>
            {rentedCount > 0 ? (
              <span className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300" title="A building with rented units can't be deleted">
                <Trash2 className="h-4 w-4" /> Delete ({rentedCount} rented)
              </span>
            ) : (
              <button onClick={async () => { if (confirm(`Delete "${property.name}"? Its ${unitCount} unit${unitCount !== 1 ? "s" : ""} stay but are unlinked.`)) { await deleteProperty(property.id); setMenuOpen(false); onRefresh(); } }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete building
              </button>
            )}
          </div>
        )}
      </div>

      <Link href={`/dashboard/buildings/${property.id}`} className="flex flex-1 flex-col">
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
              <span className="font-semibold text-green-600">{activeCount}</span> active ·{" "}
              <span className="font-semibold text-blue-600">{rentedCount}</span> rented ·{" "}
              <span className="font-semibold text-foreground">{unitCount}</span> total
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Standalone unit 3-dot menu ────────────────────────────── */
function UnitDotMenu({
  unit, onRefresh, availableProperties, onTransfer,
}: { unit: ApartmentListing; onRefresh: () => void; availableProperties: Property[]; onTransfer: (unit: ApartmentListing) => void }) {
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
          <button onClick={async () => { await duplicateApartment(unit); setOpen(false); onRefresh(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
            <Copy className="h-4 w-4 text-zinc-400" /> Duplicate unit
          </button>
          <button onClick={() => { setOpen(false); onTransfer(unit); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-zinc-50">
            <ArrowRightLeft className="h-4 w-4 text-zinc-400" /> Transfer to landlord
          </button>
          {/* A rented unit cannot be deleted (a tenant depends on it). */}
          {status === "rented" ? (
            <span className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300" title="Rented units can't be deleted">
              <Trash2 className="h-4 w-4" /> Delete (rented)
            </span>
          ) : (
            <button onClick={async () => { if (confirm(`Delete "${unit.title}"? This can't be undone.`)) { await deleteApartment(unit.id); setOpen(false); onRefresh(); } }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Delete unit
            </button>
          )}
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
  const [filter, setFilter] = useState<"all" | "active" | "rented">("all");
  const [transfer, setTransfer] = useState<{ kind: "unit" | "building"; id: string; title: string } | null>(null);
  const [transferMsg, setTransferMsg] = useState("");

  async function load() {
    if (!user) return;
    const [p, u] = await Promise.all([getPropertiesForOwner(user.uid), getApartmentsByOwnerLive(user.uid)]);
    setProperties(p);
    setUnits(u);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  async function handleTransfer(recipient: UserProfile) {
    if (!transfer) return;
    const token = await getFirebaseAuth().currentUser?.getIdToken();
    const res = await fetch("/api/property/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind: transfer.kind, id: transfer.id, newOwnerUid: recipient.uid }),
    });
    const json = await res.json().catch(() => null);
    setTransfer(null);
    if (json?.ok) {
      setTransferMsg(`Transferred "${transfer.title}" to ${recipient.displayName || recipient.email}.`);
      load();
    } else {
      setTransferMsg(json?.error ?? "Transfer failed. Please try again.");
    }
  }

  const allStandalone = units.filter((u) => !u.propertyId && (u.status ?? "active") !== "archived");
  const standaloneUnits = allStandalone.filter((u) => filter === "all" || (u.status ?? "active") === filter);
  const archivedUnits = units.filter((u) => (u.status ?? "active") === "archived");

  return (
    <div className="space-y-8">
      {transferMsg && (
        <div className="rounded-xl bg-brand-light px-4 py-3 text-sm text-brand-dark">{transferMsg}</div>
      )}
      {transfer && (
        <TransferModal
          title={transfer.kind === "building" ? "Transfer building" : "Transfer unit"}
          subtitle={`Give "${transfer.title}" to another landlord. Rented units move with their tenants.`}
          currentUid={user?.uid ?? ""}
          onConfirm={handleTransfer}
          onClose={() => setTransfer(null)}
        />
      )}
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

      {/* Filter: All / Active / Rented (applies to standalone listings) */}
      <div className="flex gap-2">
        {(["all", "active", "rented"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
              filter === f ? "bg-brand text-white" : "border border-zinc-200 text-zinc-600 hover:border-brand hover:text-brand"
            }`}
          >
            {f}
          </button>
        ))}
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
                  const rentedCount = pUnits.filter((u) => u.status === "rented").length;
                  return (
                    <BuildingCard key={p.id} property={p} unitCount={pUnits.length} activeCount={activeCount} rentedCount={rentedCount} onRefresh={load} onTransfer={(pr) => { setTransferMsg(""); setTransfer({ kind: "building", id: pr.id, title: pr.name }); }} />
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
                        <UnitDotMenu unit={unit} onRefresh={load} availableProperties={properties} onTransfer={(u) => { setTransferMsg(""); setTransfer({ kind: "unit", id: u.id, title: u.title }); }} />
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
              <h2 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wide">Archived</h2>
              <button onClick={() => setShowArchived((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  showArchived ? "border-brand bg-brand-light text-brand-dark" : "border-zinc-200 text-zinc-600 hover:border-brand hover:text-brand"
                }`}>
                <Archive className="h-4 w-4" />
                {showArchived ? "Hide archived" : `Show archived (${archivedUnits.length})`}
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
                      <UnitDotMenu unit={unit} onRefresh={load} availableProperties={properties} onTransfer={(u) => { setTransferMsg(""); setTransfer({ kind: "unit", id: u.id, title: u.title }); }} />
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
