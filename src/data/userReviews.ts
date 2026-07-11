/**
 * Reviews ABOUT a user (landlord or tenant) — left by the other party after a
 * completed tenancy or tour. Shown on the Settings → Reviews tab and (later)
 * public profiles.
 */
import { addFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";

export interface UserReview {
  id: string;
  /** The user being reviewed. */
  subjectId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  /** What relationship produced the review, e.g. "tenancy" | "tour". */
  context?: string;
  date: string;
}

export async function getReviewsAboutUser(subjectId: string): Promise<UserReview[]> {
  const docs = await queryFirestoreCollection<UserReview>("userReviews", [["subjectId", subjectId]]);
  if (!docs) return [];
  return [...docs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addUserReview(params: Omit<UserReview, "id" | "date">): Promise<WriteResult> {
  return addFirestoreDoc("userReviews", { ...params, date: new Date().toISOString() });
}
