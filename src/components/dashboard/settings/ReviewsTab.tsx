"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getReviewsAboutUser, type UserReview } from "@/data/userReviews";

/** Reviews other users have left about YOU (after tenancies/tours). */
export default function ReviewsTab() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getReviewsAboutUser(user.uid).then((r) => { setReviews(r); setLoading(false); });
  }, [user]);

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Your Reviews</h2>
          <p className="text-sm text-zinc-400">View what others have said about you.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-bold">
          <span className="text-red-500">{average.toFixed(1)}</span>
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-amber-600">({reviews.length})</span>
        </span>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-400">Loading…</p>
      ) : reviews.length === 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-100 bg-white px-6 py-14 text-center shadow-sm">
          <Star className="mx-auto mb-3 h-8 w-8 text-zinc-200" />
          <p className="text-sm text-zinc-500">No reviews yet. Reviews will appear here after your tenancies and tours are complete.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{r.reviewerName}</p>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`} />
                  ))}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{r.comment}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(r.date).toLocaleDateString()}{r.context ? ` · after a ${r.context}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
