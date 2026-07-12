/**
 * Learn (blog) posts. Content lives in Firestore `blogPosts` (doc id = slug),
 * written by scripts/seed-blog.ts and scripts/add-blog-post.mjs (used by the
 * /write-trending-blog skill). Public read; no client writes.
 */
import { getFirestoreCollection } from "@/lib/firestoreData";

export type PostKind = "standalone" | "comparison" | "vs-competitor" | "discussion" | "listicle";

export interface BlogSection {
  h2: string;
  body: string;
  /** Optional bullet list rendered after the body. */
  bullets?: string[];
  /** Optional comparison table rendered after the body. */
  table?: { headers: string[]; rows: string[][] };
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  kind: PostKind;
  tags: string[];
  image: string;
  author: { name: string; role: string };
  date: string;
  metaDescription: string;
  sections: BlogSection[];
  takeaways: string[];
  /** CTA shown mid-article and at the end: label + href. */
  ctaMid: { label: string; href: string };
  ctaEnd: { label: string; href: string };
  featured?: boolean;
  /** External sources & further reading — rendered at the end for E-E-A-T. */
  references?: { label: string; url: string }[];
}

export async function getBlogPostsLive(): Promise<BlogPost[]> {
  const docs = await getFirestoreCollection<BlogPost>("blogPosts");
  if (!docs) return [];
  return [...docs].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const all = await getBlogPostsLive();
  return all.find((p) => p.slug === slug) ?? null;
}

/* ── Comments ─────────────────────────────────────────────────── */
import { queryFirestoreCollection, addFirestoreDoc, type WriteResult } from "@/lib/firestoreWrite";

export interface BlogComment {
  id: string;
  postSlug: string;
  name: string;
  comment: string;
  likes?: number;
  date: string;
}

export async function getBlogComments(postSlug: string): Promise<BlogComment[]> {
  const docs = await queryFirestoreCollection<BlogComment>("blogComments", [["postSlug", postSlug]]);
  if (!docs) return [];
  return [...docs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addBlogComment(postSlug: string, name: string, comment: string): Promise<WriteResult> {
  return addFirestoreDoc("blogComments", { postSlug, name, comment, likes: 0, date: new Date().toISOString() });
}

/* ── Views, reactions, read-time ──────────────────────────────── */
import { doc, setDoc, getDoc, increment } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";

export interface BlogStats { views?: number; like?: number; love?: number; insightful?: number }

export async function getBlogStats(slug: string): Promise<BlogStats> {
  if (!isFirebaseConfigured()) return {};
  try {
    const snap = await getDoc(doc(getDb(), "blogStats", slug));
    return (snap.data() as BlogStats) ?? {};
  } catch { return {}; }
}

/** Bump a counter on the post (views on open, reactions on tap). */
export async function bumpBlogStat(slug: string, field: "views" | "like" | "love" | "insightful"): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await setDoc(doc(getDb(), "blogStats", slug), { [field]: increment(1) }, { merge: true });
  } catch { /* non-critical */ }
}

export async function likeBlogComment(id: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await setDoc(doc(getDb(), "blogComments", id), { likes: increment(1) }, { merge: true });
  } catch { /* non-critical */ }
}

/** Estimated reading time from the post's full text. */
export function readMinutes(post: BlogPost): number {
  const words = [post.excerpt, ...post.sections.flatMap((s) => [s.body, ...(s.bullets ?? [])]), ...post.takeaways]
    .join(" ").split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}
