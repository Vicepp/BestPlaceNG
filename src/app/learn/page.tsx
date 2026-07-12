import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, TrendingUp, Mail } from "lucide-react";
import { getBlogPostsLive } from "@/data/blog";
import BlogGrid from "@/components/BlogGrid";

export const metadata: Metadata = {
  title: "Learn — City Guides, Cost of Living & Renting in Nigeria | BestPlaceNG",
  description: "Data-backed guides on Nigerian cities: cost of living, rent prices, safety, comparisons and renting advice — updated with real research.",
};

export const revalidate = 300;

export default async function LearnPage() {
  const posts = await getBlogPostsLive();
  const featured = posts.filter((p) => p.featured).slice(0, 3);
  const categories = [...new Set(posts.map((p) => p.category))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold text-foreground sm:text-4xl">
          <BookOpen className="h-8 w-8 text-brand" /> Learn
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-500">
          City guides, cost-of-living breakdowns, comparisons and renting advice — written from the same data that powers
          BestPlaceNG, not vibes.
        </p>
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">{c}</span>
            ))}
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center text-sm text-zinc-400">
          Posts are on the way — check back shortly.
        </div>
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <BlogGrid posts={posts} />
          </div>

          {/* Sidebar */}
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            {featured.length > 0 && (
              <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  <TrendingUp className="h-3.5 w-3.5 text-brand" /> Staff picks
                </h3>
                <div className="mt-3 space-y-4">
                  {featured.map((p, i) => (
                    <Link key={p.slug} href={`/learn/${p.slug}`} className="group flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">{i + 1}</span>
                      <span className="block text-sm font-bold leading-snug text-foreground group-hover:text-brand">{p.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-brand/20 bg-brand-light/40 p-5">
              <h3 className="text-lg font-extrabold text-foreground">Stay updated</h3>
              <p className="mt-1 text-sm text-zinc-500">New city data, rent research and guides — follow along by creating a free account.</p>
              <Link href="/signup" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-dark">
                <Mail className="h-4 w-4" /> Join free
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
