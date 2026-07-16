import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  increment,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

/** One recorded view of a unit — anonymous or signed in. Event-level records
 * so every dashboard metric can be filtered by any date range. */
export interface ViewEvent {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  ownerId: string;
  viewerId?: string;
  viewerName?: string;
  at: string;
}

/** A signed-in visitor who opened one of the landlord's units — a contactable lead,
 * deduplicated per (unit, viewer) with a running view count. */
export interface ListingLead {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  ownerId: string;
  viewerId: string;
  viewerName: string;
  views: number;
  lastViewedAt: string;
}

/** Records one unit view. Returns true only if the write actually landed, so
 * callers can retry later (e.g. before security rules are published). */
export async function recordUnitView(
  apartment: { id: string; title: string; ownerId?: string },
  viewer: { uid: string; name: string } | null
): Promise<boolean> {
  if (!isFirebaseConfigured() || !apartment.ownerId) return false; // sample listings have no owner
  if (viewer && viewer.uid === apartment.ownerId) return false; // owners don't count themselves
  const now = new Date().toISOString();
  try {
    await addDoc(collection(getDb(), "listingViewEvents"), {
      apartmentId: apartment.id,
      apartmentTitle: apartment.title,
      ownerId: apartment.ownerId,
      ...(viewer ? { viewerId: viewer.uid, viewerName: viewer.name || "BestPlaceNG user" } : {}),
      at: now,
    });
    if (viewer) {
      await setDoc(
        doc(getDb(), "listingLeads", `${apartment.id}_${viewer.uid}`),
        {
          apartmentId: apartment.id,
          apartmentTitle: apartment.title,
          ownerId: apartment.ownerId,
          viewerId: viewer.uid,
          viewerName: viewer.name || "BestPlaceNG user",
          views: increment(1),
          lastViewedAt: now,
        },
        { merge: true }
      );
    }
    return true;
  } catch {
    return false; // rules not published yet, or offline — never break the page
  }
}

/** Every recorded view of the landlord's units, newest first. */
export async function getViewEventsForOwner(ownerId: string): Promise<ViewEvent[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(query(collection(getDb(), "listingViewEvents"), where("ownerId", "==", ownerId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ViewEvent, "id">) }))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  } catch {
    return [];
  }
}

/** Every signed-in viewer of the landlord's units, newest activity first. */
export async function getLeadsForOwner(ownerId: string): Promise<ListingLead[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(query(collection(getDb(), "listingLeads"), where("ownerId", "==", ownerId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ListingLead, "id">) }))
      .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime());
  } catch {
    return [];
  }
}
