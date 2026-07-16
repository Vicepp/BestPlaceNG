"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Hotel as HotelIcon, Search, MapPin, BedDouble } from "lucide-react";
import { getHotelsPublic, type Hotel } from "@/data/hotels";
import { formatNaira } from "@/data/apartments";

export default function ShortletsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"" | "hotel" | "shortlet">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { getHotelsPublic().then((h) => { setHotels(h); setLoading(false); }); }, []);

  const filtered = useMemo(
    () =>
      hotels.filter((h) => {
        if (kind && h.kind !== kind) return false;
        const s = q.trim().toLowerCase();
        return !s || `${h.name} ${h.area} ${h.cityName} ${h.stateName ?? ""}`.toLowerCase().includes(s);
      }),
    [hotels, q, kind]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Hotels &amp; Shortlets</h1>
          <p className="mt-1 text-zinc-500">Book verified rooms and apartments night by night — pick your exact room, even your floor</p>
        </div>
        <Link href="/dashboard/hotels/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
          List Your Hotel / Shortlet
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, area or city…"
            className="w-full rounded-full border border-zinc-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand" />
        </div>
        {(["", "hotel", "shortlet"] as const).map((k) => (
          <button key={k || "all"} onClick={() => setKind(k)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${kind === k ? "bg-brand text-white" : "border border-zinc-200 bg-white text-zinc-500 hover:border-brand hover:text-brand"}`}>
            {k === "" ? "All" : k === "hotel" ? "Hotels" : "Shortlets"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-zinc-400">Loading places…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <HotelIcon className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-bold text-foreground">No bookable places yet</p>
          <p className="mt-1 text-xs text-zinc-400">Be the first — list your hotel or shortlet in minutes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <Link key={h.id} href={`/shortlet/${h.id}`}
              className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-xl">
              {h.images[0] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={h.images[0]} alt={h.name} className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-zinc-100 text-zinc-300"><HotelIcon className="h-10 w-10" /></div>
              )}
              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand">{h.kind}</p>
                <h2 className="mt-0.5 text-base font-extrabold text-foreground group-hover:text-brand">{h.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3.5 w-3.5" /> {h.area}, {h.cityName}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <BedDouble className="h-4 w-4 text-brand" /> from {formatNaira(h.defaultPricePerNight)}<span className="font-semibold text-zinc-400">/night</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
