"use client";

import { useEffect, useState } from "react";
import { Eye, Heart, ThumbsUp, Lightbulb, Share2, MessageSquare, Link2, CheckCircle } from "lucide-react";
import {
  getBlogStats, bumpBlogStat, getBlogComments, addBlogComment, likeBlogComment,
  type BlogStats, type BlogComment,
} from "@/data/blog";
import { useAuth } from "@/context/AuthContext";

const voted = (key: string) => typeof window !== "undefined" && window.localStorage.getItem(key) === "1";
const remember = (key: string) => window.localStorage.setItem(key, "1");

/** Views / reactions / share bar shown under the post header. */
export function EngagementBar({ slug, title }: { slug: string; title: string }) {
  const [stats, setStats] = useState<BlogStats>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Count one view per browser per post, then load the totals.
    const key = `bpng:seen:${slug}`;
    (async () => {
      if (!voted(key)) { await bumpBlogStat(slug, "views"); remember(key); }
      setStats(await getBlogStats(slug));
    })();
  }, [slug]);

  async function react(field: "like" | "love" | "insightful") {
    const key = `bpng:react:${slug}:${field}`;
    if (voted(key)) return;
    remember(key);
    setStats((s) => ({ ...s, [field]: (s[field] ?? 0) + 1 }));
    await bumpBlogStat(slug, field);
  }

  function share(target: "whatsapp" | "x" | "copy") {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = encodeURIComponent(`${title} — ${url}`);
    if (target === "whatsapp") window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
    else if (target === "x") window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener");
    else { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  }

  const R = ({ field, icon: Icon, label }: { field: "like" | "love" | "insightful"; icon: React.ComponentType<{ className?: string }>; label: string }) => (
    <button onClick={() => react(field)} title={label}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        voted(`bpng:react:${slug}:${field}`) ? "border-brand/40 bg-brand-light text-brand-dark" : "border-zinc-200 text-zinc-500 hover:border-brand hover:text-brand"
      }`}>
      <Icon className="h-3.5 w-3.5" /> {(stats[field] ?? 0) > 0 && <span>{stats[field]}</span>}
    </button>
  );

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500">
        <Eye className="h-3.5 w-3.5" /> {(stats.views ?? 0).toLocaleString()} read{(stats.views ?? 0) === 1 ? "" : "s"}
      </span>
      <R field="like" icon={ThumbsUp} label="Helpful" />
      <R field="love" icon={Heart} label="Love it" />
      <R field="insightful" icon={Lightbulb} label="Insightful" />
      <span className="mx-1 h-4 w-px bg-zinc-200" />
      <button onClick={() => share("whatsapp")} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:border-brand hover:text-brand">WhatsApp</button>
      <button onClick={() => share("x")} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:border-brand hover:text-brand">X</button>
      <button onClick={() => share("copy")} className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:border-brand hover:text-brand">
        {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

/** Comment section: list + form, with like + share on every comment. */
export function BlogComments({ slug, title }: { slug: string; title: string }) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getBlogComments(slug).then(setComments); }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) { setError("Add your name and a comment."); return; }
    setError("");
    setBusy(true);
    const res = await addBlogComment(slug, name.trim(), text.trim());
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setComments((prev) => [{ id: res.id, postSlug: slug, name: name.trim(), comment: text.trim(), likes: 0, date: new Date().toISOString() } as BlogComment, ...prev]);
    setText("");
  }

  async function like(c: BlogComment) {
    const key = `bpng:clike:${c.id}`;
    if (voted(key)) return;
    remember(key);
    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, likes: (x.likes ?? 0) + 1 } : x)));
    await likeBlogComment(c.id);
  }

  function shareComment(c: BlogComment) {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text2 = encodeURIComponent(`"${c.comment.slice(0, 120)}" — ${c.name} on ${title}\n${url}`);
    window.open(`https://wa.me/?text=${text2}`, "_blank", "noopener");
  }

  return (
    <div className="mt-12 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-foreground">
        <MessageSquare className="h-5 w-5 text-brand" /> Join the conversation ({comments.length})
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="What's your experience with this? Agree, disagree, add context…"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? "Posting…" : "Post comment"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-zinc-100 p-4">
            <p className="text-sm font-bold text-foreground">{c.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">{c.comment}</p>
            <div className="mt-2 flex items-center gap-3">
              <button onClick={() => like(c)}
                className={`flex items-center gap-1 text-xs font-semibold ${voted(`bpng:clike:${c.id}`) ? "text-brand" : "text-zinc-400 hover:text-brand"}`}>
                <ThumbsUp className="h-3.5 w-3.5" /> {(c.likes ?? 0) > 0 && c.likes}
              </button>
              <button onClick={() => shareComment(c)} className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-brand">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="py-4 text-center text-sm text-zinc-400">No comments yet. Start the conversation.</p>}
      </div>
    </div>
  );
}
