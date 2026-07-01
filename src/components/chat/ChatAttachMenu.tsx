"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Home, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApartmentsByOwnerLive, formatNaira, type ApartmentListing } from "@/data/apartments";
import { sendPropertyCard, sendImage } from "@/data/conversations";

interface Props {
  conversationId: string;
  onClose: () => void;
}

export default function ChatAttachMenu({ conversationId, onClose }: Props) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"property" | "image">("property");
  const [properties, setProperties] = useState<ApartmentListing[]>([]);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getApartmentsByOwnerLive(user.uid).then(setProperties);
  }, [user]);

  const filtered = properties.filter((p) =>
    !query || p.title.toLowerCase().includes(query.toLowerCase()) || p.area.toLowerCase().includes(query.toLowerCase())
  );

  async function handleShareProperty(property: ApartmentListing) {
    if (!user) return;
    setSending(true);
    await sendPropertyCard(conversationId, user.uid, profile?.displayName ?? user.email ?? "User", {
      id: property.id,
      title: property.title,
      type: property.type,
      purpose: property.purpose,
      citySlug: property.citySlug,
      priceNaira: property.priceNaira,
      area: property.area,
    });
    setSending(false);
    onClose();
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image under 2 MB.");
      return;
    }
    setSending(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data = ev.target?.result as string;
      await sendImage(conversationId, user.uid, profile?.displayName ?? user.email ?? "User", data);
      setSending(false);
      onClose();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="border-t border-zinc-100 bg-white">
      {/* Tabs */}
      <div className="flex border-b border-zinc-100">
        <button
          onClick={() => setTab("property")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${tab === "property" ? "border-b-2 border-brand text-brand" : "text-zinc-400"}`}
        >
          <Home className="h-3.5 w-3.5" /> Share Property
        </button>
        <button
          onClick={() => setTab("image")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${tab === "image" ? "border-b-2 border-brand text-brand" : "text-zinc-400"}`}
        >
          <ImageIcon className="h-3.5 w-3.5" /> Send Image
        </button>
        <button onClick={onClose} className="px-3 text-zinc-400 hover:text-zinc-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {tab === "property" ? (
        <div className="max-h-56 overflow-y-auto">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-50">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your properties..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-zinc-400">
              {properties.length === 0 ? "You haven't listed any properties yet." : "No matches found."}
            </p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => handleShareProperty(p)}
                disabled={sending}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50 disabled:opacity-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Home className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                  <p className="truncate text-xs text-zinc-400">{p.area} · {formatNaira(p.priceNaira)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="p-4">
          <input ref={imageRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
          <button
            onClick={() => imageRef.current?.click()}
            disabled={sending}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 p-6 text-center hover:border-brand hover:bg-brand-light disabled:opacity-50"
          >
            <ImageIcon className="h-8 w-8 text-zinc-300" />
            <p className="text-sm font-semibold text-foreground">{sending ? "Sending..." : "Tap to choose an image"}</p>
            <p className="text-xs text-zinc-400">JPEG, PNG or WEBP · max 2 MB</p>
          </button>
        </div>
      )}
    </div>
  );
}
