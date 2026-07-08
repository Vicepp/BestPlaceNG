import { queryFirestoreCollection, addFirestoreDoc, type WriteResult } from "@/lib/firestoreWrite";
import { doc, updateDoc, increment } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

export interface Review {
  id: string;
  citySlug: string;
  section: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  /** Community reactions — shown beside each review. */
  likes?: number;
  dislikes?: number;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  /** Denormalised so ONE query loads every reply for a city-section page. */
  citySlug: string;
  section: string;
  name: string;
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
    likes: 0,
    dislikes: 0,
  });
}

/* ── Replies ──────────────────────────────────────────────────── */

/** All replies for a city section, oldest first (conversation order), grouped client-side by reviewId. */
export async function getRepliesLive(citySlug: string, section: string): Promise<ReviewReply[]> {
  const docs = await queryFirestoreCollection<ReviewReply>("reviewReplies", [
    ["citySlug", citySlug],
    ["section", section],
  ]);
  if (!docs) return [];
  return [...docs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function addReviewReply(params: {
  reviewId: string;
  citySlug: string;
  section: string;
  name: string;
  comment: string;
}): Promise<WriteResult> {
  return addFirestoreDoc("reviewReplies", { ...params, date: new Date().toISOString() });
}

/* ── Reactions ────────────────────────────────────────────────── */

/** Register a like or dislike on a review. One vote per browser is enforced
 * with localStorage (soft guard — same as anonymous reviews themselves). */
export async function voteReview(reviewId: string, kind: "like" | "dislike"): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  try {
    await updateDoc(doc(getDb(), "reviews", reviewId), {
      [kind === "like" ? "likes" : "dislikes"]: increment(1),
    });
    return true;
  } catch (e) {
    console.error("[reviews] vote failed:", e);
    return false;
  }
}

const VOTE_KEY = "bpng:reviewVotes";

export function getMyVote(reviewId: string): "like" | "dislike" | null {
  if (typeof window === "undefined") return null;
  try {
    const map = JSON.parse(window.localStorage.getItem(VOTE_KEY) ?? "{}");
    return map[reviewId] ?? null;
  } catch {
    return null;
  }
}

export function rememberMyVote(reviewId: string, kind: "like" | "dislike"): void {
  if (typeof window === "undefined") return;
  try {
    const map = JSON.parse(window.localStorage.getItem(VOTE_KEY) ?? "{}");
    map[reviewId] = kind;
    window.localStorage.setItem(VOTE_KEY, JSON.stringify(map));
  } catch { /* ignore quota/parse issues */ }
}
