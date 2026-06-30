"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { addReview, type Review } from "@/data/reviews";
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
  const [name, setName] = useState(profile?.displayName ?? "");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      { id: result.id, citySlug, section, name: name.trim(), rating, comment: comment.trim(), date: new Date().toISOString() },
      ...prev,
    ]);
    setRating(0);
    setComment("");
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
          {reviews.map((r) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
