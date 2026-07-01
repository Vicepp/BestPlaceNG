"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPropertyById, updateProperty } from "@/data/properties";
import { cities } from "@/data/cities";
import ImageUploader from "@/components/ImageUploader";

const sortedCities = [...cities.filter((c) => c.tier === "major")].sort((a, b) => a.name.localeCompare(b.name));

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [citySlug, setCitySlug] = useState(sortedCities[0]?.slug ?? "");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    getPropertyById(id).then((p) => {
      if (!p || p.ownerId !== user.uid) { setNotFound(true); return; }
      setName(p.name);
      setDescription(p.description ?? "");
      setCitySlug(p.citySlug);
      setArea(p.area);
      setFullAddress(p.fullAddress ?? "");
      setYoutubeUrl(p.youtubeUrl ?? "");
      setImages(p.images ?? []);
      setLoaded(true);
    });
  }, [user, id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-zinc-500">Building not found or you don&apos;t have access.</p>
        <Link href="/dashboard/properties" className="mt-4 inline-block text-sm font-semibold text-brand">← Back to Properties</Link>
      </div>
    );
  }

  if (!loaded) return <p className="mx-auto max-w-2xl px-4 py-10 text-sm text-zinc-400">Loading…</p>;

  const city = sortedCities.find((c) => c.slug === citySlug);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !area.trim()) { setError("Building name and area are required."); return; }
    setSubmitting(true);
    setError("");
    const result = await updateProperty(id, {
      name: name.trim(),
      description: description.trim(),
      citySlug,
      city: city?.name ?? "",
      stateSlug: city?.stateSlug ?? "",
      stateName: city?.stateName ?? "",
      area: area.trim(),
      fullAddress: fullAddress.trim(),
      youtubeUrl: youtubeUrl.trim(),
      images,
    });
    setSubmitting(false);
    if (!result.ok) { setError(result.error); return; }
    setSuccess(true);
    setTimeout(() => router.push(`/dashboard/buildings/${id}`), 1000);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-semibold text-green-700">Building updated!</p>
        <p className="mt-1 text-xs text-zinc-400">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href={`/dashboard/buildings/${id}`} className="mb-4 block text-xs font-semibold text-brand">← Back to Building</Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Edit Building</h1>
          <p className="text-sm text-zinc-500">Update details, photos and video for this property.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Building / Estate name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">City</label>
            <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
              {sortedCities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.stateName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Neighbourhood / Area *</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Full address (private — only shown after payment)</label>
          <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)}
            placeholder="e.g. 14B Palm Avenue, Lekki Phase 1, Lagos"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="Describe the building, facilities, security, etc."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>

        <ImageUploader
          existingUrls={images}
          onChange={setImages}
          storagePath={`properties/${user!.uid}/${id}`}
          label="Building photos (up to 10)"
          maxImages={10}
        />

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">YouTube video link (optional)</label>
          <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          <p className="mt-1 text-[10px] text-zinc-400">Paste a YouTube link — plays directly on the listing page.</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
            <p className="font-semibold">Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
