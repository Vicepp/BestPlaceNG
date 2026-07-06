/**
 * Property tour bookings. A prospective tenant books a viewing slot for an
 * apartment; a slot that's already booked is blocked for everyone else.
 *
 * Landlords choose (in Settings) whether tours use this INTERNAL calendar or an
 * EXTERNAL link (Calendly etc.) — see bookingMode/bookingLink on the profile
 * and isAllowedBookingLink() below.
 */
import { addFirestoreDoc, setFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";

export type TourStatus = "booked" | "cancelled";

export interface TourBooking {
  id: string;
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  /** yyyy-mm-dd */
  date: string;
  /** 24h "HH:mm" */
  time: string;
  status: TourStatus;
  createdAt: string;
}

export interface TourAvailability {
  /** 0=Sun … 6=Sat */
  days: number[];
  startHour: number;
  endHour: number;
}

/** Sensible default if a landlord hasn't set availability: Mon–Sat, 9am–5pm. */
export const DEFAULT_AVAILABILITY: TourAvailability = { days: [1, 2, 3, 4, 5, 6], startHour: 9, endHour: 17 };

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Build the hourly slots ("HH:00") a landlord offers, from their availability window. */
export function slotsFromAvailability(a: TourAvailability): string[] {
  const start = Math.max(0, Math.min(23, a.startHour));
  const end = Math.max(start + 1, Math.min(24, a.endHour));
  const out: string[] = [];
  for (let h = start; h < end; h++) out.push(`${String(h).padStart(2, "0")}:00`);
  return out;
}

export function formatSlot(time: string): string {
  const [h] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

export async function getBookingsForApartment(apartmentId: string): Promise<TourBooking[]> {
  const r = await queryFirestoreCollection<TourBooking>("tourBookings", [["apartmentId", apartmentId]]);
  return (r ?? []).filter((b) => b.status === "booked");
}

export async function getToursForLandlord(landlordId: string): Promise<TourBooking[]> {
  const r = await queryFirestoreCollection<TourBooking>("tourBookings", [["landlordId", landlordId]]);
  return (r ?? []).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export async function getToursForTenant(tenantId: string): Promise<TourBooking[]> {
  const r = await queryFirestoreCollection<TourBooking>("tourBookings", [["tenantId", tenantId]]);
  return (r ?? []).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** Books a slot after a fresh check that nobody grabbed it first (best-effort
 * guard against double-booking without a server transaction). */
export async function bookTour(params: Omit<TourBooking, "id" | "status" | "createdAt">): Promise<WriteResult> {
  const existing = await getBookingsForApartment(params.apartmentId);
  const taken = existing.some((b) => b.date === params.date && b.time === params.time);
  if (taken) return { ok: false, error: "That slot was just taken — please pick another time." };
  return addFirestoreDoc("tourBookings", { ...params, status: "booked", createdAt: new Date().toISOString() });
}

export async function cancelTour(id: string): Promise<WriteResult> {
  return setFirestoreDoc("tourBookings", id, { status: "cancelled" });
}

/* ── External booking-link validation (anti-phishing) ─────────── */

/** Only well-known scheduling providers are accepted, so a landlord can't paste
 * a phishing link disguised as a booking page. */
const ALLOWED_BOOKING_HOSTS = [
  "calendly.com",
  "cal.com",
  "koalendar.com",
  "savvycal.com",
  "tidycal.com",
  "acuityscheduling.com",
  "app.acuityscheduling.com",
  "squarespacescheduling.com",
  "youcanbook.me",
  "doodle.com",
  "zcal.co",
  "calendar.google.com",
  "calendar.app.google",
  "outlook.office365.com",
  "book.morgen.so",
];

export function isAllowedBookingLink(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return ALLOWED_BOOKING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export const ALLOWED_BOOKING_PROVIDERS = "Calendly, Cal.com, Acuity, SavvyCal, TidyCal, YouCanBook.me, Doodle, Google/Outlook Calendar";
