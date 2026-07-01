import { getFirestoreCollection } from "@/lib/firestoreData";
import { queryFirestoreCollection, setFirestoreDoc, type WriteResult } from "@/lib/firestoreWrite";

export type ListingStatus = "active" | "rented" | "archived";

export interface ApartmentListing {
  id: string;
  citySlug: string;
  title: string;
  type: "Apartment" | "House" | "Duplex" | "Land" | "Self-Contain" | "Shop/Office";
  purpose: "Rent" | "Sale";
  bedrooms: number;
  bathrooms: number;
  priceNaira: number;
  pricePeriod?: "year" | "month" | "one-time";
  area: string;
  description: string;
  amenities: string[];
  /** Firestore auth uid of the landlord/agent who created this listing. Absent on bundled sample listings. */
  ownerId?: string;
  ownerName?: string;
  businessName?: string;
  ownerContact?: string;
  createdAt?: string;

  // Property/building hierarchy
  propertyId?: string;       // parent Property building this unit belongs to
  propertyName?: string;     // denormalised for display

  // Listing lifecycle
  status?: ListingStatus;    // default "active"; "rented" hides from public; "archived" = delisted

  // Media
  images?: string[];         // Firebase Storage URLs
  youtubeUrl?: string;       // YouTube URL — embedded as iframe on the detail view

  // Address (full address private; only area/city shown publicly)
  fullAddress?: string;      // stored privately, revealed after confirmed payment
  stateName?: string;

  // Nigerian rental fee structure (first-year only — subsequent years pay rent only)
  cautionFee?: number;       // refundable security deposit (usually 1-3 months rent)
  agencyFee?: number;        // non-refundable agent commission
  agreementFee?: number;     // legal documentation fee
  legalFee?: number;         // lawyer/notary fee
}

/**
 * Sample placeholder listings to demonstrate the Apartments section.
 * Real landlord/agent-submitted listings live in Firestore (see getApartmentsLive below)
 * and are merged in on top of these samples wherever they exist.
 */
export const apartments: ApartmentListing[] = [
  { id: "lag-001", citySlug: "lagos-lagos", title: "3 Bedroom Flat in Lekki Phase 1", type: "Apartment", purpose: "Rent", bedrooms: 3, bathrooms: 3, priceNaira: 4500000, pricePeriod: "year", area: "Lekki Phase 1", description: "Serviced 3-bedroom apartment with backup power, water treatment, and 24/7 security in a gated estate.", amenities: ["24/7 Security", "Backup Generator", "Water Treatment Plant", "Parking"] },
  { id: "lag-002", citySlug: "lagos-lagos", title: "Mini Flat (Self-Contain) in Yaba", type: "Self-Contain", purpose: "Rent", bedrooms: 1, bathrooms: 1, priceNaira: 900000, pricePeriod: "year", area: "Yaba", description: "Compact self-contained apartment close to UNILAG, ideal for students and young professionals.", amenities: ["Prepaid Meter", "Tiled Floors", "Close to Bus Stop"] },
  { id: "lag-003", citySlug: "lagos-lagos", title: "4 Bedroom Duplex for Sale in Ajah", type: "Duplex", purpose: "Sale", bedrooms: 4, bathrooms: 5, priceNaira: 95000000, pricePeriod: "one-time", area: "Ajah", description: "Newly built detached duplex with a private compound and en-suite rooms.", amenities: ["BQ", "Fitted Kitchen", "Gated Compound"] },
  { id: "abj-001", citySlug: "abuja-fct", title: "2 Bedroom Apartment in Jabi", type: "Apartment", purpose: "Rent", bedrooms: 2, bathrooms: 2, priceNaira: 3200000, pricePeriod: "year", area: "Jabi", description: "Modern apartment in a serviced estate close to Jabi Lake Mall.", amenities: ["Estate Security", "Elevator", "Swimming Pool Access"] },
  { id: "abj-002", citySlug: "abuja-fct", title: "5 Bedroom Detached House in Asokoro", type: "House", purpose: "Sale", bedrooms: 5, bathrooms: 6, priceNaira: 320000000, pricePeriod: "one-time", area: "Asokoro", description: "Luxury detached house in a prime diplomatic district.", amenities: ["Swimming Pool", "Staff Quarters", "Large Compound"] },
  { id: "phc-001", citySlug: "port-harcourt-rivers", title: "3 Bedroom Flat in GRA Phase 2", type: "Apartment", purpose: "Rent", bedrooms: 3, bathrooms: 3, priceNaira: 2800000, pricePeriod: "year", area: "GRA Phase 2", description: "Well-finished apartment in a quiet residential area.", amenities: ["Backup Generator", "Borehole", "Parking"] },
  { id: "iba-001", citySlug: "ibadan-oyo", title: "2 Bedroom Bungalow in Bodija", type: "House", purpose: "Rent", bedrooms: 2, bathrooms: 2, priceNaira: 1100000, pricePeriod: "year", area: "Bodija", description: "Affordable family bungalow in a long-established residential neighbourhood.", amenities: ["Borehole", "Fenced Compound"] },
  { id: "ben-001", citySlug: "benin-city-edo", title: "Land for Sale in GRA", type: "Land", purpose: "Sale", bedrooms: 0, bathrooms: 0, priceNaira: 18000000, pricePeriod: "one-time", area: "GRA", description: "Dry, fenced residential plot with C of O, ready for development.", amenities: ["C of O", "Fenced", "Dry Land"] },
  { id: "kan-001", citySlug: "kano-kano", title: "Shop/Office Space in Sabon Gari", type: "Shop/Office", purpose: "Rent", bedrooms: 0, bathrooms: 1, priceNaira: 1500000, pricePeriod: "year", area: "Sabon Gari", description: "Ground floor commercial space on a busy commercial street.", amenities: ["High Foot Traffic", "Roller Shutters"] },
  { id: "cal-001", citySlug: "calabar-cross-river", title: "3 Bedroom Flat in State Housing", type: "Apartment", purpose: "Rent", bedrooms: 3, bathrooms: 3, priceNaira: 1400000, pricePeriod: "year", area: "State Housing", description: "Family apartment in one of Calabar's cleanest residential layouts.", amenities: ["Tarred Roads", "Drainage System"] },
];

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

/**
 * All apartments, live from Firestore (real landlord-submitted listings + seeded
 * samples), with the bundled samples as a fallback if Firestore is unreachable.
 * Relies on getFirestoreCollection's own 5-minute TTL cache rather than caching
 * again here - an unbounded local cache would mean newly-created listings never
 * show up for the lifetime of the server process.
 */
export async function getApartmentsLive(): Promise<ApartmentListing[]> {
  const remote = await getFirestoreCollection<ApartmentListing>("apartments");
  return remote && remote.length > 0 ? remote : apartments;
}

export async function getApartmentsByCityLive(citySlug: string): Promise<ApartmentListing[]> {
  const all = await getApartmentsLive();
  return all.filter((a) => a.citySlug === citySlug);
}

export async function getSaleListingsByCityLive(citySlug: string): Promise<ApartmentListing[]> {
  const all = await getApartmentsLive();
  return all.filter((a) => a.citySlug === citySlug && a.purpose === "Sale");
}

/** A landlord's own listings, queried fresh (not the 5-min-cached public catalog) so a
 * just-created listing shows up immediately on their own dashboard. */
export async function getApartmentsByOwnerLive(ownerId: string): Promise<ApartmentListing[]> {
  const result = await queryFirestoreCollection<ApartmentListing>("apartments", [["ownerId", ownerId]]);
  return result ?? [];
}

export async function getApartmentsByPropertyLive(propertyId: string): Promise<ApartmentListing[]> {
  const result = await queryFirestoreCollection<ApartmentListing>("apartments", [["propertyId", propertyId]]);
  return result ?? [];
}

/** Change status: active (public), rented (hidden from public), archived (delisted) */
export async function setListingStatus(id: string, status: ListingStatus): Promise<WriteResult> {
  return setFirestoreDoc("apartments", id, { status });
}

/** Assign a standalone unit to a parent Property building */
export async function assignUnitToProperty(
  unitId: string,
  propertyId: string,
  propertyName: string
): Promise<WriteResult> {
  return setFirestoreDoc("apartments", unitId, { propertyId, propertyName });
}

/** Remove a unit from its parent property (make standalone again) */
export async function removeUnitFromProperty(unitId: string): Promise<WriteResult> {
  return setFirestoreDoc("apartments", unitId, { propertyId: null, propertyName: null });
}

/** Public-facing query — only returns active listings (hides rented/archived) */
export async function getApartmentsPublicLive(): Promise<ApartmentListing[]> {
  const all = await getApartmentsLive();
  return all.filter((a) => !a.status || a.status === "active");
}
