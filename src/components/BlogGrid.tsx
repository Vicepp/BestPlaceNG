"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, MapPin, Scale, Home, Palmtree, Sparkles, Landmark, Newspaper } from "lucide-react";
import { readMinutes, type BlogPost } from "@/data/blog";

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "City Guides": MapPin, Comparisons: Scale, "Cost of Living": Landmark, Rankings: Newspaper,
  "Renting 101": Home, "Real Estate": Home, "Weekend & Travel": Palmtree, "Vibes & Culture": Sparkles,
};

/** Masonry blog grid (varied card heights) with category tabs — dates stay in
 * the database, never on the cards. */
export default function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [cat, setCat] = useState("All");
  const categories = useMemo(() => ["All", ...[...new Set(posts.map((p) => p.category))]], [posts]);
  const filtered = cat === "All" ? posts : posts.filter((p) => p.category === cat);

  // Deterministic varied image heights for the masonry rhythm.
  const h = (slug: string) => [176, 224, 288, 208, 256][slug.length % 5];

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const Icon = CAT_ICONS[c] ?? BookOpen;
          return (
            <button key={c} onClick={() => setCat(c)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                cat === c ? "bg-brand text-white" : "border border-zinc-200 bg-white text-zinc-500 hover:border-brand hover:text-brand"
              }`}>
              {c !== "All" && <Icon className="h-3.5 w-3.5" />} {c}
              <span className={`rounded-full px-1.5 text-[10px] ${cat === c ? "bg-white/20" : "bg-zinc-100"}`}>
                {c === "All" ? posts.length : posts.filter((p) => p.category === c).length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="columns-1 gap-5 sm:columns-2 xl:columns-3 [&>*]:mb-5">
        {filtered.map((p) => {
          const Icon = CAT_ICONS[p.category] ?? BookOpen;
          return (
            <Link key={p.slug} href={`/learn/${p.slug}`}
              className="group block break-inside-avoid overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-xl">
              <div className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.title} loading="lazy" style={{ height: h(p.slug) }}
                  className="w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand shadow backdrop-blur">
                  <Icon className="h-4 w-4" />
                </span>
                {p.featured && (
                  <span className="absolute left-3 top-3 rounded-lg bg-accent px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">★ Pick</span>
                )}
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  Read Post →
                </span>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand">{p.category} <span className="font-bold text-zinc-300">· {readMinutes(p)} min read</span></p>
                <h2 className="mt-1 text-base font-extrabold leading-snug text-foreground group-hover:text-brand">{p.title}</h2>
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{p.excerpt}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
