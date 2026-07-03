"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft, MapPin, BedDouble, Bath, ImageIcon, UserPlus } from "lucide-react";
import { getApartmentsByCityLive, formatNaira, firstYearTotal, type ApartmentListing } from "@/data/apartments";
import { extractYouTubeId } from "@/data/properties";
import RentThisButton from "@/components/RentThisButton";
import MessageLandlordButton from "@/components/MessageLandlordButton";

/* ── Image carousel ───────────────────────────────────────────── */
function Carousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-100 text-zinc-300">
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[idx]} alt={`${title} photo ${idx + 1}`} className="aspect-video w-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-foreground shadow hover:bg-white"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-foreground shadow hover:bg-white"
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Detail view (in-page) ────────────────────────────────────── */
function Detail({ apt, cityName, onBack }: { apt: ApartmentListing; cityName: string; onBack: () => void }) {
  const ytId = extractYouTubeId(apt.youtubeUrl ?? "");
  const images = apt.images ?? [];
  const total = firstYearTotal(apt);
  const unit = apt.pricePeriod === "month" ? "/month" : apt.pricePeriod === "year" ? "/year" : "";

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to all listings
      </button>

      {/* Media: carousel + optional YouTube side-by-side */}
      <div className={`grid gap-4 ${ytId ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <Carousel images={images} title={apt.title} />
        {ytId && (
          <div className="overflow-hidden rounded-xl bg-black">
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube.com/embed/${ytId}`}
              title={`${apt.title} video tour`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{apt.type} · For {apt.purpose}</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{apt.title}</h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500"><MapPin className="h-4 w-4" /> {apt.area}, {cityName}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
          {apt.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4 text-zinc-400" /> {apt.bedrooms} bed</span>}
          {apt.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-zinc-400" /> {apt.bathrooms} bath</span>}
          <span className="text-lg font-bold text-brand-dark">{formatNaira(apt.priceNaira)}<span className="text-xs font-normal text-zinc-400">{unit}</span></span>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{apt.description}</p>

        {apt.amenities?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {apt.amenities.map((a) => (
              <span key={a} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">{a}</span>
            ))}
          </div>
        )}

        {/* First-year fee breakdown */}
        {(apt.cautionFee || apt.agencyFee || apt.agreementFee || apt.legalFee) && (
          <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-500">
            <p className="mb-1 font-semibold text-zinc-600">First-year move-in cost</p>
            <div className="space-y-0.5">
              <div className="flex justify-between"><span>Rent</span><span>{formatNaira(apt.priceNaira)}</span></div>
              {apt.cautionFee ? <div className="flex justify-between"><span>Caution (refundable)</span><span>{formatNaira(apt.cautionFee)}</span></div> : null}
              {apt.agencyFee ? <div className="flex justify-between"><span>Agency</span><span>{formatNaira(apt.agencyFee)}</span></div> : null}
              {apt.agreementFee ? <div className="flex justify-between"><span>Agreement</span><span>{formatNaira(apt.agreementFee)}</span></div> : null}
              {apt.legalFee ? <div className="flex justify-between"><span>Legal</span><span>{formatNaira(apt.legalFee)}</span></div> : null}
              <div className="flex justify-between border-t border-zinc-200 pt-1 font-semibold text-foreground"><span>Total year 1</span><span>{formatNaira(total)}</span></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {apt.ownerId && (
            <Link href={`/become-tenant/${apt.id}`} className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              <UserPlus className="h-4 w-4" /> Become a tenant
            </Link>
          )}
          <RentThisButton listing={apt} />
          <MessageLandlordButton listing={apt} />
        </div>
      </div>
    </div>
  );
}

/* ── List + explorer ──────────────────────────────────────────── */
export default function ApartmentsExplorer({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("apt") ?? searchParams.get("highlight");

  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getApartmentsByCityLive(citySlug).then((all) => {
      // Only show listings that are on the market (hide rented/archived).
      setListings(all.filter((a) => !a.status || a.status === "active"));
      setLoading(false);
    });
  }, [citySlug]);

  // Deep-link from chat: open the highlighted apartment once loaded.
  useEffect(() => {
    if (highlight && listings.some((l) => l.id === highlight)) setSelectedId(highlight);
  }, [highlight, listings]);

  const selected = useMemo(() => listings.find((l) => l.id === selectedId) ?? null, [listings, selectedId]);

  if (loading) return <p className="text-sm text-zinc-400">Loading listings…</p>;

  if (selected) {
    return <Detail apt={selected} cityName={cityName} onBack={() => setSelectedId(null)} />;
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No listings yet in {cityName}</p>
        <p className="mt-1 text-xs text-zinc-400">Are you a landlord or agent? Create an account to list a property here.</p>
        <Link href="/list-property" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          List a Property
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {listings.map((a) => {
        const cover = a.images?.[0];
        return (
          <button
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            className={`flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md ${
              a.id === highlight ? "border-brand ring-2 ring-brand/30" : "border-zinc-100"
            }`}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={a.title} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-zinc-100 text-zinc-300"><ImageIcon className="h-8 w-8" /></div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{a.type} · For {a.purpose}</p>
              <h3 className="mt-0.5 text-base font-bold text-foreground line-clamp-2">{a.title}</h3>
              <p className="flex items-center gap-1 text-xs text-zinc-500"><MapPin className="h-3 w-3" /> {a.area}</p>
              <p className="mt-auto pt-2 text-lg font-bold text-brand-dark">
                {formatNaira(a.priceNaira)}
                {a.pricePeriod === "year" && <span className="text-xs font-normal text-zinc-400">/year</span>}
                {a.pricePeriod === "month" && <span className="text-xs font-normal text-zinc-400">/month</span>}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
