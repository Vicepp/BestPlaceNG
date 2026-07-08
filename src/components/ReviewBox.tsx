"use client";

import { useEffect, useState } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import {
  addReview, addReviewReply, getRepliesLive, voteReview, getMyVote, rememberMyVote,
  type Review, type ReviewReply,
} from "@/data/reviews";
import { useAuth } from "@/context/AuthContext";

export default function ReviewBox({
  citySlug,
  section,
  sectionLabel,
  cityName,
  initialReviews,
}: {
  citySlug: string;
  section: string;
  sectionLabel: string;
  cityName: string;
  initialReviews: Review[];
}) {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [replies, setReplies] = useState<Record<string, ReviewReply[]>>({});
  const [name, setName] = useState(profile?.displayName ?? "");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Which review has its reply box open, and the draft reply
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyName, setReplyName] = useState(profile?.displayName ?? "");
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  // votes already cast from this browser: reviewId -> like|dislike
  const [myVotes, setMyVotes] = useState<Record<string, "like" | "dislike">>({});

  // Load replies + my previous votes once on mount.
  useEffect(() => {
    getRepliesLive(citySlug, section).then((all) => {
      const grouped: Record<string, ReviewReply[]> = {};
      for (const r of all) (grouped[r.reviewId] ??= []).push(r);
      setReplies(grouped);
    });
    const votes: Record<string, "like" | "dislike"> = {};
    for (const r of initialReviews) {
      const v = getMyVote(r.id);
      if (v) votes[r.id] = v;
    }
    setMyVotes(votes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug, section]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || rating === 0 || !comment.trim()) {
      setError("Please add your name, a star rating, and a comment.");
      return;
    }
    setSubmitting(true);
    const result = await addReview(citySlug, section, { name: name.trim(), rating, comment: comment.trim() });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReviews((prev) => [
      { id: result.id, citySlug, section, name: name.trim(), rating, comment: comment.trim(), date: new Date().toISOString(), likes: 0, dislikes: 0 },
      ...prev,
    ]);
    setRating(0);
    setComment("");
  }

  async function handleVote(review: Review, kind: "like" | "dislike") {
    if (myVotes[review.id]) return; // one vote per browser
    setMyVotes((prev) => ({ ...prev, [review.id]: kind }));
    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id ? { ...r, [kind === "like" ? "likes" : "dislikes"]: (kind === "like" ? r.likes ?? 0 : r.dislikes ?? 0) + 1 } : r
      )
    );
    const ok = await voteReview(review.id, kind);
    if (ok) rememberMyVote(review.id, kind);
  }

  async function handleReply(review: Review) {
    if (!replyName.trim() || !replyText.trim()) return;
    setReplySending(true);
    const res = await addReviewReply({
      reviewId: review.id,
      citySlug,
      section,
      name: replyName.trim(),
      comment: replyText.trim(),
    });
    setReplySending(false);
    if (!res.ok) return;
    const newReply: ReviewReply = {
      id: res.id, reviewId: review.id, citySlug, section,
      name: replyName.trim(), comment: replyText.trim(), date: new Date().toISOString(),
    };
    setReplies((prev) => ({ ...prev, [review.id]: [...(prev[review.id] ?? []), newReply] }));
    setReplyText("");
    setReplyOpen(null);
  }

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mt-10 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-foreground">
          Reviews &middot; {sectionLabel} in {cityName}
        </h3>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-sm text-zinc-500">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {average.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-foreground">Write a review</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const filled = (hoverRating || rating) >= value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
              >
                <Star className={`h-5 w-5 ${filled ? "fill-accent text-accent" : "text-zinc-300"}`} />
              </button>
            );
          })}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Share your experience with ${sectionLabel.toLowerCase()} in ${cityName}...`}
          rows={3}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
        <p className="text-xs text-zinc-400">Reviews are public and visible to everyone who visits this page.</p>
      </form>

      {reviews.length > 0 && (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => {
            const likeCount = r.likes ?? 0;
            const dislikeCount = r.dislikes ?? 0;
            const voted = myVotes[r.id];
            const reviewReplies = replies[r.id] ?? [];
            return (
              <div key={r.id} className="rounded-xl border border-zinc-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{r.name}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-zinc-200"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{r.comment}</p>
                <p className="mt-1 text-xs text-zinc-400">{new Date(r.date).toLocaleDateString()}</p>

                {/* Reactions + reply action */}
                <div className="mt-2 flex items-center gap-4 border-t border-zinc-50 pt-2">
                  <button
                    onClick={() => handleVote(r, "like")}
                    disabled={Boolean(voted)}
                    className={`flex items-center gap-1 text-xs font-semibold transition ${
                      voted === "like" ? "text-brand" : voted ? "text-zinc-300" : "text-zinc-400 hover:text-brand"
                    }`}
                    aria-label="Helpful"
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${voted === "like" ? "fill-brand/20" : ""}`} />
                    {likeCount > 0 && <span>{likeCount}</span>}
                  </button>
                  <button
                    onClick={() => handleVote(r, "dislike")}
                    disabled={Boolean(voted)}
                    className={`flex items-center gap-1 text-xs font-semibold transition ${
                      voted === "dislike" ? "text-red-500" : voted ? "text-zinc-300" : "text-zinc-400 hover:text-red-500"
                    }`}
                    aria-label="Not helpful"
                  >
                    <ThumbsDown className={`h-3.5 w-3.5 ${voted === "dislike" ? "fill-red-100" : ""}`} />
                    {dislikeCount > 0 && <span>{dislikeCount}</span>}
                  </button>
                  <button
                    onClick={() => { setReplyOpen(replyOpen === r.id ? null : r.id); }}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-400 transition hover:text-brand"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Reply{reviewReplies.length > 0 && <span> ({reviewReplies.length})</span>}
                  </button>
                </div>

                {/* Existing replies */}
                {reviewReplies.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-zinc-100 pl-3">
                    {reviewReplies.map((rep) => (
                      <div key={rep.id} className="rounded-lg bg-zinc-50 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">{rep.name}</p>
                          <p className="text-[10px] text-zinc-400">{new Date(rep.date).toLocaleDateString()}</p>
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-600">{rep.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form */}
                {replyOpen === r.id && (
                  <div className="mt-3 space-y-2 rounded-lg bg-zinc-50 p-3">
                    <input
                      value={replyName}
                      onChange={(e) => setReplyName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                    />
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${r.name}…`}
                      rows={2}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(r)}
                        disabled={replySending || !replyName.trim() || !replyText.trim()}
                        className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                      >
                        {replySending ? "Posting…" : "Post reply"}
                      </button>
                      <button onClick={() => setReplyOpen(null)} className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-500">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
