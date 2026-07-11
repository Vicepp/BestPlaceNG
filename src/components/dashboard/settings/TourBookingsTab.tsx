"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setFirestoreDoc } from "@/lib/firestoreWrite";
import { isAllowedBookingLink, ALLOWED_BOOKING_PROVIDERS, WEEKDAY_LABELS, DEFAULT_AVAILABILITY } from "@/data/tours";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
function hourLabel(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${period}`;
}

/** Landlord tour-booking preferences: built-in calendar (with availability) or
 * a whitelisted external scheduling link. */
export default function TourBookingsTab() {
  const { user, profile } = useAuth();
  const [bookingMode, setBookingMode] = useState<"internal" | "external">("internal");
  const [bookingLink, setBookingLink] = useState("");
  const [availDays, setAvailDays] = useState<number[]>(DEFAULT_AVAILABILITY.days);
  const [startHour, setStartHour] = useState<number>(DEFAULT_AVAILABILITY.startHour);
  const [endHour, setEndHour] = useState<number>(DEFAULT_AVAILABILITY.endHour);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setBookingMode(profile.bookingMode ?? "internal");
    setBookingLink(profile.bookingLink ?? "");
    const av = profile.tourAvailability ?? DEFAULT_AVAILABILITY;
    setAvailDays(av.days);
    setStartHour(av.startHour);
    setEndHour(av.endHour);
  }, [profile]);

  function toggleDay(d: number) {
    setAvailDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }

  async function handleSave() {
    if (!user) return;
    if (bookingMode === "external") {
      if (!isAllowedBookingLink(bookingLink)) {
        setMsg({ ok: false, text: `That link isn't accepted. Use a secure (https) link from a known scheduler: ${ALLOWED_BOOKING_PROVIDERS}.` });
        return;
      }
    } else {
      if (availDays.length === 0) { setMsg({ ok: false, text: "Pick at least one day you're available for tours." }); return; }
      if (endHour <= startHour) { setMsg({ ok: false, text: "Your tour end time must be after the start time." }); return; }
    }
    setSaving(true);
    await setFirestoreDoc("users", user.uid, {
      bookingMode,
      bookingLink: bookingMode === "external" ? bookingLink.trim() : undefined,
      tourAvailability: bookingMode === "internal" ? { days: availDays, startHour, endHour } : undefined,
    });
    setSaving(false);
    setMsg({ ok: true, text: "Tour booking settings saved." });
  }

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground"><CalendarDays className="h-5 w-5 text-brand" /> Property tour bookings</h2>
      <p className="mt-1 text-sm text-zinc-400">How prospective tenants book a viewing of your listings.</p>

      <div className="mt-4 space-y-2">
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${bookingMode === "internal" ? "border-brand bg-brand-light" : "border-zinc-200"}`}>
          <input type="radio" name="bookingMode" checked={bookingMode === "internal"} onChange={() => setBookingMode("internal")} className="mt-0.5 h-4 w-4 accent-brand" />
          <div>
            <p className="text-sm font-semibold text-foreground">Built-in calendar</p>
            <p className="text-xs text-zinc-500">Tenants pick a free time slot on BestPlaceNG; booked slots are blocked automatically and you&apos;re notified.</p>
          </div>
        </label>
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${bookingMode === "external" ? "border-brand bg-brand-light" : "border-zinc-200"}`}>
          <input type="radio" name="bookingMode" checked={bookingMode === "external"} onChange={() => setBookingMode("external")} className="mt-0.5 h-4 w-4 accent-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">My own booking link</p>
            <p className="text-xs text-zinc-500">Tenants open your scheduling page instead.</p>
            {bookingMode === "external" && (
              <input value={bookingLink} onChange={(e) => setBookingLink(e.target.value)} placeholder="https://calendly.com/your-name"
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            )}
          </div>
        </label>
      </div>

      {bookingMode === "external" && (
        <p className="mt-2 text-[11px] text-zinc-400">For your safety and tenants&apos;, only links from known schedulers are accepted ({ALLOWED_BOOKING_PROVIDERS}). Other links are rejected to prevent phishing.</p>
      )}

      {bookingMode === "internal" && (
        <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
          <p className="text-xs font-bold text-foreground">Your availability</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">Tenants can only pick days and hours you&apos;ve opened here.</p>

          <label className="mt-3 block text-[11px] font-semibold text-zinc-500">Days</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, d) => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${availDays.includes(d) ? "bg-brand text-white" : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:ring-brand"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500">From</label>
              <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500">To</label>
              <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}

      <button onClick={handleSave} disabled={saving} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {saving ? "Saving…" : "Save booking settings"}
      </button>
    </div>
  );
}
