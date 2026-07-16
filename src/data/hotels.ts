import { addFirestoreDoc, setFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";
import { getFirestoreDoc } from "@/lib/firestoreData";

/** Property-level amenities shown as "What this place offers". */
export const HOTEL_AMENITIES = [
  "24/7 Electricity", "Solar Power", "Inverter", "High-Speed Internet", "Water Tank", "Borehole Water",
  "24/7 Security Guard", "Gated Compound", "CCTV", "Parking", "Swimming Pool", "Gym",
  "Restaurant", "Breakfast", "Housekeeping", "Laundry Area", "Elevator", "Shared Kitchen", "Shared Living Room",
] as const;

/** Room/unit-level amenities. */
export const UNIT_AMENITIES = [
  "Air Conditioning", "Fan", "Private Bathroom (Ensuite)", "Hot Water", "Smart TV", "Netflix",
  "WiFi", "Wardrobe", "Workspace/Desk", "Refrigerator", "Microwave", "Kitchenette",
  "Cooker (Gas/Electric)", "Cookware", "Dinnerware", "Balcony", "Secure Door", "King Bed", "Double Bed", "Single Bed",
] as const;

export interface Hotel {
  id: string;
  ownerId: string;
  ownerName?: string;
  name: string;
  kind: "hotel" | "shortlet";
  description: string;
  citySlug: string;
  cityName: string;
  stateName?: string;
  area: string;
  /** Shown publicly on the hotel page and pinned on the map. */
  fullAddress?: string;
  youtubeUrl?: string;
  images: string[];
  amenities: string[];
  floors: number;
  checkInTime: string;   // e.g. "14:00"
  checkOutTime: string;  // e.g. "11:00"
  defaultPricePerNight: number;
  status: "active" | "archived";
  createdAt: string;
}

export interface HotelUnit {
  id: string;
  hotelId: string;
  ownerId: string;
  name: string;          // e.g. "Room 204"
  floor: number;         // 0 = ground
  description: string;
  images: string[];
  amenities: string[];
  pricePerNight: number;
  capacity: number;      // max guests
  bedType: string;       // "King" | "Double" | "Twin" | "Single" | free text
  youtubeUrl?: string;
  status: "active" | "hidden";
  createdAt: string;
}

export type BookingStatus = "pending_payment" | "approved" | "completed" | "cancelled" | "expired";

export interface HotelBooking {
  id: string;
  hotelId: string;
  hotelName: string;
  unitId: string;
  unitName: string;
  ownerId: string;
  guestId: string;
  guestName: string;
  checkIn: string;   // "YYYY-MM-DD"
  checkOut: string;  // "YYYY-MM-DD" (exclusive)
  /** Arrival/departure clock times ("HH:MM") — bookings on the same day chain
   * with a 1-hour turnaround buffer between checkout and the next check-in. */
  checkInTime?: string;
  checkOutTime?: string;
  nights: number;
  amount: number;    // naira, total for the stay
  status: BookingStatus;
  /** While status is pending_payment, the unit is held until this instant. */
  lockedUntil?: string;
  paidAt?: string;
  createdAt: string;
}

/** How long a picked room is held while the guest pays. */
export const BOOKING_LOCK_MINUTES = 10;

/** Turnaround buffer between one guest's checkout and the next check-in. */
export const TURNAROUND_BUFFER_MS = 60 * 60 * 1000; // 1 hour

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}

export function bookingStart(b: Pick<HotelBooking, "checkIn" | "checkInTime">): Date {
  return new Date(`${b.checkIn}T${b.checkInTime || "14:00"}:00`);
}

export function bookingEnd(b: Pick<HotelBooking, "checkOut" | "checkOutTime">): Date {
  return new Date(`${b.checkOut}T${b.checkOutTime || "11:00"}:00`);
}

/** True when [start, end) collides with the booking, respecting the 1-hour buffer on both sides. */
function overlapsWithBuffer(b: HotelBooking, start: Date, end: Date): boolean {
  return bookingEnd(b).getTime() + TURNAROUND_BUFFER_MS > start.getTime()
    && end.getTime() + TURNAROUND_BUFFER_MS > bookingStart(b).getTime();
}

/** A booking blocks its unit if it's paid/approved, or still inside its payment lock. */
export function bookingBlocks(b: HotelBooking, at: Date = new Date()): boolean {
  if (b.status === "approved" || b.status === "completed") return true;
  if (b.status === "pending_payment") return !!b.lockedUntil && new Date(b.lockedUntil) > at;
  return false;
}

/** Units unavailable for a stay window (dates + clock times), given the hotel's bookings. */
export function blockedUnitIds(
  bookings: HotelBooking[], checkIn: string, checkOut: string, checkInTime = "14:00", checkOutTime = "11:00"
): Set<string> {
  const now = new Date();
  const start = new Date(`${checkIn}T${checkInTime}:00`);
  const end = new Date(`${checkOut}T${checkOutTime}:00`);
  const out = new Set<string>();
  for (const b of bookings) {
    if (bookingBlocks(b, now) && overlapsWithBuffer(b, start, end)) out.add(b.unitId);
  }
  return out;
}

/** The bookings actually blocking one unit for a stay window, soonest first. */
export function conflictsForUnit(
  bookings: HotelBooking[], unitId: string, checkIn: string, checkOut: string, checkInTime = "14:00", checkOutTime = "11:00"
): HotelBooking[] {
  const now = new Date();
  const start = new Date(`${checkIn}T${checkInTime}:00`);
  const end = new Date(`${checkOut}T${checkOutTime}:00`);
  return bookings
    .filter((b) => b.unitId === unitId && bookingBlocks(b, now) && overlapsWithBuffer(b, start, end))
    .sort((a, b) => bookingStart(a).getTime() - bookingStart(b).getTime());
}

/** Units with a guest in them at this instant (paid bookings whose window covers `at`). */
export function currentlyOccupiedUnitIds(bookings: HotelBooking[], at: Date = new Date()): Set<string> {
  const out = new Set<string>();
  for (const b of bookings) {
    if ((b.status === "approved" || b.status === "completed")
      && bookingStart(b) <= at && at < new Date(bookingEnd(b).getTime() + TURNAROUND_BUFFER_MS)) {
      out.add(b.unitId);
    }
  }
  return out;
}

/** Earliest instant this unit can host a stay of the same length, starting from the
 * desired check-in: walks past each conflicting booking + the 1-hour buffer. */
export function nextAvailableStart(bookings: HotelBooking[], unitId: string, desiredStart: Date, stayMs: number): Date {
  const now = new Date();
  const blocks = bookings
    .filter((b) => b.unitId === unitId && bookingBlocks(b, now))
    .sort((a, b) => bookingStart(a).getTime() - bookingStart(b).getTime());
  let candidate = new Date(desiredStart);
  for (let i = 0; i < 25; i++) {
    const end = new Date(candidate.getTime() + stayMs);
    const clash = blocks.find((b) => overlapsWithBuffer(b, candidate, end));
    if (!clash) return candidate;
    candidate = new Date(bookingEnd(clash).getTime() + TURNAROUND_BUFFER_MS);
  }
  return candidate;
}

/* ── CRUD ── */

export async function createHotel(data: Omit<Hotel, "id" | "status" | "createdAt">): Promise<WriteResult> {
  return addFirestoreDoc("hotels", { ...data, status: "active", createdAt: new Date().toISOString() });
}

export async function updateHotel(id: string, data: Partial<Hotel>): Promise<WriteResult> {
  return setFirestoreDoc("hotels", id, data);
}

export async function createUnit(data: Omit<HotelUnit, "id" | "createdAt">): Promise<WriteResult> {
  return addFirestoreDoc("hotelUnits", { ...data, createdAt: new Date().toISOString() });
}

export async function updateUnit(id: string, data: Partial<HotelUnit>): Promise<WriteResult> {
  return setFirestoreDoc("hotelUnits", id, data);
}

/** Copies one unit's setup (not photos or name) onto every other unit of the hotel. */
export async function applyUnitSetupToAll(source: HotelUnit, units: HotelUnit[]): Promise<void> {
  await Promise.all(
    units
      .filter((u) => u.id !== source.id)
      .map((u) =>
        updateUnit(u.id, {
          description: source.description,
          amenities: source.amenities,
          pricePerNight: source.pricePerNight,
          capacity: source.capacity,
          bedType: source.bedType,
        })
      )
  );
}

export async function getHotelsPublic(): Promise<Hotel[]> {
  const r = await queryFirestoreCollection<Hotel>("hotels", [["status", "active"]]);
  return r ?? [];
}

export async function getHotelsForOwner(ownerId: string): Promise<Hotel[]> {
  const r = await queryFirestoreCollection<Hotel>("hotels", [["ownerId", ownerId]]);
  return r ?? [];
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  return getFirestoreDoc<Hotel>("hotels", id);
}

export async function getUnitsForHotel(hotelId: string): Promise<HotelUnit[]> {
  const r = await queryFirestoreCollection<HotelUnit>("hotelUnits", [["hotelId", hotelId]]);
  return (r ?? []).sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export async function getBookingsForHotel(hotelId: string): Promise<HotelBooking[]> {
  const r = await queryFirestoreCollection<HotelBooking>("hotelBookings", [["hotelId", hotelId]]);
  return r ?? [];
}

export async function getBookingsForGuest(guestId: string): Promise<HotelBooking[]> {
  const r = await queryFirestoreCollection<HotelBooking>("hotelBookings", [["guestId", guestId]]);
  return (r ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBookingsForOwner(ownerId: string): Promise<HotelBooking[]> {
  const r = await queryFirestoreCollection<HotelBooking>("hotelBookings", [["ownerId", ownerId]]);
  return (r ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Creates a pending booking that locks the unit for BOOKING_LOCK_MINUTES. */
export async function createPendingBooking(
  data: Omit<HotelBooking, "id" | "status" | "lockedUntil" | "createdAt">
): Promise<WriteResult> {
  return addFirestoreDoc("hotelBookings", {
    ...data,
    status: "pending_payment",
    lockedUntil: new Date(Date.now() + BOOKING_LOCK_MINUTES * 60000).toISOString(),
    createdAt: new Date().toISOString(),
  });
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<WriteResult> {
  return setFirestoreDoc("hotelBookings", id, { status });
}

/* ── Anonymous view tracking: counts only, deliberately NO viewer identity ── */

export interface HotelViewEvent {
  id: string;
  hotelId: string;
  ownerId: string;
  at: string;
}

export async function recordHotelView(hotelId: string, ownerId: string): Promise<boolean> {
  const res = await addFirestoreDoc("hotelViewEvents", { hotelId, ownerId, at: new Date().toISOString() });
  return res.ok;
}

export async function getHotelViewsForOwner(ownerId: string): Promise<HotelViewEvent[]> {
  const r = await queryFirestoreCollection<HotelViewEvent>("hotelViewEvents", [["ownerId", ownerId]]);
  return r ?? [];
}
