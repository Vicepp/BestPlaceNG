"use client";

import { useEffect, useState } from "react";
import { useAuth, type DashboardView } from "@/context/AuthContext";
import { setFirestoreDoc } from "@/lib/firestoreWrite";
import { uploadFile } from "@/lib/storage";
import { isAllowedBookingLink, ALLOWED_BOOKING_PROVIDERS, WEEKDAY_LABELS, DEFAULT_AVAILABILITY } from "@/data/tours";
import { Camera, Save, CalendarDays } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
function hourLabel(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${period}`;
}

export default function SettingsPage() {
  const { user, profile, activeView, setActiveView } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [bookingMode, setBookingMode] = useState<"internal" | "external">("internal");
  const [bookingLink, setBookingLink] = useState("");
  const [availDays, setAvailDays] = useState<number[]>(DEFAULT_AVAILABILITY.days);
  const [startHour, setStartHour] = useState<number>(DEFAULT_AVAILABILITY.startHour);
  const [endHour, setEndHour] = useState<number>(DEFAULT_AVAILABILITY.endHour);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setBusinessName(profile.businessName ?? "");
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
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

  async function handleSaveBooking() {
    if (!user) return;
    if (bookingMode === "external") {
      if (!isAllowedBookingLink(bookingLink)) {
        setBookingMsg({ ok: false, text: `That link isn't accepted. Use a secure (https) link from a known scheduler: ${ALLOWED_BOOKING_PROVIDERS}.` });
        return;
      }
    } else {
      if (availDays.length === 0) {
        setBookingMsg({ ok: false, text: "Pick at least one day you're available for tours." });
        return;
      }
      if (endHour <= startHour) {
        setBookingMsg({ ok: false, text: "Your tour end time must be after the start time." });
        return;
      }
    }
    setBookingSaving(true);
    await setFirestoreDoc("users", user.uid, {
      bookingMode,
      bookingLink: bookingMode === "external" ? bookingLink.trim() : undefined,
      tourAvailability: bookingMode === "internal" ? { days: availDays, startHour, endHour } : undefined,
    });
    setBookingSaving(false);
    setBookingMsg({ ok: true, text: "Tour booking settings saved." });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const result = await uploadFile(file, `avatars/${user.uid}`);
    setUploading(false);
    if (result.ok) setAvatarUrl(result.url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await setFirestoreDoc("users", user.uid, {
      displayName: displayName.trim(),
      businessName: businessName.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Dashboard view */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Dashboard view</h2>
        <p className="mt-1 text-xs text-zinc-400">Switch between landlord and tenant perspective.</p>
        <div className="mt-3 flex max-w-xs rounded-full bg-zinc-100 p-1 text-sm font-semibold">
          {(["landlord", "tenant"] as DashboardView[]).map((v) => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`flex-1 rounded-full px-4 py-2 capitalize transition ${activeView === v ? "bg-brand text-white shadow-sm" : "text-zinc-500 hover:text-foreground"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Profile */}
      <form onSubmit={handleSave} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-foreground">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-zinc-400">{displayName.charAt(0) || "?"}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow">
              {uploading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-3 w-3" />}
            </span>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
          <div className="text-xs text-zinc-400">Click the camera to upload a profile photo</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Full name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Business / agency name</label>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Shown on your listings"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Email (not editable)</label>
            <input value={user?.email ?? ""} disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Your office or home address"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {saved && <span className="text-xs font-semibold text-green-600">Saved!</span>}
        </div>
      </form>

      {/* Tour bookings (landlord) */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><CalendarDays className="h-4 w-4 text-brand" /> Property tour bookings</h2>
        <p className="mt-1 text-xs text-zinc-400">How prospective tenants book a viewing of your listings.</p>

        <div className="mt-3 space-y-2">
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
                <input
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  placeholder="https://calendly.com/your-name"
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
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

        {bookingMsg && <p className={`mt-2 text-xs ${bookingMsg.ok ? "text-green-600" : "text-red-600"}`}>{bookingMsg.text}</p>}

        <button onClick={handleSaveBooking} disabled={bookingSaving} className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {bookingSaving ? "Saving…" : "Save booking settings"}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Account</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-zinc-400">Account type</p>
            <p className="mt-0.5 text-sm capitalize text-foreground">{profile?.role ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400">Member since</p>
            <p className="mt-0.5 text-sm text-foreground">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
