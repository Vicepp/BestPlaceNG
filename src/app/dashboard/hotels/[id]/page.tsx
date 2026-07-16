"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Eye, Copy, MessageSquare, ExternalLink, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getHotelById, getUnitsForHotel, getBookingsForHotel, getHotelViewsForOwner,
  updateHotel, updateUnit, applyUnitSetupToAll, setBookingStatus, currentlyOccupiedUnitIds,
  UNIT_AMENITIES, HOTEL_AMENITIES,
  type Hotel, type HotelUnit, type HotelBooking,
} from "@/data/hotels";
import { formatNaira } from "@/data/apartments";
import { uploadImages } from "@/lib/storage";
import { createNotification } from "@/data/notifications";
import { getOrCreateDirectConversation } from "@/data/conversations";

const STATUS_STYLE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-zinc-100 text-zinc-500",
  expired: "bg-red-100 text-red-600",
};

export default function ManageHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [units, setUnits] = useState<HotelUnit[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [views, setViews] = useState(0);
  const [editing, setEditing] = useState<HotelUnit | null>(null);
  const [editHotel, setEditHotel] = useState<Hotel | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [h, u, b] = await Promise.all([getHotelById(id), getUnitsForHotel(id), getBookingsForHotel(id)]);
    setHotel(h); setUnits(u); setBookings(b.sort((x, y) => y.createdAt.localeCompare(x.createdAt)));
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    getHotelViewsForOwner(user.uid).then((v) => setViews(v.filter((x) => x.hotelId === id).length));
  }, [user, id]);

  if (loading) return <p className="text-sm text-zinc-400">Loading hotel...</p>;
  if (!hotel || hotel.ownerId !== user?.uid) return <p className="text-sm text-zinc-400">Hotel not found.</p>;

  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);
  const occupiedNow = currentlyOccupiedUnitIds(bookings);
  const activeUnits = units.filter((u) => u.status === "active");
  const freeNow = activeUnits.filter((u) => !occupiedNow.has(u.id)).length;

  async function saveUnit() {
    if (!editing) return;
    setBusy(true);
    await updateUnit(editing.id, {
      name: editing.name, floor: editing.floor, description: editing.description,
      amenities: editing.amenities, pricePerNight: editing.pricePerNight,
      capacity: editing.capacity, bedType: editing.bedType, images: editing.images, status: editing.status,
      youtubeUrl: editing.youtubeUrl ?? "",
    });
    setBusy(false);
    setMsg(`${editing.name} saved.`);
    setEditing(null);
    load();
  }

  async function applyToAll() {
    if (!editing) return;
    setBusy(true);
    await updateUnit(editing.id, { ...editing });
    await applyUnitSetupToAll(editing, units);
    setBusy(false);
    setMsg(`Applied ${editing.name}'s setup (price, amenities, description, capacity, bed) to all ${units.length} units. Photos stay per-unit.`);
    setEditing(null);
    load();
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length || !editing) return;
    setUploading(true);
    const urls = await uploadImages([...files]);
    setEditing((prev) => (prev ? { ...prev, images: [...prev.images, ...urls] } : prev));
    setUploading(false);
  }

  async function actOnBooking(b: HotelBooking, status: "approved" | "cancelled" | "completed") {
    setBusy(true);
    await setBookingStatus(b.id, status);
    createNotification({
      userId: b.guestId,
      type: "tenancy",
      title: `Booking ${status}`,
      body: `${b.unitName} at ${hotel!.name} (${b.checkIn} → ${b.checkOut}) is now ${status}.`,
      link: "/dashboard/bookings",
    }).catch(() => {});
    setBusy(false);
    load();
  }

  async function chatGuest(b: HotelBooking) {
    if (!user) return;
    const cid = await getOrCreateDirectConversation(user.uid, profile?.displayName ?? "Host", b.guestId, b.guestName);
    router.push(`/dashboard/messages?c=${cid}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dashboard/hotels" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand"><ArrowLeft className="h-3.5 w-3.5" /> All hotels</Link>
          <h1 className="text-2xl font-bold text-foreground">{hotel.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{hotel.area}, {hotel.cityName} · {units.length} units · <Eye className="inline h-3.5 w-3.5" /> {views} views (anonymous)</p>
          <p className="mt-1.5 flex items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700">{freeNow} available now</span>
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-600">{occupiedNow.size} booked now</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditHotel({ ...hotel })} className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark">
            <Pencil className="h-3.5 w-3.5" /> Edit property
          </button>
          <Link href={`/shortlet/${hotel.id}`} target="_blank" className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand">
            <ExternalLink className="h-3.5 w-3.5" /> View public page
          </Link>
        </div>
      </div>

      {msg && <p className="rounded-lg bg-green-50 px-4 py-2.5 text-xs text-green-700">{msg}</p>}

      {/* Units by floor */}
      {floors.map((f) => (
        <div key={f} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">{f === 0 ? "Ground / Floor 1" : `Floor ${f + 1}`}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {units.filter((u) => u.floor === f).map((u) => (
              <button key={u.id} onClick={() => setEditing(u)}
                className={`rounded-xl border p-3 text-left transition hover:border-brand hover:shadow ${u.status === "hidden" ? "border-zinc-100 opacity-50" : "border-zinc-200"}`}>
                {u.images[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={u.images[0]} alt="" className="mb-2 h-16 w-full rounded-lg object-cover" />
                ) : (
                  <div className="mb-2 flex h-16 w-full items-center justify-center rounded-lg bg-zinc-50 text-[10px] text-zinc-300">No photos yet</div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{u.name}</p>
                  {u.status !== "hidden" && (
                    occupiedNow.has(u.id)
                      ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600">BOOKED</span>
                      : <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">FREE</span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">{formatNaira(u.pricePerNight)}/night · {u.capacity} guests</p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Property editor */}
      {editHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditHotel(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground">Edit {editHotel.name}</h2>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Name</label>
                  <input value={editHotel.name} onChange={(e) => setEditHotel({ ...editHotel, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Area</label>
                  <input value={editHotel.area} onChange={(e) => setEditHotel({ ...editHotel, area: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Default price/night (₦)</label>
                  <input type="number" value={editHotel.defaultPricePerNight} onChange={(e) => setEditHotel({ ...editHotel, defaultPricePerNight: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-in</label>
                    <input type="time" value={editHotel.checkInTime} onChange={(e) => setEditHotel({ ...editHotel, checkInTime: e.target.value })}
                      className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm outline-none focus:border-brand" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-out</label>
                    <input type="time" value={editHotel.checkOutTime} onChange={(e) => setEditHotel({ ...editHotel, checkOutTime: e.target.value })}
                      className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm outline-none focus:border-brand" />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Full address (public, pinned on the map)</label>
                <input value={editHotel.fullAddress ?? ""} onChange={(e) => setEditHotel({ ...editHotel, fullAddress: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                <div className="mt-2 overflow-hidden rounded-xl border border-zinc-100">
                  <iframe title="Address preview"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${editHotel.fullAddress ? editHotel.fullAddress + ", " : ""}${editHotel.area}, ${editHotel.cityName}, Nigeria`)}&output=embed&z=${editHotel.fullAddress ? 16 : 13}`}
                    className="h-40 w-full border-0" loading="lazy" />
                  <p className="bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold text-zinc-400">Adjust the address until the pin is exactly right — guests see this map.</p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-zinc-400">YouTube video tour</label>
                <input value={editHotel.youtubeUrl ?? ""} onChange={(e) => setEditHotel({ ...editHotel, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=…"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Description</label>
                <textarea value={editHotel.description} rows={3} onChange={(e) => setEditHotel({ ...editHotel, description: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold text-zinc-400">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {HOTEL_AMENITIES.map((a) => (
                    <button key={a} type="button"
                      onClick={() => setEditHotel({ ...editHotel, amenities: editHotel.amenities.includes(a) ? editHotel.amenities.filter((x) => x !== a) : [...editHotel.amenities, a] })}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                        editHotel.amenities.includes(a) ? "border-brand bg-brand text-white" : "border-zinc-200 text-zinc-500"
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={async () => {
                  setBusy(true);
                  await updateHotel(editHotel.id, {
                    name: editHotel.name, area: editHotel.area, fullAddress: editHotel.fullAddress ?? "",
                    youtubeUrl: editHotel.youtubeUrl ?? "", description: editHotel.description,
                    defaultPricePerNight: editHotel.defaultPricePerNight, checkInTime: editHotel.checkInTime,
                    checkOutTime: editHotel.checkOutTime, amenities: editHotel.amenities,
                  });
                  setBusy(false);
                  setMsg("Property details saved.");
                  setEditHotel(null);
                  load();
                }}
                disabled={busy}
                className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">
                {busy ? "Saving…" : "Save property"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit editor */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground">Edit {editing.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Room name</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Price / night (₦)</label>
                <input type="number" value={editing.pricePerNight} onChange={(e) => setEditing({ ...editing, pricePerNight: Number(e.target.value) })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Max guests</label>
                <input type="number" min={1} value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Bed type</label>
                <select value={editing.bedType} onChange={(e) => setEditing({ ...editing, bedType: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm outline-none focus:border-brand">
                  {["King", "Queen", "Double", "Twin", "Single"].map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Description</label>
              <textarea value={editing.description} rows={2} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="What's special about this room?"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-[10px] font-semibold text-zinc-400">YouTube video of this room (optional)</label>
              <input value={editing.youtubeUrl ?? ""} onChange={(e) => setEditing({ ...editing, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=…"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <p className="mt-3 text-[10px] font-semibold text-zinc-400">Room amenities</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {UNIT_AMENITIES.map((a) => (
                <button key={a} type="button"
                  onClick={() => setEditing({ ...editing, amenities: editing.amenities.includes(a) ? editing.amenities.filter((x) => x !== a) : [...editing.amenities, a] })}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    editing.amenities.includes(a) ? "border-brand bg-brand text-white" : "border-zinc-200 text-zinc-500"
                  }`}>
                  {a}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-semibold text-zinc-400">Photos of this room</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {editing.images.map((url, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  <button onClick={() => setEditing({ ...editing, images: editing.images.filter((_, j) => j !== i) })}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">×</button>
                </div>
              ))}
              <label className="flex h-16 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-brand hover:text-brand">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <input type="checkbox" checked={editing.status === "hidden"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.checked ? "hidden" : "active" })} />
                Hide from booking
              </label>
              <div className="flex gap-2">
                <button onClick={applyToAll} disabled={busy}
                  className="flex items-center gap-1 rounded-full border border-accent px-3 py-2 text-xs font-semibold text-accent-dark hover:bg-accent hover:text-white disabled:opacity-50">
                  <Copy className="h-3.5 w-3.5" /> Apply to all units
                </button>
                <button onClick={saveUnit} disabled={busy}
                  className="rounded-full bg-brand px-5 py-2 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-50">
                  {busy ? "Saving…" : "Save room"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings on this hotel */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <h2 className="px-6 pt-6 text-sm font-bold text-foreground">Bookings ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <p className="px-6 py-8 text-center text-xs text-zinc-400">No bookings yet — share your public page to start taking reservations.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-6 py-2 font-medium">Guest</th>
                <th className="px-6 py-2 font-medium">Room</th>
                <th className="px-6 py-2 font-medium">Dates</th>
                <th className="px-6 py-2 font-medium">Amount</th>
                <th className="px-6 py-2 font-medium">Status</th>
                <th className="px-6 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-6 py-3 font-medium text-foreground">{b.guestName}</td>
                  <td className="px-6 py-3 text-zinc-600">{b.unitName}</td>
                  <td className="px-6 py-3 text-zinc-600">{b.checkIn} → {b.checkOut} ({b.nights}n)</td>
                  <td className="px-6 py-3 font-semibold text-foreground">{formatNaira(b.amount)}</td>
                  <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[b.status]}`}>{b.status.replace("_", " ")}</span></td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => chatGuest(b)} title="Message guest" className="text-zinc-400 hover:text-brand"><MessageSquare className="h-4 w-4" /></button>
                      {b.status === "approved" && (
                        <>
                          <button onClick={() => actOnBooking(b, "completed")} disabled={busy} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100">Complete</button>
                          <button onClick={() => actOnBooking(b, "cancelled")} disabled={busy} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100">Cancel</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
