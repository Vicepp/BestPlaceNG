import { queryFirestoreCollection, addFirestoreDoc, type WriteResult } from "@/lib/firestoreWrite";

export interface Review {
  id: string;
  citySlug: string;
  section: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

/** Reviews for a given city section, newest first. Returns an empty list (not null) on any failure - no static fallback needed since reviews are inherently dynamic, user-generated content. */
export async function getReviewsLive(citySlug: string, section: string): Promise<Review[]> {
  const docs = await queryFirestoreCollection<Review>("reviews", [
    ["citySlug", citySlug],
    ["section", section],
  ]);
  if (!docs) return [];
  return [...docs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addReview(
  citySlug: string,
  section: string,
  data: { name: string; rating: number; comment: string }
): Promise<WriteResult> {
  return addFirestoreDoc("reviews", {
    citySlug,
    section,
    name: data.name,
    rating: data.rating,
    comment: data.comment,
    date: new Date().toISOString(),
  });
}
