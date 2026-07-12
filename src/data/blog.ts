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
