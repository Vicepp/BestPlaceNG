"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { cities } from "@/data/cities";
import { parseYouTubeId, type ListingCategory } from "@/data/directoryListings";
import { addFirestoreDocWithId } from "@/lib/firestoreWrite";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: "job", label: "Job" },
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "hotel", label: "Hotel" },
  { value: "event", label: "Event" },
  { value: "market", label: "Market" },
  { value: "shopping-mall", label: "Shopping Mall" },
  { value: "police-station", label: "Police Station" },
  { value: "church", label: "Church" },
  { value: "mosque", label: "Mosque" },
];

const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));

export default function AddBusinessForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [citySlug, setCitySlug] = useState(sortedCities[0]?.slug ?? "");
  const [category, setCategory] = useState<ListingCategory>("job");
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [address, setAddress] = useState("");
  const [meta, setMeta] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadFile(file, "listings");
    setUploading(false);
    if (res.ok) setImageUrl(res.url);
    else setError(res.error);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!citySlug || !name.trim() || !description.trim()) {
      setError("Please fill in at least the city, name, and description.");
      return;
    }
    if (!user) {
      setError("You need to be logged in to add a listing.");
      return;
    }
    const yt = youtubeUrl.trim();
    if (yt && !parseYouTubeId(yt)) {
      setError("That video link isn't a valid YouTube URL — only youtube.com / youtu.be links are accepted.");
      return;
    }
    setSubmitting(true);
    const result = await addFirestoreDocWithId("directoryListings", {
      citySlug,
      category,
      name: name.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      address: address.trim() || undefined,
      meta: meta.trim() || undefined,
      phone: phone.trim() || undefined,
      imageUrl: imageUrl || undefined,
      youtubeUrl: yt || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push(`/city/${citySlug}`), 1200);
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
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as ListingCategory)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Greensprings School" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Subtitle (optional)</label>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Private · Day & Boarding" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Address (optional)</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Anthony Village, Lagos" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Meta (optional, e.g. hours, price)</label>
          <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="e.g. Open daily · 8am - 10pm" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803 123 4567" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the listing..." className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Tags (comma-separated, optional)</label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. Remote-friendly, Entry-level" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Photo (optional)</label>
        <label className="relative block cursor-pointer overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50 hover:border-brand">
          {imageUrl ? (
            <img src={imageUrl} alt="listing" className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-24 flex-col items-center justify-center text-zinc-400">
              <Camera className="mb-1 h-5 w-5" />
              <span className="text-xs">Click to upload a photo</span>
            </div>
          )}
          {uploading && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">Uploading…</span>}
          <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </label>
        {imageUrl && <button type="button" onClick={() => setImageUrl("")} className="mt-1 text-xs font-semibold text-red-500 hover:underline">Remove photo</button>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">YouTube video link (optional)</label>
        <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        <p className="mt-1 text-[11px] text-zinc-400">Only YouTube links are accepted, to keep visitors safe from bad links.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting || uploading} className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
        {submitting ? "Publishing..." : "Publish Listing"}
      </button>
    </form>
  );
}
