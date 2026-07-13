"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, MapPin, Scale, Home, Palmtree, Sparkles, Landmark, Newspaper, Search, X } from "lucide-react";
import { readMinutes, type BlogPost } from "@/data/blog";

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "City Guides": MapPin, Comparisons: Scale, "Cost of Living": Landmark, Rankings: Newspaper,
  "Renting 101": Home, "Real Estate": Home, "Weekend & Travel": Palmtree, "Vibes & Culture": Sparkles,
};

/** Every word typed must appear somewhere in the post's text. */
function matches(p: BlogPost, q: string) {
  const hay = `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

/** Highlight the typed words inside a suggestion title. */
function Highlight({ text, q }: { text: string; q: string }) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const pattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const isHit = new RegExp(`^(?:${pattern})$`, "i");
  return (
    <>
      {text.split(new RegExp(`(${pattern})`, "gi")).map((part, i) =>
        isHit.test(part) ? <mark key={i} className="rounded bg-brand-light px-0.5 font-extrabold text-brand-dark">{part}</mark> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/** Masonry blog grid (varied card heights) with live search + category tabs —
 * dates stay in the database, never on the cards. */
export default function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => ["All", ...[...new Set(posts.map((p) => p.category))]], [posts]);

  const searched = q.trim() ? posts.filter((p) => matches(p, q)) : posts;
  const filtered = cat === "All" ? searched : searched.filter((p) => p.category === cat);
  const suggestions = q.trim() ? searched.slice(0, 7) : [];

  // Deterministic varied image heights for the masonry rhythm.
  const h = (slug: string) => [176, 224, 288, 208, 256][slug.length % 5];

  return (
    <div>
      {/* Live search */}
      <div className="relative mb-5">
        <div className={`flex items-center gap-3 rounded-full border bg-white px-5 py-3.5 shadow-sm transition ${focused ? "border-brand ring-4 ring-brand/10" : "border-zinc-200"}`}>
          <Search className={`h-5 w-5 shrink-0 ${focused ? "text-brand" : "text-zinc-400"}`} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search topics… try “Lagos rent”, “safest city”, “landlord”"
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-zinc-400" />
          {q && (
            <button onClick={() => { setQ(""); inputRef.current?.focus(); }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-brand hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown: topics containing the typed words */}
        {focused && q.trim() && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-2xl">
            {suggestions.length > 0 ? (
              <>
                {suggestions.map((p) => (
                  <Link key={p.slug} href={`/learn/${p.slug}`}
                    className="flex items-center gap-3 border-b border-zinc-50 px-4 py-3 transition last:border-0 hover:bg-brand-light/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground"><Highlight text={p.title} q={q} /></p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand">{p.category} <span className="font-bold text-zinc-300">· {readMinutes(p)} min read</span></p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-bold text-zinc-300">→</span>
                  </Link>
                ))}
                <p className="bg-zinc-50 px-4 py-2 text-center text-[11px] font-semibold text-zinc-400">
                  {searched.length} topic{searched.length === 1 ? "" : "s"} match “{q.trim()}” — matching posts shown below
                </p>
              </>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm font-bold text-foreground">No topics found for “{q.trim()}”</p>
                <p className="mt-1 text-xs text-zinc-400">Try a city name, “rent”, “safety”, “business” — or browse the categories below.</p>
              </div>
            )}
          </div>
        )}
      </div>

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
                {c === "All" ? searched.length : searched.filter((p) => p.category === c).length}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-bold text-foreground">Nothing matches {q.trim() ? `“${q.trim()}”` : "here"}{cat !== "All" ? ` in ${cat}` : ""}</p>
          <button onClick={() => { setQ(""); setCat("All"); }} className="mt-3 rounded-full bg-brand px-5 py-2 text-xs font-bold text-white hover:bg-brand-dark">
            Show all posts
          </button>
        </div>
      )}

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
