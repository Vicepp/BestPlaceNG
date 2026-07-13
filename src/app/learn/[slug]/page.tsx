import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { getBlogPost, getBlogPostsLive, readMinutes } from "@/data/blog";
import { EngagementBar, BlogComments } from "@/components/BlogEngagement";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found | BestPlaceNG" };
  return {
    title: `${post.title} | BestPlaceNG Learn`,
    description: post.metaDescription,
    keywords: post.tags,
    openGraph: { title: post.title, description: post.metaDescription, images: [post.image], type: "article", url: `/learn/${post.slug}` },
    twitter: { card: "summary_large_image", title: post.title, description: post.metaDescription, images: [post.image] },
    alternates: { canonical: `/learn/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getBlogPost(slug), getBlogPostsLive()]);
  if (!post) notFound();

  const related = all.filter((p) => p.slug !== post.slug && (p.category === post.category || p.tags.some((t) => post.tags.includes(t)))).slice(0, 3);
  const midpoint = Math.min(2, Math.max(1, Math.floor(post.sections.length / 2)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    image: post.image,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: "BestPlaceNG" },
  };

  /** Render [text](href) inline links: internal -> Link, external -> nofollow anchor. */
  const rich = (text: string) => {
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (!m) return part;
      const [, label, href] = m;
      return href.startsWith("/")
        ? <Link key={i} href={href} className="font-semibold text-brand underline-offset-2 hover:underline">{label}</Link>
        : <a key={i} href={href} target="_blank" rel="nofollow noopener noreferrer" className="font-semibold text-brand underline-offset-2 hover:underline">{label}</a>;
    });
  };

  const Cta = ({ label, href }: { label: string; href: string }) => (
    <div className="my-8 rounded-2xl border border-brand/20 bg-brand-light/40 p-6 text-center">
      <p className="text-sm font-semibold text-zinc-600">Ready to see the data for yourself?</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">
        {label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/learn" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><ArrowLeft className="h-4 w-4" /> All posts</Link>

      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Article */}
        <article className="min-w-0 flex-1">
          <div className="text-center">
            <span className="rounded-full bg-brand-light px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">{post.category}</span>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{post.title}</h1>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
              {post.author.name} · {post.author.role} · {readMinutes(post)} min read
            </p>
            <EngagementBar slug={post.slug} title={post.title} description={post.metaDescription} />
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt={post.title} className="mt-8 w-full rounded-2xl object-cover" style={{ maxHeight: 420 }} />

          <p className="mt-8 text-lg leading-relaxed text-zinc-600">{post.excerpt}</p>

          {post.sections.map((s, i) => (
            <section key={s.h2}>
              <h2 className="mt-10 text-2xl font-extrabold text-foreground">{s.h2}</h2>
              <p className="mt-3 leading-relaxed text-zinc-600">{rich(s.body)}</p>
              {s.bullets && s.bullets.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-zinc-600">
                  {s.bullets.map((b) => <li key={b} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> <span>{rich(b)}</span></li>)}
                </ul>
              )}
              {s.table && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                      {s.table.headers.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {s.table.rows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                          {row.cells.map((cell, ci) => <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? "font-semibold text-foreground" : "text-zinc-600"}`}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {i === midpoint - 1 && <Cta {...post.ctaMid} />}
            </section>
          ))}

          <h2 className="mt-10 text-2xl font-extrabold text-foreground">Key takeaways</h2>
          <ul className="mt-3 space-y-1.5 text-zinc-600">
            {post.takeaways.map((t) => <li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> <span>{t}</span></li>)}
          </ul>

          {post.references && post.references.length > 0 && (
            <>
              <h2 className="mt-10 text-2xl font-extrabold text-foreground">Sources &amp; further reading</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {post.references.map((ref) => (
                  <li key={ref.url}>
                    <a href={ref.url} target="_blank" rel="nofollow noopener noreferrer" className="font-semibold text-brand underline-offset-2 hover:underline">
                      {ref.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <Cta {...post.ctaEnd} />

          <BlogComments slug={post.slug} title={post.title} />
        </article>

        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-6 lg:w-72">
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400">About the author</h3>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand"><User className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold text-foreground">{post.author.name}</p>
                <p className="text-xs text-zinc-400">{post.author.role}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              The BestPlaceNG editorial team writes practical, data-backed guides to living, renting and investing across Nigeria&apos;s cities.
            </p>
          </div>

          {related.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400">Related posts</h3>
              <div className="mt-3 space-y-3">
                {related.map((r) => (
                  <Link key={r.slug} href={`/learn/${r.slug}`} className="group block">
                    <p className="text-sm font-bold leading-snug text-foreground group-hover:text-brand">{r.title}</p>
                    <p className="text-xs text-zinc-400">{r.category}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
