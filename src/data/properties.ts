/**
 * A "Property" represents a physical building or estate (e.g. "Lekki Heights Block A").
 * Multiple unit listings (ApartmentListing) are tied to one Property via propertyId.
 * Landlords create the Property first, then add individual Unit listings under it.
 */
import { addFirestoreDocWithId, setFirestoreDoc, deleteFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";
import { getFirestoreDoc } from "@/lib/firestoreData";

export interface Property {
  id: string;
  ownerId: string;
  ownerName?: string;
  businessName?: string;
  /** Display name of the building/complex */
  name: string;
  description?: string;
  /** Full address — stored privately, only city + neighbourhood shown publicly */
  fullAddress?: string;
  city: string;
  area: string;
  stateSlug: string;
  stateName: string;
  citySlug: string;
  images?: string[];       // Firebase Storage URLs
  youtubeUrl?: string;     // e.g. https://youtube.com/watch?v=xxx
  totalUnits?: number;
  createdAt: string;
}

export async function createProperty(
  data: Omit<Property, "id" | "createdAt">
): Promise<WriteResult> {
  return addFirestoreDocWithId("properties", {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<WriteResult> {
  return setFirestoreDoc("properties", id, { ...data } as Record<string, unknown>);
}

export async function getPropertyById(id: string): Promise<Property | null> {
  return getFirestoreDoc<Property>("properties", id);
}

export async function getPropertiesForOwner(ownerId: string): Promise<Property[]> {
  const result = await queryFirestoreCollection<Property>("properties", [["ownerId", ownerId]]);
  return result ?? [];
}

/** Duplicate a building (fresh copy — no units attached). */
export async function duplicateProperty(p: Property): Promise<WriteResult> {
  return addFirestoreDocWithId("properties", {
    ...p,
    name: `${p.name} (copy)`,
    totalUnits: 0,
    createdAt: new Date().toISOString(),
  } as unknown as Record<string, unknown>);
}

/** Delete a building — callers must first ensure it has no rented units. */
export async function deleteProperty(id: string): Promise<WriteResult> {
  return deleteFirestoreDoc("properties", id);
}

/** Transfer a building's ownership to another landlord. The building's units are
 * transferred separately by the caller (each unit is its own doc). */
export async function transferProperty(
  id: string,
  newOwner: { uid: string; name?: string; businessName?: string }
): Promise<WriteResult> {
  return setFirestoreDoc("properties", id, {
    ownerId: newOwner.uid,
    ownerName: newOwner.name ?? null,
    businessName: newOwner.businessName ?? null,
  });
}

/** All public properties — for the /apartments listing page */
export async function getAllPropertiesLive(): Promise<Property[]> {
  const { getFirestoreCollection } = await import("@/lib/firestoreData");
  const r = await getFirestoreCollection<Property>("properties");
  return r ?? [];
}

/** Extract YouTube video ID from any YouTube URL format */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}
