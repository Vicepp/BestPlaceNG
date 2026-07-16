"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Search, MessageSquare, Eye, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getBookingsForGuest, getBookingsForOwner, getHotelViewsForOwner, setBookingStatus,
  type HotelBooking, type BookingStatus,
} from "@/data/hotels";
import { formatNaira } from "@/data/apartments";
import { createNotification } from "@/data/notifications";
import { getOrCreateDirectConversation } from "@/data/conversations";

const TABS: { key: "all" | BookingStatus; label: string }[] = [
  { key: "all", label: "All Bookings" },
  { key: "pending_payment", label: "Pending Payment" },
  { key: "approved", label: "Approved" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "expired", label: "Expired" },
];

const STATUS_STYLE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-zinc-100 text-zinc-500",
  expired: "bg-red-100 text-red-600",
};

export default function BookingsPage() {
  const { user, profile, activeView } = useAuth();
  const router = useRouter();
  const isHost = activeView === "landlord";
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [views, setViews] = useState(0);
  const [tab, setTab] = useState<"all" | BookingStatus>("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const [b, v] = await Promise.all([
      isHost ? getBookingsForOwner(user.uid) : getBookingsForGuest(user.uid),
      isHost ? getHotelViewsForOwner(user.uid) : Promise.resolve([]),
    ]);
    setBookings(b);
    setViews(v.length);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => ({
    total: bookings.length,
    approved: bookings.filter((b) => b.status === "approved" && b.checkOut >= now).length,
    past: bookings.filter((b) => b.status === "completed" || (b.status === "approved" && b.checkOut < now)).length,
    pending: bookings.filter((b) => b.status === "pending_payment").length,
  }), [bookings, now]);

  const filtered = bookings.filter((b) => {
    if (tab !== "all" && b.status !== tab) return false;
    const s = q.trim().toLowerCase();
    return !s || `${b.hotelName} ${b.unitName} ${b.guestName}`.toLowerCase().includes(s);
  });

  async function act(b: HotelBooking, status: BookingStatus) {
    setBusy(true);
    await setBookingStatus(b.id, status);
    const other = isHost ? b.guestId : b.ownerId;
    createNotification({
      userId: other, type: "tenancy", title: `Booking ${status.replace("_", " ")}`,
      body: `${b.unitName} at ${b.hotelName} (${b.checkIn} → ${b.checkOut}) is now ${status.replace("_", " ")}.`,
      link: "/dashboard/bookings",
    }).catch(() => {});
    setBusy(false);
    load();
  }

  async function chat(b: HotelBooking) {
    if (!user) return;
    const otherId = isHost ? b.guestId : b.ownerId;
    const otherName = isHost ? b.guestName : b.hotelName;
    const cid = await getOrCreateDirectConversation(user.uid, profile?.displayName ?? "", otherId, otherName);
    router.push(`/dashboard/messages?c=${cid}`);
  }

  if (loading) return <p className="text-sm text-zinc-400">Loading bookings...</p>;

  const CARDS = [
    { label: "Total", value: stats.total, sub: "All bookings", color: "text-brand" },
    { label: "Approved", value: stats.approved, sub: "Active bookings", color: "text-green-600" },
    { label: "Past", value: stats.past, sub: "Completed stays", color: "text-blue-600" },
    { label: "Pending Payment", value: stats.pending, sub: "Awaiting payment", color: "text-amber-600" },
    ...(isHost ? [{ label: "Listing Views", value: views, sub: "Anonymous — no viewer details", color: "text-violet-600" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings <span className="text-sm font-semibold text-zinc-400">({filtered.length} results)</span></h1>
        <p className="mt-1 text-sm text-zinc-500">{isHost ? "Reservations on your hotels and shortlets" : "Your stays — upcoming, past and pending"}</p>
      </div>

      <div className={`grid grid-cols-2 gap-4 ${isHost ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {CARDS.map((c) => (
          <div key={c.label} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">{c.label === "Listing Views" && <Eye className="h-3.5 w-3.5" />}{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{c.value}</p>
            <p className={`mt-1 text-xs font-semibold ${c.color}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isHost ? "Search by property, room or guest…" : "Search by property or room…"}
          className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand" />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-zinc-100">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-bold transition ${tab === t.key ? "border-brand text-brand" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-bold text-foreground">No bookings here yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isHost ? "Bookings on your properties will appear here the moment a guest reserves." : <>Browse <Link href="/shortlets" className="font-semibold text-brand">hotels &amp; shortlets</Link> to make your first booking.</>}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-6 py-3 font-medium">Property</th>
                {isHost && <th className="px-6 py-3 font-medium">Guest</th>}
                <th className="px-6 py-3 font-medium">Dates</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-6 py-3">
                    <Link href={`/shortlet/${b.hotelId}`} className="font-semibold text-foreground hover:text-brand">{b.hotelName}</Link>
                    <p className="flex items-center gap-1 text-xs text-zinc-400">{b.unitName} · <MapPin className="h-3 w-3" /> <Link href={`/shortlet/${b.hotelId}?tab=location`} className="hover:text-brand">view location</Link></p>
                  </td>
                  {isHost && <td className="px-6 py-3 text-zinc-600">{b.guestName}</td>}
                  <td className="px-6 py-3 text-zinc-600">{b.checkIn} → {b.checkOut} <span className="text-zinc-400">({b.nights}n)</span></td>
                  <td className="px-6 py-3 font-semibold text-foreground">{formatNaira(b.amount)}</td>
                  <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[b.status]}`}>{b.status.replace("_", " ")}</span></td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => chat(b)} title={isHost ? "Message guest" : "Message host"} className="text-zinc-400 hover:text-brand"><MessageSquare className="h-4 w-4" /></button>
                      {isHost && b.status === "approved" && (
                        <>
                          <button onClick={() => act(b, "completed")} disabled={busy} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100">Complete</button>
                          <button onClick={() => act(b, "cancelled")} disabled={busy} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100">Cancel</button>
                        </>
                      )}
                      {!isHost && b.status === "pending_payment" && (
                        <Link href={`/shortlet/${b.hotelId}`} className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-dark">Rebook &amp; pay</Link>
                      )}
                      {!isHost && (b.status === "pending_payment" || b.status === "approved") && (
                        <button onClick={() => act(b, "cancelled")} disabled={busy} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
