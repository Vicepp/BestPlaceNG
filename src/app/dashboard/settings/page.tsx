"use client";

import { useEffect, useState } from "react";
import { useAuth, type DashboardView } from "@/context/AuthContext";
import { setFirestoreDoc } from "@/lib/firestoreWrite";
import { uploadFile } from "@/lib/storage";
import { Camera, Save } from "lucide-react";

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

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setBusinessName(profile.businessName ?? "");
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile]);

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
