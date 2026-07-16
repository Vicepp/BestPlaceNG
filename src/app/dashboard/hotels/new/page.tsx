"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hotel as HotelIcon, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createHotel, createUnit, HOTEL_AMENITIES, UNIT_AMENITIES } from "@/data/hotels";
import { uploadImages } from "@/lib/storage";
import { cities } from "@/data/cities";

/** New hotel/shortlet wizard: property details → how many floors → how many
 * units per floor. Creates the hotel and auto-generates every unit (numbered
 * per floor) with shared defaults; per-unit photos/amenities are edited on the
 * manage page afterwards, individually or applied to all at once. */
export default function NewHotelPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<"hotel" | "shortlet">("hotel");
  const [citySlug, setCitySlug] = useState("");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [floors, setFloors] = useState(1);
  const [unitsPerFloor, setUnitsPerFloor] = useState<number[]>([4]);
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const totalUnits = unitsPerFloor.reduce((s, n) => s + (n || 0), 0);

  function setFloorCount(n: number) {
    const count = Math.max(1, Math.min(20, n));
    setFloors(count);
    setUnitsPerFloor((prev) => Array.from({ length: count }, (_, i) => prev[i] ?? prev[prev.length - 1] ?? 4));
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const urls = await uploadImages([...files]);
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function submit() {
    if (!user) return;
    if (!name.trim() || !citySlug || !area.trim() || !price || totalUnits < 1) {
      setError("Fill in the name, city, area, nightly price and at least one unit.");
      return;
    }
    setError("");
    setBusy(true);
    const city = cities.find((c) => c.slug === citySlug);
    const res = await createHotel({
      ownerId: user.uid,
      ownerName: profile?.displayName ?? "",
      name: name.trim(),
      kind,
      description: description.trim(),
      citySlug,
      cityName: city?.name ?? citySlug,
      stateName: city?.stateName,
      area: area.trim(),
      fullAddress: fullAddress.trim(),
      youtubeUrl: youtubeUrl.trim(),
      images,
      amenities,
      floors,
      checkInTime,
      checkOutTime,
      defaultPricePerNight: Number(price),
    });
    if (!res.ok) { setBusy(false); setError(`Couldn't create: ${res.error}`); return; }

    // Generate the units floor by floor: Room 101, 102… 201, 202…
    const defaults = UNIT_AMENITIES.slice(0, 6) as unknown as string[];
    const creations: Promise<unknown>[] = [];
    unitsPerFloor.forEach((count, floorIdx) => {
      for (let i = 1; i <= (count || 0); i++) {
        creations.push(
          createUnit({
            hotelId: res.id,
            ownerId: user.uid,
            name: `Room ${floorIdx + 1}${String(i).padStart(2, "0")}`,
            floor: floorIdx,
            description: "",
            images: [],
            amenities: defaults,
            pricePerNight: Number(price),
            capacity,
            bedType: "Double",
            status: "active",
          })
        );
      }
    });
    await Promise.all(creations);
    router.push(`/dashboard/hotels/${res.id}?created=1`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><HotelIcon className="h-6 w-6 text-brand" /> List a Hotel / Shortlet</h1>
        <p className="mt-1 text-sm text-zinc-500">Set the property up once — every room is generated for you, then you customise them individually or all at once.</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-400">Property name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Palm Crest Suites"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-400">Type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as "hotel" | "shortlet")}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
              <option value="hotel">Hotel (rooms)</option>
              <option value="shortlet">Shortlet (apartments)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-400">City</label>
            <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
              <option value="">Select city…</option>
              {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.stateName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-400">Area / neighbourhood</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lekki Phase 1"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">Full address <span className="font-normal">(shown publicly on your page and pinned on the map)</span></label>
          <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Street + number"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          {(fullAddress.trim() || area.trim()) && citySlug && (
            <div className="mt-2 overflow-hidden rounded-xl border border-zinc-100">
              <iframe
                title="Address preview"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${fullAddress.trim() ? fullAddress.trim() + ", " : ""}${area}, ${cities.find((c) => c.slug === citySlug)?.name ?? ""}, Nigeria`)}&output=embed&z=${fullAddress.trim() ? 16 : 13}`}
                className="h-48 w-full border-0" loading="lazy" />
              <p className="bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold text-zinc-400">Check the pin — adjust the address text until the map points at the right spot. Guests will see exactly this.</p>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">YouTube video tour <span className="font-normal">(optional)</span></label>
          <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="What makes this place great?"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      {/* Floors & units — the heart of the wizard */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Floors &amp; Units</h2>
        <p className="mt-1 text-xs text-zinc-400">How many floors, and how many rooms on each? Guests can pick their floor when booking.</p>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs font-semibold text-zinc-500">Floors</label>
          <input type="number" min={1} max={20} value={floors} onChange={(e) => setFloorCount(Number(e.target.value))}
            className="w-20 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-dark">{totalUnits} units total</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {unitsPerFloor.map((n, i) => (
            <div key={i}>
              <label className="mb-1 block text-[10px] font-semibold text-zinc-400">{i === 0 ? "Ground / Floor 1" : `Floor ${i + 1}`} rooms</label>
              <input type="number" min={0} max={50} value={n}
                onChange={(e) => setUnitsPerFloor((prev) => prev.map((x, j) => (j === i ? Number(e.target.value) : x)))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Price / night (₦)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25000"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Guests / room</label>
            <input type="number" min={1} max={10} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-in</label>
            <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Check-out</label>
            <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>
      </div>

      {/* Property amenities + photos */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">What this place offers</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOTEL_AMENITIES.map((a) => (
            <button key={a} type="button"
              onClick={() => setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                amenities.includes(a) ? "border-brand bg-brand text-white" : "border-zinc-200 text-zinc-500 hover:border-brand hover:text-brand"
              }`}>
              {a}
            </button>
          ))}
        </div>
        <h2 className="mt-5 text-sm font-bold text-foreground">Property photos</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {images.map((url, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={i} src={url} alt="" className="h-20 w-28 rounded-lg object-cover" />
          ))}
          <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-brand hover:text-brand">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-[10px] font-semibold">{uploading ? "Uploading…" : "Add photos"}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
          </label>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      <button onClick={submit} disabled={busy}
        className="w-full rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {busy ? "Creating property and generating units…" : `Create property + generate ${totalUnits} units`}
      </button>
    </div>
  );
}
