import { getFirestoreCollection } from "@/lib/firestoreData";

export type ListingCategory =
  | "job"
  | "school"
  | "hospital"
  | "pharmacy"
  | "hotel"
  | "event"
  | "market"
  | "shopping-mall"
  | "police-station";

export interface DirectoryListing {
  id: string;
  citySlug: string;
  category: ListingCategory;
  name: string;
  subtitle?: string;
  description: string;
  address?: string;
  meta?: string;
  tags?: string[];
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
];

/**
 * All directory listings, live from Firestore (real user/business-submitted
 * entries + seeded samples), with the bundled samples as fallback. Relies on
 * getFirestoreCollection's own 5-minute TTL cache rather than caching again
 * here, so newly-added listings show up within a few minutes rather than only
 * after a server restart.
 */
export async function getDirectoryListingsLive(): Promise<DirectoryListing[]> {
  const remote = await getFirestoreCollection<DirectoryListing>("directoryListings");
  return remote && remote.length > 0 ? remote : directoryListings;
}

export async function getListingsLive(citySlug: string, category: ListingCategory): Promise<DirectoryListing[]> {
  const all = await getDirectoryListingsLive();
  return all.filter((l) => l.citySlug === citySlug && l.category === category);
}
