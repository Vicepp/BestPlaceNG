import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, TrendingUp, Mail } from "lucide-react";
import { getBlogPostsLive } from "@/data/blog";

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
          {/* Post grid */}
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <Link key={p.slug} href={`/learn/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.title} loading="lazy" className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                    <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-brand-dark">{p.category}</span>
                    <span className="text-zinc-300">{new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-extrabold leading-snug text-foreground group-hover:text-brand">{p.title}</h2>
                  <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">{p.excerpt}</p>
                  <p className="mt-3 text-xs font-semibold text-zinc-400">{p.author.name} · {p.author.role}</p>
                </div>
              </Link>
            ))}
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
                      <span>
                        <span className="block text-sm font-bold leading-snug text-foreground group-hover:text-brand">{p.title}</span>
                        <span className="text-xs text-zinc-400">{new Date(p.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
                      </span>
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
