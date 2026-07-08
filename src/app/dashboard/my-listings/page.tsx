"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, Pencil, Trash2, X, Plus, Camera, ExternalLink, MapPin, CirclePlay } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/storage";
import { cities } from "@/data/cities";
import {
  getListingsForOwner, updateDirectoryListing, deleteDirectoryListing,
  parseYouTubeId, CATEGORY_LABELS, type DirectoryListing,
} from "@/data/directoryListings";

/** Manage every directory listing you've added (school, church, market, hotel,
 * job…): edit details, add an optional photo + YouTube video, or delete. */
export default function MyListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DirectoryListing | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    if (!user) return;
    setListings(await getListingsForOwner(user.uid));
    setLoading(false);
  }
  useEffect(() => { load(); }, [user]); // eslint-disable-line

  async function handleDelete(l: DirectoryListing) {
    if (!confirm(`Delete "${l.name}"? It disappears from the ${CATEGORY_LABELS[l.category]} section of ${cityName(l.citySlug)} immediately. This can't be undone.`)) return;
    setDeleting(l.id);
    const res = await deleteDirectoryListing(l.id);
    setDeleting(null);
    if (res.ok) {
      setListings((prev) => prev.filter((x) => x.id !== l.id));
      setNotice(`Deleted "${l.name}".`);
    } else {
      setNotice(res.error ?? "Couldn't delete that listing.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Store className="h-6 w-6 text-brand" /> My Listings</h1>
          <p className="mt-1 text-sm text-zinc-400">Everything you&apos;ve added to city directories — schools, churches, markets, hotels, jobs and more.</p>
        </div>
        <Link href="/list-business" className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" /> Add listing
        </Link>
      </div>

      {notice && <div className="rounded-xl bg-brand-light px-4 py-3 text-sm text-brand-dark">{notice}</div>}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
          <p className="text-sm font-medium text-foreground">You haven&apos;t added any listings yet</p>
          <p className="mt-1 text-xs text-zinc-400">Add a school, church, mosque, market, hotel, hospital, event or job to a city&apos;s directory.</p>
          <Link href="/list-business" className="mt-5 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Add your first listing
          </Link>
        </div>
      ) : (
        /* GRID of listing cards */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div key={l.id} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              {l.imageUrl ? (
                <img src={l.imageUrl} alt={l.name} className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-brand-light">
                  <Store className="h-10 w-10 text-brand/40" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">{CATEGORY_LABELS[l.category]}</span>
                  {l.youtubeUrl && parseYouTubeId(l.youtubeUrl) && <CirclePlay className="h-3.5 w-3.5 text-red-500" />}
                </div>
                <h3 className="mt-2 font-bold text-foreground line-clamp-1">{l.name}</h3>
                {l.subtitle && <p className="text-xs text-zinc-500 line-clamp-1">{l.subtitle}</p>}
                <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400"><MapPin className="h-3 w-3" /> {cityName(l.citySlug)}</p>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <button onClick={() => setEditing(l)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <Link href={`/directory/${l.id}`} target="_blank"
                    className="flex items-center justify-center rounded-full border border-zinc-200 p-2 text-zinc-500 hover:border-brand hover:text-brand" aria-label="View public page">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={() => handleDelete(l)} disabled={deleting === l.id}
                    className="flex items-center justify-center rounded-full border border-zinc-200 p-2 text-zinc-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50" aria-label="Delete listing">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditListingModal
          listing={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setListings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setEditing(null);
            setNotice(`Saved "${updated.name}".`);
          }}
        />
      )}
    </div>
  );
}

function cityName(slug: string): string {
  const c = cities.find((x) => x.slug === slug);
  return c ? `${c.name}, ${c.stateName}` : slug;
}

/* ── Edit modal: details + optional photo upload + optional YouTube video ── */
function EditListingModal({
  listing, onClose, onSaved,
}: { listing: DirectoryListing; onClose: () => void; onSaved: (l: DirectoryListing) => void }) {
  const [name, setName] = useState(listing.name);
  const [subtitle, setSubtitle] = useState(listing.subtitle ?? "");
  const [description, setDescription] = useState(listing.description);
  const [address, setAddress] = useState(listing.address ?? "");
  const [meta, setMeta] = useState(listing.meta ?? "");
  const [phone, setPhone] = useState(listing.phone ?? "");
  const [imageUrl, setImageUrl] = useState(listing.imageUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(listing.youtubeUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadFile(file, `listings/${listing.id}`);
    setUploading(false);
    if (res.ok) setImageUrl(res.url);
    else setError(res.error);
  }

  async function save() {
    setError("");
    if (!name.trim() || !description.trim()) { setError("Name and description are required."); return; }
    const yt = youtubeUrl.trim();
    if (yt && !parseYouTubeId(yt)) {
      setError("That video link isn't a valid YouTube URL — only youtube.com / youtu.be links are accepted.");
      return;
    }
    setSaving(true);
    const patch = {
      name: name.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      address: address.trim() || undefined,
      meta: meta.trim() || undefined,
      phone: phone.trim() || undefined,
      imageUrl: imageUrl || undefined,
      youtubeUrl: yt || undefined,
    };
    const res = await updateDirectoryListing(listing.id, patch);
    setSaving(false);
    if (!res.ok) { setError(res.error ?? "Couldn't save. Try again."); return; }
    onSaved({ ...listing, ...patch });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit listing</h2>
            <p className="text-xs text-zinc-400">{CATEGORY_LABELS[listing.category]} · {cityName(listing.citySlug)}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Photo (optional) */}
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Photo (optional)</label>
        <label className="relative block cursor-pointer overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50 hover:border-brand">
          {imageUrl ? (
            <img src={imageUrl} alt="listing" className="h-40 w-full object-cover" />
          ) : (
            <div className="flex h-28 flex-col items-center justify-center text-zinc-400">
              <Camera className="mb-1 h-6 w-6" />
              <span className="text-xs">Click to upload a photo</span>
            </div>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">Uploading…</span>
          )}
          <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </label>
        {imageUrl && (
          <button onClick={() => setImageUrl("")} className="mt-1 text-xs font-semibold text-red-500 hover:underline">Remove photo</button>
        )}

        {/* YouTube (optional) */}
        <label className="mb-1 mt-4 block text-xs font-semibold text-zinc-500">YouTube video link (optional)</label>
        <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        <p className="mt-1 text-[11px] text-zinc-400">Only YouTube links are accepted, to keep visitors safe from bad links.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Anglican, Primary school…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Extra info (hours, price, services…)</label>
            <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="e.g. Sun 8am & 10am · Open daily 9-9"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <button onClick={save} disabled={saving || uploading}
          className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
