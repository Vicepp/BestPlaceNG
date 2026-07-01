"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createProperty } from "@/data/properties";
import { cities } from "@/data/cities";
import ImageUploader from "@/components/ImageUploader";

const sortedCities = [...cities.filter((c) => c.tier === "major")].sort((a, b) => a.name.localeCompare(b.name));

export default function CreatePropertyPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [citySlug, setCitySlug] = useState(sortedCities[0]?.slug ?? "");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const city = sortedCities.find((c) => c.slug === citySlug);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-zinc-500">You need to be logged in to create a property.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">Login</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !area.trim()) { setError("Property name and area are required."); return; }
    setSubmitting(true);
    const result = await createProperty({
      ownerId: user!.uid,
      ownerName: profile?.displayName ?? user!.email ?? "",
      businessName: profile?.businessName,
      name: name.trim(),
      description: description.trim(),
      citySlug,
      city: city?.name ?? "",
      area: area.trim(),
      fullAddress: fullAddress.trim(),
      stateSlug: city?.stateSlug ?? "",
      stateName: city?.stateName ?? "",
      images,
      youtubeUrl: youtubeUrl.trim(),
    });
    setSubmitting(false);
    if (!result.ok) { setError(result.error); return; }
    router.push(`/dashboard/properties?created=${result.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/dashboard/properties" className="mb-4 block text-xs font-semibold text-brand">← Properties</Link>
      <h1 className="text-2xl font-bold text-foreground">Create a Property</h1>
      <p className="mt-1 text-sm text-zinc-500">
        A Property is the building or estate. You'll add individual unit listings (apartments, rooms, shops) inside it.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Property / Building name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lekki Heights Estate, Block A"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">City *</label>
            <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
              {sortedCities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.stateName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Neighbourhood / Area *</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lekki Phase 1"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Full address (private — only shown after payment)</label>
          <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)}
            placeholder="e.g. 14B Palm Avenue, Lekki Phase 1, Lagos"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          <p className="mt-1 text-[10px] text-zinc-400">Neighbourhood and city are shown publicly — full address only unlocked after confirmed payment.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="Describe the building, estate facilities, security, etc."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>

        <ImageUploader
          existingUrls={images}
          onChange={setImages}
          storagePath={`properties/${user.uid}/${Date.now()}`}
          label="Property photos (required — shown on all unit listings)"
          maxImages={10}
        />

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">YouTube video link (optional)</label>
          <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          <p className="mt-1 text-[10px] text-zinc-400">Paste a YouTube link — it will embed as a playable video on the listing page.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {submitting ? "Creating..." : "Create Property"}
        </button>
      </form>
    </div>
  );
}
