"use client";

import { useEffect, useMemo, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, BedDouble, Users, ShieldCheck, MessageSquare, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getHotelById, getUnitsForHotel, getBookingsForHotel, recordHotelView, createPendingBooking,
  setBookingStatus, blockedUnitIds, conflictsForUnit, nextAvailableStart, nightsBetween, BOOKING_LOCK_MINUTES,
  type Hotel, type HotelUnit, type HotelBooking,
} from "@/data/hotels";
import { formatNaira } from "@/data/apartments";
import { extractYouTubeId } from "@/data/properties";
import { startPayment, verifyBookingPayment, isPaymentConfigured } from "@/lib/payments";
import { createNotification } from "@/data/notifications";
import { getOrCreateDirectConversation, sendMessage } from "@/data/conversations";

type Tab = "overview" | "rooms" | "location";
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: string, n: number) => new Date(new Date(d).getTime() + n * 86400000).toISOString().slice(0, 10);

export default function ShortletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [units, setUnits] = useState<HotelUnit[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "rooms" || t === "location") setTab(t);
  }, []);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [selected, setSelected] = useState<string[]>([]);
  const [detailUnit, setDetailUnit] = useState<HotelUnit | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [pending, setPending] = useState<{ ids: string[]; total: number; expiresAt: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    const [h, u, b] = await Promise.all([getHotelById(id), getUnitsForHotel(id), getBookingsForHotel(id)]);
    setHotel(h);
    setUnits(u.filter((x) => x.status === "active"));
    setBookings(b);
    if (h) { setCheckInTime((t) => (t === "14:00" ? h.checkInTime : t)); setCheckOutTime((t) => (t === "11:00" ? h.checkOutTime : t)); }
    setLoading(false);
    // Count one anonymous view per browser session — deliberately no user identity.
    if (h && !sessionStorage.getItem(`bpng:hview:${id}`)) {
      recordHotelView(id, h.ownerId).then((ok) => { if (ok) sessionStorage.setItem(`bpng:hview:${id}`, "1"); });
    }
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 10-minute lock countdown
  useEffect(() => {
    if (!pending) { if (timerRef.current) clearInterval(timerRef.current); return; }
    const tick = () => {
      const left = Math.max(0, Math.round((pending.expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) expirePending();
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  async function expirePending() {
    if (!pending) return;
    const ids = pending.ids;
    setPending(null);
    await Promise.all(ids.map((bid) => setBookingStatus(bid, "expired")));
    setError("Your 10-minute hold expired — the rooms have been released. Pick again to rebook.");
    load();
  }

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const datesOk = nights > 0;
  const blocked = useMemo(
    () => (datesOk ? blockedUnitIds(bookings, checkIn, checkOut, checkInTime, checkOutTime) : new Set<string>()),
    [bookings, checkIn, checkOut, checkInTime, checkOutTime, datesOk]
  );
  const selectedUnits = units.filter((u) => selected.includes(u.id));
  const total = selectedUnits.reduce((s, u) => s + u.pricePerNight * nights, 0);
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);
  const availableCount = datesOk ? units.filter((u) => !blocked.has(u.id)).length : units.length;

  // Blocked rooms split two ways: "shift" = free later the same day (shown, with the
  // suggested time); "gone" = booked across the whole day(s), hidden entirely.
  const unitAvail = useMemo(() => {
    const map = new Map<string, "free" | "shift" | "gone">();
    if (!datesOk) return map;
    const start = new Date(`${checkIn}T${checkInTime}:00`);
    const stayMs = new Date(`${checkOut}T${checkOutTime}:00`).getTime() - start.getTime();
    for (const u of units) {
      if (!blocked.has(u.id)) { map.set(u.id, "free"); continue; }
      const na = nextAvailableStart(bookings, u.id, start, stayMs);
      const naDate = `${na.getFullYear()}-${String(na.getMonth() + 1).padStart(2, "0")}-${String(na.getDate()).padStart(2, "0")}`;
      map.set(u.id, naDate === checkIn ? "shift" : "gone");
    }
    return map;
  }, [units, blocked, bookings, checkIn, checkOut, checkInTime, checkOutTime, datesOk]);
  const hiddenCount = datesOk ? units.filter((u) => unitAvail.get(u.id) === "gone").length : 0;

  function toggleUnit(u: HotelUnit) {
    if (!datesOk) { setError("Pick your check-in and check-out dates first."); setTab("rooms"); return; }
    if (blocked.has(u.id)) { setDetailUnit(u); setGalleryIdx(0); return; } // show when it's free instead
    setError("");
    setSelected((prev) => (prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id]));
  }

  const fmtDT = (d: Date) =>
    `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

  async function reserve() {
    if (!hotel) return;
    if (!user) { router.push(`/login?next=/shortlet/${id}`); return; }
    if (!datesOk || selectedUnits.length === 0) { setError("Pick dates and at least one room."); return; }
    if (!isPaymentConfigured()) { setError("Online payment isn't configured yet."); return; }
    setBusy(true);
    setError("");
    // Re-check availability against fresh bookings, then lock each room for 10 minutes.
    const fresh = await getBookingsForHotel(id);
    const freshBlocked = blockedUnitIds(fresh, checkIn, checkOut, checkInTime, checkOutTime);
    const clash = selectedUnits.find((u) => freshBlocked.has(u.id));
    if (clash) {
      setBusy(false);
      setBookings(fresh);
      setSelected((prev) => prev.filter((x) => !freshBlocked.has(x)));
      setError(`${clash.name} was just taken by someone else — it's been unselected.`);
      return;
    }
    const results = await Promise.all(
      selectedUnits.map((u) =>
        createPendingBooking({
          hotelId: hotel.id,
          hotelName: hotel.name,
          unitId: u.id,
          unitName: u.name,
          ownerId: hotel.ownerId,
          guestId: user.uid,
          guestName: profile?.displayName ?? user.displayName ?? "Guest",
          checkIn, checkOut, checkInTime, checkOutTime, nights,
          amount: u.pricePerNight * nights,
        })
      )
    );
    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok) {
      setBusy(false);
      setError(`Couldn't hold the room(s): ${failed.error}`);
      return;
    }
    const ids = results.map((r) => (r as { ok: true; id: string }).id);
    setPending({ ids, total, expiresAt: Date.now() + BOOKING_LOCK_MINUTES * 60000 });
    setBusy(false);
    load();
  }

  function payNow() {
    if (!pending || !user?.email || !hotel) return;
    setError("");
    startPayment({
      email: user.email,
      name: profile?.displayName ?? undefined,
      amountNaira: pending.total,
      reference: `bkg-${pending.ids[0]}-${Date.now()}`,
      paymentId: pending.ids.join(","),
      onSuccess: async (token) => {
        setBusy(true);
        const res = await verifyBookingPayment(token, pending.ids);
        setBusy(false);
        if (!res.ok) { setError(res.error ?? "Payment verification failed."); return; }
        const ids = pending.ids;
        setPending(null);
        // Notify host + guest, and open a chat thread between them right away.
        const roomList = selectedUnits.map((u) => u.name).join(", ");
        createNotification({
          userId: hotel.ownerId, type: "payment_received", title: "New booking paid 🎉",
          body: `${profile?.displayName ?? "A guest"} booked ${roomList} at ${hotel.name}, ${checkIn} → ${checkOut}.`,
          link: "/dashboard/bookings",
        }).catch(() => {});
        createNotification({
          userId: user.uid, type: "tenancy", title: "Booking confirmed ✓",
          body: `${roomList} at ${hotel.name}, ${checkIn} → ${checkOut}. The host has been notified.`,
          link: "/dashboard/bookings",
        }).catch(() => {});
        try {
          const cid = await getOrCreateDirectConversation(
            user.uid, profile?.displayName ?? "Guest", hotel.ownerId, hotel.ownerName || "Host"
          );
          await sendMessage(cid, user.uid, profile?.displayName ?? "Guest",
            `📅 Booking confirmed: ${roomList} at ${hotel.name}, ${checkIn} → ${checkOut} (${nights} night${nights === 1 ? "" : "s"}, ${formatNaira(pending.total)}). Booking ref: ${ids[0]}`);
          router.push(`/dashboard/bookings?paid=1`);
        } catch {
          router.push(`/dashboard/bookings?paid=1`);
        }
      },
      onClose: () => {},
    });
  }

  async function messageHost() {
    if (!hotel) return;
    if (!user) { router.push(`/login?next=/shortlet/${id}`); return; }
    const cid = await getOrCreateDirectConversation(user.uid, profile?.displayName ?? "Guest", hotel.ownerId, hotel.ownerName || "Host");
    router.push(`/dashboard/messages?c=${cid}`);
  }

  if (loading) return <p className="py-20 text-center text-sm text-zinc-400">Loading…</p>;
  if (!hotel) return <p className="py-20 text-center text-sm text-zinc-400">This place is no longer listed.</p>;

  const fmtClock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header + gallery */}
      <Link href="/shortlets" className="mb-2 inline-block text-xs font-semibold text-brand">← All hotels &amp; shortlets</Link>
      <h1 className="text-3xl font-extrabold text-foreground">{hotel.name}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-zinc-500"><MapPin className="h-4 w-4" /> {hotel.area}, {hotel.cityName}{hotel.stateName ? `, ${hotel.stateName} State` : ""} · <span className="uppercase text-[11px] font-black tracking-widest text-brand">{hotel.kind}</span></p>

      {(hotel.images.length > 0 || extractYouTubeId(hotel.youtubeUrl ?? "")) && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {hotel.images.slice(0, extractYouTubeId(hotel.youtubeUrl ?? "") ? 2 : 3).map((url, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={i} src={url} alt="" className={`w-full rounded-2xl object-cover ${i === 0 ? "sm:col-span-2" : ""}`} style={{ height: 220 }} />
          ))}
          {(() => {
            const yt = extractYouTubeId(hotel.youtubeUrl ?? "");
            if (!yt) return null;
            return (
              <a href={hotel.youtubeUrl} target="_blank" rel="noopener noreferrer" className="relative block overflow-hidden rounded-2xl bg-zinc-900" style={{ height: 220 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`} alt="Video tour" className="h-full w-full object-cover opacity-80" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">▶</span>
                </span>
              </a>
            );
          })()}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-100">
            {([["overview", "Overview"], ["rooms", "Rooms & Availability"], ["location", "Location"]] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`border-b-2 px-4 py-2.5 text-sm font-bold transition ${tab === t ? "border-brand text-brand" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="py-5">
              <h2 className="text-lg font-extrabold text-foreground">About this property</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{hotel.description || "No description yet."}</p>
              <h2 className="mt-6 text-lg font-extrabold text-foreground">What this place offers</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {hotel.amenities.map((a) => (
                  <div key={a} className="rounded-xl border border-zinc-100 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-600">{a}</div>
                ))}
                {hotel.amenities.length === 0 && <p className="text-xs text-zinc-400">Amenities not listed yet.</p>}
              </div>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-zinc-500">
                <span className="rounded-full bg-zinc-100 px-3 py-1.5">Check-in from {hotel.checkInTime}</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5">Check-out by {hotel.checkOutTime}</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5">{units.length} bookable rooms · {hotel.floors} floor{hotel.floors === 1 ? "" : "s"}</span>
              </div>
            </div>
          )}

          {tab === "rooms" && (
            <div className="py-5">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-in date</label>
                  <input type="date" value={checkIn} min={today()} onChange={(e) => { setCheckIn(e.target.value); setSelected([]); if (checkOut && e.target.value >= checkOut) setCheckOut(plusDays(e.target.value, 1)); }}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Arrival time</label>
                  <input type="time" value={checkInTime} onChange={(e) => { setCheckInTime(e.target.value); setSelected([]); }}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-out date</label>
                  <input type="date" value={checkOut} min={checkIn ? plusDays(checkIn, 1) : today()} onChange={(e) => { setCheckOut(e.target.value); setSelected([]); }}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Departure time</label>
                  <input type="time" value={checkOutTime} onChange={(e) => { setCheckOutTime(e.target.value); setSelected([]); }}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                {datesOk && (
                  <p className="text-xs font-bold text-brand">{nights} night{nights === 1 ? "" : "s"} · {availableCount} of {units.length} rooms free</p>
                )}
                <p className="w-full text-[10px] text-zinc-400">Rooms need a 1-hour turnaround between one guest&apos;s departure and the next arrival — same-day changeovers are fine outside that window.</p>
              </div>

              <div className="mt-4 flex items-center gap-4 text-[11px] font-semibold text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-zinc-300 bg-white" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-brand" /> Selected</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-200" /> Free later that day</span>
              </div>
              {hiddenCount > 0 && (
                <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] font-semibold text-zinc-500">
                  {hiddenCount} room{hiddenCount === 1 ? " is" : "s are"} fully booked for your dates and not shown.
                </p>
              )}

              {floors.map((f) => (
                <div key={f} className="mt-5">
                  <h3 className="text-sm font-bold text-foreground">{f === 0 ? "Ground / Floor 1" : `Floor ${f + 1}`}</h3>
                  {datesOk && units.filter((u) => u.floor === f).every((u) => unitAvail.get(u.id) === "gone") && (
                    <p className="mt-2 text-xs text-zinc-400">All rooms on this floor are fully booked for your dates.</p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {units.filter((u) => u.floor === f && (!datesOk || unitAvail.get(u.id) !== "gone")).map((u) => {
                      const isBlocked = datesOk && blocked.has(u.id);
                      const isSelected = selected.includes(u.id);
                      return (
                        <div key={u.id}
                          className={`rounded-xl border-2 p-3 transition ${
                            isBlocked ? "cursor-not-allowed border-red-100 bg-red-50/50 opacity-70"
                            : isSelected ? "cursor-pointer border-brand bg-brand-light/30"
                            : "cursor-pointer border-zinc-200 bg-white hover:border-brand"
                          }`}
                          onClick={() => toggleUnit(u)}>
                          {u.images[0] ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={u.images[0]} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />
                          ) : (
                            <div className="mb-2 flex h-20 w-full items-center justify-center rounded-lg bg-zinc-50 text-zinc-300"><BedDouble className="h-6 w-6" /></div>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-foreground">{u.name}</p>
                            {isBlocked && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600">FREE LATER — tap for times</span>}
                          </div>
                          <p className="text-xs text-zinc-500">{formatNaira(u.pricePerNight)}/night · <Users className="inline h-3 w-3" /> {u.capacity} · {u.bedType}</p>
                          <button onClick={(e) => { e.stopPropagation(); setDetailUnit(u); setGalleryIdx(0); }}
                            className="mt-1.5 text-[11px] font-semibold text-brand hover:underline">
                            See photos &amp; amenities →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "location" && (
            <div className="py-5">
              <div className="rounded-xl border-l-4 border-brand bg-brand-light/40 px-4 py-3">
                <p className="flex items-center gap-1.5 text-sm font-bold text-brand-dark"><MapPin className="h-4 w-4" /> {hotel.fullAddress ? hotel.fullAddress + ", " : ""}{hotel.area}, {hotel.cityName}{hotel.stateName ? `, ${hotel.stateName} State` : ""}</p>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
                <iframe
                  title={`Map of ${hotel.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${hotel.fullAddress ? hotel.fullAddress + ", " : ""}${hotel.area}, ${hotel.cityName}, ${hotel.stateName ?? ""} Nigeria`)}&output=embed&z=${hotel.fullAddress ? 16 : 13}`}
                  className="h-80 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.fullAddress ? hotel.fullAddress + ", " : ""}${hotel.area}, ${hotel.cityName}, Nigeria`)}`}
                target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">
                Open in Google Maps →
              </a>
            </div>
          )}
        </div>

        {/* Right rail: reserve + host */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-foreground">{datesOk ? `${formatNaira(total)} total` : "Add dates for prices"}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input type="date" value={checkIn} min={today()} onChange={(e) => { setCheckIn(e.target.value); setSelected([]); if (checkOut && e.target.value >= checkOut) setCheckOut(plusDays(e.target.value, 1)); }}
                className="rounded-lg border border-zinc-200 px-2.5 py-2 text-xs outline-none focus:border-brand" />
              <input type="date" value={checkOut} min={checkIn ? plusDays(checkIn, 1) : today()} onChange={(e) => { setCheckOut(e.target.value); setSelected([]); }}
                className="rounded-lg border border-zinc-200 px-2.5 py-2 text-xs outline-none focus:border-brand" />
            </div>
            {selectedUnits.length > 0 && datesOk && (
              <div className="mt-3 space-y-1.5 border-t border-zinc-50 pt-3">
                {selectedUnits.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-600">{u.name} × {nights}n</span>
                    <span className="font-bold text-foreground">{formatNaira(u.pricePerNight * nights)}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-zinc-400"><ShieldCheck className="h-3.5 w-3.5 text-brand" /> All taxes and fees included · escrow protected</p>
            <button onClick={reserve} disabled={busy || !datesOk || selectedUnits.length === 0}
              className="mt-3 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
              {busy ? "Holding your rooms…" : selectedUnits.length > 1 ? `Reserve ${selectedUnits.length} rooms` : "Reserve now"}
            </button>
            {!datesOk && <p className="mt-2 text-center text-[11px] text-zinc-400">Pick dates, then choose your exact room{units.length > 1 ? "s" : ""} under Rooms &amp; Availability.</p>}
            {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Host information</h3>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
                {(hotel.ownerName || "H").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="flex items-center gap-1 text-sm font-bold text-foreground">{hotel.ownerName || "Verified Host"} <ShieldCheck className="h-4 w-4 text-blue-500" /></p>
                <p className="text-[11px] text-zinc-400">Identity verified &amp; secured</p>
              </div>
            </div>
            <button onClick={messageHost} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand">
              <MessageSquare className="h-3.5 w-3.5" /> Message host
            </button>
          </div>
        </div>
      </div>

      {/* Unit detail modal */}
      {detailUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailUnit(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{detailUnit.name}</h3>
              <button onClick={() => setDetailUnit(null)} className="text-zinc-400 hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {detailUnit.images.length > 0 ? (
              <div className="relative mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detailUnit.images[galleryIdx]} alt="" className="h-52 w-full rounded-xl object-cover" />
                {detailUnit.images.length > 1 && (
                  <>
                    <button onClick={() => setGalleryIdx((i) => (i - 1 + detailUnit.images.length) % detailUnit.images.length)}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setGalleryIdx((i) => (i + 1) % detailUnit.images.length)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow"><ChevronRight className="h-4 w-4" /></button>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-3 flex h-40 items-center justify-center rounded-xl bg-zinc-50 text-zinc-300"><BedDouble className="h-8 w-8" /></div>
            )}
            <p className="mt-3 text-sm font-bold text-foreground">{formatNaira(detailUnit.pricePerNight)}/night · {detailUnit.capacity} guest{detailUnit.capacity === 1 ? "" : "s"} · {detailUnit.bedType} bed</p>
            {datesOk && (
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-zinc-50 p-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-in time</label>
                  <input type="time" value={checkInTime} onChange={(e) => { setCheckInTime(e.target.value); setSelected([]); }}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-out time</label>
                  <input type="time" value={checkOutTime} onChange={(e) => { setCheckOutTime(e.target.value); setSelected([]); }}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand" />
                </div>
                <p className="text-[10px] text-zinc-400">Times apply to your stay · 1-hour turnaround between guests</p>
              </div>
            )}
            {detailUnit.youtubeUrl && extractYouTubeId(detailUnit.youtubeUrl) && (
              <a href={detailUnit.youtubeUrl} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                ▶ Watch video tour of this room
              </a>
            )}
            {datesOk && blocked.has(detailUnit.id) && (() => {
              const clashes = conflictsForUnit(bookings, detailUnit.id, checkIn, checkOut, checkInTime, checkOutTime);
              const stayMs = new Date(`${checkOut}T${checkOutTime}:00`).getTime() - new Date(`${checkIn}T${checkInTime}:00`).getTime();
              const next = nextAvailableStart(bookings, detailUnit.id, new Date(`${checkIn}T${checkInTime}:00`), stayMs);
              return (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-800">This room is taken for your selected time:</p>
                  {clashes.slice(0, 3).map((c) => (
                    <p key={c.id} className="mt-1 text-[11px] font-semibold text-amber-700">
                      Booked {fmtDT(new Date(`${c.checkIn}T${c.checkInTime || "14:00"}:00`))} → {fmtDT(new Date(`${c.checkOut}T${c.checkOutTime || "11:00"}:00`))}
                    </p>
                  ))}
                  <p className="mt-2 text-xs font-bold text-green-700">
                    ✓ Next available for a {nights}-night stay: {fmtDT(next)} (after the 1-hour turnaround)
                  </p>
                  <button
                    onClick={() => {
                      const d = next.toISOString().slice(0, 10);
                      const t = `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`;
                      setCheckIn(d); setCheckInTime(t); setCheckOut(plusDays(d, nights)); setSelected([detailUnit.id]); setDetailUnit(null);
                    }}
                    className="mt-2 rounded-full bg-brand px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-dark">
                    Book from {fmtDT(next)} instead
                  </button>
                </div>
              );
            })()}
            {detailUnit.description && <p className="mt-2 text-sm text-zinc-600">{detailUnit.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {detailUnit.amenities.map((a) => (
                <span key={a} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">{a}</span>
              ))}
            </div>
            <button onClick={() => { toggleUnit(detailUnit); setDetailUnit(null); }}
              disabled={datesOk && blocked.has(detailUnit.id)}
              className="mt-4 w-full rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-40">
              {datesOk && blocked.has(detailUnit.id) ? "Taken for these dates" : selected.includes(detailUnit.id) ? "Unselect this room" : "Select this room"}
            </button>
          </div>
        </div>
      )}

      {/* 10-minute payment lock */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <Clock className="mx-auto h-8 w-8 text-brand" />
            <h3 className="mt-2 text-lg font-extrabold text-foreground">Rooms held for you</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedUnits.map((u) => u.name).join(", ")} · {checkIn} → {checkOut}
            </p>
            <p className={`mt-3 text-4xl font-black ${secondsLeft <= 60 ? "text-red-600" : "text-brand"}`}>{fmtClock}</p>
            <p className="mt-1 text-[11px] text-zinc-400">Complete payment before the timer ends or the rooms are released to others.</p>
            <button onClick={payNow} disabled={busy}
              className="mt-4 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
              {busy ? "Confirming…" : `Pay ${formatNaira(pending.total)}`}
            </button>
            <button onClick={expirePending} className="mt-2 text-xs font-semibold text-zinc-400 hover:text-red-500">Cancel and release rooms</button>
            {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
