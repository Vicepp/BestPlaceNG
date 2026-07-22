import type { MetadataRoute } from "next";
import { cities } from "@/data/cities";
import { getBlogPostsLive } from "@/data/blog";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 3600; // regenerate hourly — cheap, and posts/cities change slowly

const STATIC_PAGES = [
  { path: "", priority: 1.0, freq: "daily" as const },
  { path: "/apartments", priority: 0.9, freq: "daily" as const },
  { path: "/shortlets", priority: 0.9, freq: "daily" as const },
  { path: "/rankings", priority: 0.8, freq: "weekly" as const },
  { path: "/compare", priority: 0.7, freq: "weekly" as const },
  { path: "/where-should-i-move", priority: 0.8, freq: "weekly" as const },
  { path: "/learn", priority: 0.8, freq: "daily" as const },
  { path: "/list-property", priority: 0.5, freq: "monthly" as const },
  { path: "/list-business", priority: 0.5, freq: "monthly" as const },
];

/** Every indexable URL on the site: static pages, all city profiles, and every
 * published blog post. Listing/property pages are user-generated and change
 * or disappear too often to enumerate safely here — Google discovers those via
 * normal internal links instead, which is the correct pattern for volatile content. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const posts = await getBlogPostsLive();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${siteUrl}${p.path}`,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  const cityEntries: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${siteUrl}/city/${c.slug}`,
    changeFrequency: "weekly",
    priority: c.tier === "major" ? 0.9 : 0.6,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}/learn/${p.slug}`,
    lastModified: p.date,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...cityEntries, ...blogEntries];
}
