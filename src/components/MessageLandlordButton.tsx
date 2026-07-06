"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFirestoreDoc } from "@/lib/firestoreData";
import { getOrCreateDirectConversation } from "@/data/conversations";
import type { ApartmentListing } from "@/data/apartments";

export default function MessageLandlordButton({ listing }: { listing: ApartmentListing }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!listing.ownerId) return null;

  if (!user) {
    return (
      <Link href="/login" className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand">
        <MessageCircle className="h-3.5 w-3.5" /> Log in to message
      </Link>
    );
  }

  if (user.uid === listing.ownerId) return null;

  async function handleClick() {
    setLoading(true);
    const landlordProfile = await getFirestoreDoc<{ displayName?: string }>("users", listing.ownerId!);
    const conversationId = await getOrCreateDirectConversation(
      user!.uid,
      profile?.displayName ?? user!.email ?? "User",
      listing.ownerId!,
      listing.ownerName ?? landlordProfile?.displayName ?? "Landlord",
      { id: listing.id, title: listing.title }
    );
    setLoading(false);
    router.push(`/dashboard/messages?c=${conversationId}`);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-brand hover:text-brand disabled:opacity-60"
    >
      <MessageCircle className="h-3.5 w-3.5" /> {loading ? "Opening..." : "Message Landlord"}
    </button>
  );
}
