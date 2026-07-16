"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { recordUnitView } from "@/data/listingViews";

/** Invisible: records one view per browser session when a unit's detail view
 * opens. Logged-in visitors become leads the landlord can message; anonymous
 * visits still count toward the unit's view total. */
export default function ViewTracker({ apartmentId, apartmentTitle, ownerId }: {
  apartmentId: string; apartmentTitle: string; ownerId?: string;
}) {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading || !ownerId) return; // wait until we know who's viewing; skip sample listings
    const key = `bpng:viewed:${apartmentId}`;
    if (sessionStorage.getItem(key)) return;
    recordUnitView(
      { id: apartmentId, title: apartmentTitle, ownerId },
      user ? { uid: user.uid, name: profile?.displayName ?? user.displayName ?? "" } : null
    ).then((ok) => {
      // Only mark the session when the write landed, so a temporarily failed
      // write (e.g. rules not yet published) retries on the next open.
      if (ok) sessionStorage.setItem(key, "1");
    });
  }, [loading, user, profile, apartmentId, apartmentTitle, ownerId]);

  return null;
}
