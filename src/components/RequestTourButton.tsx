"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, X, ExternalLink, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFirestoreDoc } from "@/lib/firestoreData";
import type { UserProfile } from "@/context/AuthContext";
import type { ApartmentListing } from "@/data/apartments";
import { createNotification } from "@/data/notifications";
import {
  TOUR_SLOTS, formatSlot, getBookingsForApartment, bookTour, isAllowedBookingLink,
} from "@/data/tours";

/** Next 14 days as yyyy-mm-dd (skip nothing; landlord confirms anyway). */
function nextDays(n: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({ value: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) });
  }
  return out;
}

export default function RequestTourButton({ listing, className }: { listing: ApartmentListing; className?: string }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loadingCfg, setLoadingCfg] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [takenByDate, setTakenByDate] = useState<Record<string, string[]>>({});
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!listing.ownerId) return null; // sample listing
  if (user && user.uid === listing.ownerId) return null; // don't tour your own unit

  async function handleClick() {
    setError("");
    setLoadingCfg(true);
    // Check the landlord's booking preference.
    const landlord = await getFirestoreDoc<UserProfile>("users", listing.ownerId!);
    if (landlord?.bookingMode === "external" && landlord.bookingLink && isAllowedBookingLink(landlord.bookingLink)) {
      setLoadingCfg(false);
      window.open(landlord.bookingLink, "_blank", "noopener,noreferrer");
      return;
    }
    // Internal calendar — load existing bookings so taken slots are blocked.
    const bookings = await getBookingsForApartment(listing.id);
    const map: Record<string, string[]> = {};
    for (const b of bookings) (map[b.date] ??= []).push(b.time);
    setTakenByDate(map);
    setLoadingCfg(false);
    setOpen(true);
  }

  async function confirm() {
    if (!user?.email || !date || !time) { setError("Pick a date and time."); return; }
    if (!phone.trim()) { setError("Add a phone number so the landlord can reach you."); return; }
    setBooking(true);
    setError("");
    const res = await bookTour({
      apartmentId: listing.id,
      apartmentTitle: listing.title,
      landlordId: listing.ownerId!,
      tenantId: user.uid,
      tenantName: profile?.displayName ?? user.email,
      tenantEmail: user.email,
      tenantPhone: phone.trim(),
      date,
      time,
    });
    setBooking(false);
    if (!res.ok) {
      setError(res.error);
      // refresh taken slots in case of a race
      const bookings = await getBookingsForApartment(listing.id);
      const map: Record<string, string[]> = {};
      for (const b of bookings) (map[b.date] ??= []).push(b.time);
      setTakenByDate(map);
      return;
    }
    createNotification({
      userId: listing.ownerId!,
      type: "system",
      title: "New tour request 📅",
      body: `${profile?.displayName ?? user.email} booked a viewing of ${listing.title} on ${new Date(date).toLocaleDateString()} at ${formatSlot(time)}. Phone: ${phone.trim()}.`,
      link: "/dashboard/tenants",
    }).catch(() => {});
    setDone(true);
  }

  if (!user) {
    return (
      <Link href="/login" className={className ?? "flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand"}>
        <CalendarDays className="h-3.5 w-3.5" /> Log in to book a tour
      </Link>
    );
  }

  const taken = date ? takenByDate[date] ?? [] : [];

  return (
    <>
      <button onClick={handleClick} disabled={loadingCfg}
        className={className ?? "flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-brand hover:text-brand disabled:opacity-60"}>
        <CalendarDays className="h-3.5 w-3.5" /> {loadingCfg ? "…" : "Request a tour"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="py-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
                <p className="text-sm font-bold text-foreground">Tour requested!</p>
                <p className="mt-1 text-sm text-zinc-500">{new Date(date).toLocaleDateString()} at {formatSlot(time)}. The landlord has been notified and will confirm.</p>
                <button onClick={() => { setOpen(false); setDone(false); }} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">Done</button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><CalendarDays className="h-5 w-5 text-brand" /> Book a tour</h2>
                    <p className="text-xs text-zinc-400">{listing.title}</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>

                <label className="mb-1 block text-xs font-semibold text-zinc-500">Choose a day</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {nextDays(14).map((d) => (
                    <button key={d.value} onClick={() => { setDate(d.value); setTime(""); }}
                      className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${date === d.value ? "border-brand bg-brand text-white" : "border-zinc-200 text-zinc-600 hover:border-brand"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>

                {date && (
                  <>
                    <label className="mb-1 mt-3 block text-xs font-semibold text-zinc-500">Choose a time</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TOUR_SLOTS.map((s) => {
                        const isTaken = taken.includes(s);
                        return (
                          <button key={s} disabled={isTaken} onClick={() => setTime(s)}
                            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                              isTaken ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300 line-through"
                              : time === s ? "border-brand bg-brand text-white"
                              : "border-zinc-200 text-zinc-600 hover:border-brand"
                            }`}>
                            {formatSlot(s)}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">Greyed-out times are already booked.</p>
                  </>
                )}

                <label className="mb-1 mt-3 block text-xs font-semibold text-zinc-500">Your phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />

                {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

                <button onClick={confirm} disabled={booking || !date || !time}
                  className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">
                  {booking ? "Booking…" : "Confirm tour"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Small helper the chat/listing can use to show an external booking link inline. */
export function ExternalTourLink({ href }: { href: string }) {
  if (!isAllowedBookingLink(href)) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-brand hover:border-brand">
      <ExternalLink className="h-3.5 w-3.5" /> Book a tour
    </a>
  );
}
