"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, User, Phone, Building2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getToursForLandlord, cancelTour, formatSlot, WEEKDAY_LABELS, type TourBooking } from "@/data/tours";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { user, profile, activeView } = useAuth();
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selected, setSelected] = useState<string | null>(ymd(new Date()));
  const [cancelling, setCancelling] = useState<string | null>(null);

  const usesExternal = profile?.bookingMode === "external";

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const rows = await getToursForLandlord(user.uid);
      if (alive) { setBookings(rows.filter((b) => b.status === "booked")); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [user]);

  // Group active bookings by their yyyy-mm-dd date, each list sorted by time.
  const byDate = useMemo(() => {
    const map: Record<string, TourBooking[]> = {};
    for (const b of bookings) (map[b.date] ??= []).push(b);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [bookings]);

  // Build the calendar grid: leading blanks for the weekday of the 1st, then days.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const lead = first.getDay(); // 0=Sun
    const out: (string | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) out.push(ymd(new Date(view.year, view.month, day)));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [view]);

  const todayKey = ymd(new Date());
  const monthTotal = useMemo(
    () => Object.entries(byDate).filter(([k]) => k.startsWith(`${view.year}-${String(view.month + 1).padStart(2, "0")}`)).reduce((n, [, v]) => n + v.length, 0),
    [byDate, view]
  );

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  async function handleCancel(b: TourBooking) {
    if (!confirm(`Cancel the ${formatSlot(b.time)} tour of "${b.apartmentTitle}" with ${b.tenantName}?`)) return;
    setCancelling(b.id);
    const res = await cancelTour(b.id);
    setCancelling(null);
    if (res.ok) setBookings((prev) => prev.filter((x) => x.id !== b.id));
    else alert(res.error ?? "Couldn't cancel that tour.");
  }

  const selectedBookings = selected ? byDate[selected] ?? [] : [];
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  if (activeView !== "landlord") {
    return (
      <div className="rounded-2xl border border-zinc-100 bg-white p-8 text-center shadow-sm">
        <CalendarDays className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
        <p className="text-sm font-semibold text-foreground">Tour calendar is for landlords</p>
        <p className="mt-1 text-sm text-zinc-500">Switch to the landlord view to see tours booked on your listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><CalendarDays className="h-6 w-6 text-brand" /> Tour calendar</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Viewings prospective tenants have booked on your listings.</p>
        </div>
      </div>

      {usesExternal ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-900">You&apos;re using your own booking link</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-amber-800">
            Tours are handled on your external scheduler, so they don&apos;t appear here. Switch to the built-in calendar in{" "}
            <Link href="/dashboard/settings" className="font-semibold underline">Settings</Link> to manage bookings on BestPlaceNG.
          </p>
        </div>
      ) : (
        <>
          {/* Month toolbar / filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1">
              <button onClick={() => shiftMonth(-1)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-50" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => shiftMonth(1)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-50" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
              <button
                onClick={() => { const d = new Date(); setView({ year: d.getFullYear(), month: d.getMonth() }); setSelected(ymd(d)); }}
                className="ml-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand">
                Today
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select value={view.month} onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-brand">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={view.year} onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-brand">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-zinc-400">
            {loading ? "Loading tours…" : `${monthTotal} tour${monthTotal === 1 ? "" : "s"} in ${MONTHS[view.month]} ${view.year}`}
          </p>

          <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
            {/* Calendar grid */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm sm:p-4">
              <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                {WEEKDAY_LABELS.map((d) => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((key, i) => {
                  if (!key) return <div key={`blank-${i}`} className="aspect-square" />;
                  const day = Number(key.slice(8));
                  const dayBookings = byDate[key] ?? [];
                  const isToday = key === todayKey;
                  const isSelected = key === selected;
                  return (
                    <button key={key} onClick={() => setSelected(key)}
                      className={`flex aspect-square flex-col items-center justify-start rounded-xl border p-1 text-left transition sm:p-1.5 ${
                        isSelected ? "border-brand bg-brand-light" : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
                      }`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? "bg-brand text-white" : "text-foreground"
                      }`}>{day}</span>
                      {dayBookings.length > 0 && (
                        <span className="mt-auto w-full">
                          <span className="mx-auto block rounded-md bg-brand/10 px-1 py-0.5 text-center text-[10px] font-bold text-brand">
                            {dayBookings.length} tour{dayBookings.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected-day detail */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-foreground">
                {selected ? new Date(selected + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "Pick a day"}
              </h2>
              {selectedBookings.length === 0 ? (
                <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-6 text-center text-xs text-zinc-400">No tours booked on this day.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {selectedBookings.map((b) => (
                    <li key={b.id} className="rounded-xl border border-zinc-100 p-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-brand"><Clock className="h-3.5 w-3.5" /> {formatSlot(b.time)}</span>
                        <button onClick={() => handleCancel(b)} disabled={cancelling === b.id}
                          className="rounded-full p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50" aria-label="Cancel tour">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600"><Building2 className="h-3.5 w-3.5 text-zinc-400" /> {b.apartmentTitle}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600"><User className="h-3.5 w-3.5 text-zinc-400" /> {b.tenantName}</p>
                      {b.tenantPhone && (
                        <a href={`tel:${b.tenantPhone}`} className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand"><Phone className="h-3.5 w-3.5" /> {b.tenantPhone}</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
