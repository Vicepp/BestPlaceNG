"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hotel as HotelIcon, Plus, Eye, CalendarCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getHotelsForOwner, getBookingsForOwner, getHotelViewsForOwner, type Hotel, type HotelBooking, type HotelViewEvent } from "@/data/hotels";
import { formatNaira } from "@/data/apartments";

export default function MyHotelsPage() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [views, setViews] = useState<HotelViewEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getHotelsForOwner(user.uid), getBookingsForOwner(user.uid), getHotelViewsForOwner(user.uid)]).then(
      ([h, b, v]) => { setHotels(h); setBookings(b); setViews(v); setLoading(false); }
    );
  }, [user]);

  if (loading) return <p className="text-sm text-zinc-400">Loading your hotels...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hotels &amp; Shortlets</h1>
          <p className="mt-1 text-sm text-zinc-500">Your bookable properties, their rooms and their bookings</p>
        </div>
        <Link href="/dashboard/hotels/new" className="flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" /> List a hotel / shortlet
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <HotelIcon className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-bold text-foreground">No bookable properties yet</p>
          <p className="mt-1 text-xs text-zinc-400">List a hotel or shortlet — rooms are generated for you, floor by floor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {hotels.map((h) => {
            const hb = bookings.filter((b) => b.hotelId === h.id);
            const active = hb.filter((b) => b.status === "approved").length;
            const hv = views.filter((v) => v.hotelId === h.id).length;
            return (
              <Link key={h.id} href={`/dashboard/hotels/${h.id}`}
                className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg">
                {h.images[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={h.images[0]} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-zinc-100 text-zinc-300"><HotelIcon className="h-8 w-8" /></div>
                )}
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand">{h.kind} · {h.area}, {h.cityName}</p>
                  <h2 className="mt-0.5 text-base font-extrabold text-foreground group-hover:text-brand">{h.name}</h2>
                  <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-zinc-500">
                    <span>{formatNaira(h.defaultPricePerNight)}/night</span>
                    <span className="flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5 text-brand" /> {active} active</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-zinc-300" /> {hv} views</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
