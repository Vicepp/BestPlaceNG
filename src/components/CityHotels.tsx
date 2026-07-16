"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hotel as HotelIcon, MapPin, BedDouble } from "lucide-react";
import { getHotelsPublic, type Hotel } from "@/data/hotels";
import { formatNaira } from "@/data/apartments";

/** Bookable hotels/shortlets listed in this city — shown on the city's Hotel
 * section above the directory entries, so explorers can book directly. */
export default function CityHotels({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHotelsPublic().then((all) => {
      setHotels(all.filter((h) => h.citySlug === citySlug));
      setLoading(false);
    });
  }, [citySlug]);

  if (loading || hotels.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Book a stay in {cityName}</h3>
        <Link href="/shortlets" className="text-xs font-semibold text-brand">All hotels &amp; shortlets →</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((h) => (
          <Link key={h.id} href={`/shortlet/${h.id}`}
            className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg">
            {h.images[0] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={h.images[0]} alt={h.name} className="h-32 w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-zinc-100 text-zinc-300"><HotelIcon className="h-7 w-7" /></div>
            )}
            <div className="p-3.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand">{h.kind} · Book instantly</p>
              <p className="mt-0.5 text-sm font-extrabold text-foreground group-hover:text-brand">{h.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3 w-3" /> {h.area}</p>
              <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-foreground">
                <BedDouble className="h-3.5 w-3.5 text-brand" /> from {formatNaira(h.defaultPricePerNight)}<span className="font-semibold text-zinc-400">/night</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
