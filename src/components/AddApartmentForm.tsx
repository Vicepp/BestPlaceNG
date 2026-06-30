"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cities } from "@/data/cities";
import type { ApartmentListing } from "@/data/apartments";
import { addFirestoreDocWithId } from "@/lib/firestoreWrite";
import { useAuth } from "@/context/AuthContext";

const TYPES: ApartmentListing["type"][] = ["Apartment", "House", "Duplex", "Land", "Self-Contain", "Shop/Office"];
const PERIODS: NonNullable<ApartmentListing["pricePeriod"]>[] = ["year", "month", "one-time"];

const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));

export default function AddApartmentForm() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [citySlug, setCitySlug] = useState(sortedCities[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ApartmentListing["type"]>("Apartment");
  const [purpose, setPurpose] = useState<ApartmentListing["purpose"]>("Rent");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [priceNaira, setPriceNaira] = useState("");
  const [pricePeriod, setPricePeriod] = useState<NonNullable<ApartmentListing["pricePeriod"]>>("year");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = Number(priceNaira);
    if (!citySlug || !title.trim() || !area.trim() || !description.trim() || !price || price <= 0) {
      setError("Please fill in all required fields with a valid price.");
      return;
    }
    if (!user) {
      setError("You need to be logged in to list a property.");
      return;
    }
    setSubmitting(true);
    const result = await addFirestoreDocWithId("apartments", {
      citySlug,
      title: title.trim(),
      type,
      purpose,
      bedrooms,
      bathrooms,
      priceNaira: price,
      pricePeriod,
      area: area.trim(),
      description: description.trim(),
      amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
      ownerId: user.uid,
      ownerName: profile?.displayName ?? user.email ?? "",
      ownerContact: user.email ?? "",
      createdAt: new Date().toISOString(),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push(`/city/${citySlug}/apartments`), 1200);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-green-700">Listing published!</p>
        <p className="mt-1 text-xs text-green-600">It may take a few minutes to appear on the city page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">City</label>
          <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            {sortedCities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}, {c.stateName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Area / Neighbourhood</label>
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lekki Phase 1" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 3 Bedroom Flat in Lekki Phase 1" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as ApartmentListing["type"])} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Purpose</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value as ApartmentListing["purpose"])} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="Rent">Rent</option>
            <option value="Sale">Sale</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Bedrooms</label>
          <input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Bathrooms</label>
          <input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Price (₦)</label>
          <input type="number" min={0} value={priceNaira} onChange={(e) => setPriceNaira(e.target.value)} placeholder="e.g. 4500000" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Price Period</label>
          <select value={pricePeriod} onChange={(e) => setPricePeriod(e.target.value as NonNullable<ApartmentListing["pricePeriod"]>)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            {PERIODS.map((p) => (
              <option key={p} value={p}>{p === "one-time" ? "One-time (sale)" : `Per ${p}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the property..." className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Amenities (comma-separated)</label>
        <input value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="e.g. 24/7 Security, Backup Generator, Parking" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
        {submitting ? "Publishing..." : "Publish Listing"}
      </button>
    </form>
  );
}
