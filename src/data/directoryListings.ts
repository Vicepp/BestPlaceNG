import { getFirestoreCollection } from "@/lib/firestoreData";
import { queryFirestoreCollection, setFirestoreDoc, deleteFirestoreDoc, type WriteResult } from "@/lib/firestoreWrite";

export type ListingCategory =
  | "job"
  | "school"
  | "hospital"
  | "pharmacy"
  | "hotel"
  | "event"
  | "market"
  | "shopping-mall"
  | "police-station"
  | "church"
  | "mosque";

export interface DirectoryListing {
  id: string;
  citySlug: string;
  category: ListingCategory;
  name: string;
  subtitle?: string;
  description: string;
  address?: string;
  meta?: string;
  /** Contact phone number (used especially for churches/mosques/schools). */
  phone?: string;
  tags?: string[];
  /** Cover photo (Cloudinary URL) — optional. */
  imageUrl?: string;
  /** YouTube video URL (validated to youtube.com/youtu.be only) — optional. */
  youtubeUrl?: string;
  /** Firestore auth uid of the business/user who added this listing. Absent on bundled sample listings. */
  ownerId?: string;
  createdAt?: string;
}

/**
 * Sample directory listings to demonstrate each category. Real user/business
 * submitted listings live in Firestore (see getDirectoryListingsLive below).
 */
export const directoryListings: DirectoryListing[] = [
  { id: "job-001", citySlug: "lagos-lagos", category: "job", name: "Frontend Engineer", subtitle: "Paystack", description: "Build and ship customer-facing payment products used by businesses across Africa.", address: "Yaba, Lagos", meta: "Full-time · ₦600,000 - ₦900,000/month", tags: ["React", "Remote-friendly"] },
  { id: "job-002", citySlug: "lagos-lagos", category: "job", name: "Sales Associate", subtitle: "Shoprite Lekki", description: "Customer-facing retail role in a busy supermarket branch.", address: "Lekki, Lagos", meta: "Full-time · ₦80,000/month", tags: ["Retail", "Entry-level"] },
  { id: "job-003", citySlug: "abuja-fct", category: "job", name: "Policy Analyst", subtitle: "NGO - Civic Watch", description: "Research and draft policy briefs on governance and public spending.", address: "Wuse 2, Abuja", meta: "Contract · ₦400,000/month", tags: ["Research", "Governance"] },

  { id: "school-001", citySlug: "lagos-lagos", category: "school", name: "Greensprings School", subtitle: "Primary & Secondary", description: "British curriculum private school with multiple Lagos campuses.", address: "Anthony Village, Lagos", meta: "Private · Day & Boarding" },
  { id: "school-002", citySlug: "lagos-lagos", category: "school", name: "University of Lagos (UNILAG)", subtitle: "University", description: "One of Nigeria's leading federal universities.", address: "Akoka, Lagos", meta: "Public · Undergraduate & Postgraduate" },
  { id: "school-003", citySlug: "abuja-fct", category: "school", name: "Nile University of Nigeria", subtitle: "University", description: "Private university offering a range of undergraduate and postgraduate programs.", address: "Jabi, Abuja", meta: "Private · Undergraduate & Postgraduate" },

  { id: "hosp-001", citySlug: "lagos-lagos", category: "hospital", name: "Lagos University Teaching Hospital (LUTH)", subtitle: "Teaching Hospital", description: "Major federal teaching hospital with a full range of specialist departments.", address: "Idi-Araba, Lagos", meta: "Public · 24/7 Emergency" },
  { id: "hosp-002", citySlug: "abuja-fct", category: "hospital", name: "National Hospital Abuja", subtitle: "Tertiary Hospital", description: "Federal tertiary hospital providing specialist and general care.", address: "Central Business District, Abuja", meta: "Public · 24/7 Emergency" },

  { id: "pharm-001", citySlug: "lagos-lagos", category: "pharmacy", name: "HealthPlus Pharmacy", subtitle: "Pharmacy Chain", description: "Retail pharmacy with prescription and over-the-counter medication.", address: "Multiple Lagos locations", meta: "Open daily · 8am - 10pm" },
  { id: "pharm-002", citySlug: "abuja-fct", category: "pharmacy", name: "MedPlus Pharmacy", subtitle: "Pharmacy Chain", description: "Pharmacy and wellness store chain with locations across Abuja.", address: "Jabi, Abuja", meta: "Open daily · 8am - 9pm" },

  { id: "hotel-001", citySlug: "lagos-lagos", category: "hotel", name: "Eko Hotels & Suites", subtitle: "5-Star Hotel", description: "Large luxury hotel and conference venue on Victoria Island.", address: "Victoria Island, Lagos", meta: "From ₦120,000/night" },
  { id: "hotel-002", citySlug: "abuja-fct", category: "hotel", name: "Transcorp Hilton Abuja", subtitle: "5-Star Hotel", description: "Landmark luxury hotel in the heart of Abuja.", address: "Central Business District, Abuja", meta: "From ₦150,000/night" },

  { id: "event-001", citySlug: "lagos-lagos", category: "event", name: "Lagos International Jazz Festival", subtitle: "Music Festival", description: "Annual jazz festival featuring local and international acts.", address: "Eko Hotel, Lagos", meta: "April" },
  { id: "event-002", citySlug: "lagos-lagos", category: "event", name: "Lagos Fashion Week", subtitle: "Fashion Event", description: "Showcase of Nigerian and African fashion designers.", address: "Various venues, Lagos", meta: "October" },

  { id: "market-001", citySlug: "lagos-lagos", category: "market", name: "Balogun Market", subtitle: "Open-Air Market", description: "One of Lagos's largest markets for textiles, electronics, and general goods.", address: "Lagos Island, Lagos", meta: "Open daily" },
  { id: "market-002", citySlug: "kano-kano", category: "market", name: "Kurmi Market", subtitle: "Historic Market", description: "Centuries-old market in Kano known for leather goods and crafts.", address: "Kano City, Kano", meta: "Open daily" },

  { id: "mall-001", citySlug: "lagos-lagos", category: "shopping-mall", name: "The Palms Shopping Mall", subtitle: "Shopping Mall", description: "Major shopping mall with retail stores, a cinema, and restaurants.", address: "Lekki, Lagos", meta: "Open daily · 9am - 9pm" },
  { id: "mall-002", citySlug: "abuja-fct", category: "shopping-mall", name: "Jabi Lake Mall", subtitle: "Shopping Mall", description: "Lakeside shopping mall with stores, cinema, and dining.", address: "Jabi, Abuja", meta: "Open daily · 9am - 9pm" },

  { id: "police-001", citySlug: "lagos-lagos", category: "police-station", name: "Ikeja Police Station", subtitle: "Divisional Police Station", description: "Divisional police headquarters serving the Ikeja area.", address: "Ikeja, Lagos", meta: "24/7" },
  { id: "police-002", citySlug: "abuja-fct", category: "police-station", name: "Wuse Police Station", subtitle: "Divisional Police Station", description: "Divisional police station serving the Wuse district.", address: "Wuse, Abuja", meta: "24/7" },

  { id: "church-001", citySlug: "lagos-lagos", category: "church", name: "Cathedral Church of Christ, Marina", subtitle: "Anglican", description: "Historic Anglican cathedral on Lagos Island, one of the oldest churches in Nigeria.", address: "Marina, Lagos Island", meta: "Sunday services", phone: "0801 234 5678" },
  { id: "church-002", citySlug: "lagos-lagos", category: "church", name: "RCCG City of David", subtitle: "Pentecostal (RCCG)", description: "Large Redeemed Christian Church of God parish popular with professionals.", address: "Victoria Island, Lagos", meta: "Sun 8am & 10am", phone: "0802 345 6789" },
  { id: "church-003", citySlug: "abuja-fct", category: "church", name: "National Christian Centre", subtitle: "Interdenominational", description: "Landmark national ecumenical centre for Christian worship in the capital.", address: "Central Business District, Abuja", meta: "Sunday services" },

  { id: "mosque-001", citySlug: "abuja-fct", category: "mosque", name: "Abuja National Mosque", subtitle: "National Mosque", description: "The national mosque of Nigeria, open to worshippers and (outside prayer times) visitors.", address: "Independence Avenue, Abuja", meta: "5 daily prayers", phone: "0803 456 7890" },
  { id: "mosque-002", citySlug: "lagos-lagos", category: "mosque", name: "Lagos Central Mosque", subtitle: "Central Mosque", description: "The principal mosque on Lagos Island, a major centre for Friday Jumu'ah prayers.", address: "Nnamdi Azikiwe St, Lagos Island", meta: "Jumu'ah Fridays" },
  { id: "mosque-003", citySlug: "kano-kano", category: "mosque", name: "Kano Central Mosque", subtitle: "Central Mosque", description: "Historic emirate central mosque in the heart of Kano city.", address: "Kofar Mata, Kano", meta: "5 daily prayers" },
];

/**
 * All directory listings, live from Firestore (real user/business-submitted
 * entries + seeded samples), MERGED with any bundled samples Firestore doesn't
 * have yet — the remote set was seeded at a point in time, so newer bundled
 * categories (e.g. churches/mosques added later) must not vanish just because
 * the remote collection is non-empty. Firestore wins on id conflicts. Relies
 * on getFirestoreCollection's own 5-minute TTL cache.
 */
export async function getDirectoryListingsLive(): Promise<DirectoryListing[]> {
  const remote = await getFirestoreCollection<DirectoryListing>("directoryListings");
  if (!remote || remote.length === 0) return directoryListings;
  const remoteIds = new Set(remote.map((l) => l.id));
  const missingSamples = directoryListings.filter((l) => !remoteIds.has(l.id));
  return missingSamples.length > 0 ? [...remote, ...missingSamples] : remote;
}

export async function getListingsLive(citySlug: string, category: ListingCategory): Promise<DirectoryListing[]> {
  const all = await getDirectoryListingsLive();
  return all.filter((l) => l.citySlug === citySlug && l.category === category);
}

export async function getListingById(id: string): Promise<DirectoryListing | null> {
  const all = await getDirectoryListingsLive();
  return all.find((l) => l.id === id) ?? null;
}

/** Human-readable label per category — single source for chips, headers, etc. */
export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  job: "Job",
  school: "School",
  hospital: "Hospital",
  pharmacy: "Pharmacy",
  hotel: "Hotel",
  event: "Event",
  market: "Market",
  "shopping-mall": "Shopping Mall",
  "police-station": "Police Station",
  church: "Church",
  mosque: "Mosque",
};

/** All listings added by one user — fresh query (not the 5-min public cache) so
 * their manage page reflects edits immediately. */
export async function getListingsForOwner(ownerId: string): Promise<DirectoryListing[]> {
  const r = await queryFirestoreCollection<DirectoryListing>("directoryListings", [["ownerId", ownerId]]);
  return (r ?? []).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function updateDirectoryListing(
  id: string,
  patch: Partial<Omit<DirectoryListing, "id" | "ownerId" | "createdAt">>
): Promise<WriteResult> {
  return setFirestoreDoc("directoryListings", id, patch);
}

export async function deleteDirectoryListing(id: string): Promise<WriteResult> {
  return deleteFirestoreDoc("directoryListings", id);
}

/** Extract the video id from a YouTube URL — returns null for anything that
 * isn't genuinely youtube.com / youtu.be (same anti-phishing stance as booking
 * links: don't let arbitrary URLs masquerade as videos). */
export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase().replace(/^www\.|^m\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return /^[\w-]{6,20}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v") ?? "";
        return /^[\w-]{6,20}$/.test(id) ? id : null;
      }
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,20})/);
      return m ? m[1] : null;
    }
    return null;
  } catch {
    return null;
  }
}
