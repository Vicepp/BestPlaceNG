import Link from "next/link";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, ChevronRight } from "lucide-react";
import { getReviewsForCityLive, getRepliesForCityLive, type Review, type ReviewReply } from "@/data/reviews";
import { citySections } from "@/data/citySections";
import type { CityData } from "@/data/cities";

function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${className} ${i < rating ? "fill-accent text-accent" : "text-zinc-200"}`} />
      ))}
    </span>
  );
}

/** The city's Reviews tab: every review left anywhere on this city's pages,
 * grouped by the topic (section) it was posted under. Reading happens here;
 * writing/reacting happens on the topic's own page (linked per group). */
export default async function CityReviewsOverview({ city }: { city: CityData }) {
  const [reviews, replies] = await Promise.all([
    getReviewsForCityLive(city.slug),
    getRepliesForCityLive(city.slug),
  ]);

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No reviews for {city.name} yet — be the first</p>
        <p className="mt-1 text-xs text-zinc-400">
          Visit any section of {city.name} — like Cost of Living, Crime, or Apartments — and scroll down to leave a
          review for that topic, or use the review box below for a general one. No account needed.
        </p>
      </div>
    );
  }

  const repliesByReview = new Map<string, ReviewReply[]>();
  for (const rep of replies) {
    if (!repliesByReview.has(rep.reviewId)) repliesByReview.set(rep.reviewId, []);
    repliesByReview.get(rep.reviewId)!.push(rep);
  }

  const bySection = new Map<string, Review[]>();
  for (const r of reviews) {
    if (!bySection.has(r.section)) bySection.set(r.section, []);
    bySection.get(r.section)!.push(r);
  }

  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const groups = [...bySection.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div>
          <p className="text-2xl font-extrabold text-foreground">{average.toFixed(1)}<span className="text-base font-semibold text-zinc-400"> / 5</span></p>
          <p className="text-xs text-zinc-400">{reviews.length} review{reviews.length === 1 ? "" : "s"} across {groups.length} topic{groups.length === 1 ? "" : "s"} in {city.name}</p>
        </div>
        <Stars rating={Math.round(average)} className="h-5 w-5" />
      </div>

      {/* Per-topic groups */}
      {groups.map(([section, sectionReviews]) => {
        const label = section === "reviews" ? "General" : citySections.find((s) => s.slug === section)?.label ?? section.replace(/-/g, " ");
        const sectionAvg = sectionReviews.reduce((s, r) => s + r.rating, 0) / sectionReviews.length;
        return (
          <div key={section} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground">
                {label} <span className="font-normal text-zinc-400">· {sectionReviews.length} review{sectionReviews.length === 1 ? "" : "s"} · avg {sectionAvg.toFixed(1)}/5</span>
              </h3>
              {section !== "reviews" && (
                <Link href={`/city/${city.slug}/${section}`} className="flex items-center gap-0.5 text-xs font-semibold text-brand">
                  Read &amp; reply in {label} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {sectionReviews.map((r) => {
                const revReplies = repliesByReview.get(r.id) ?? [];
                return (
                  <div key={r.id} className="rounded-xl border border-zinc-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{r.comment}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
                      <span>{new Date(r.date).toLocaleDateString()}</span>
                      {(r.likes ?? 0) > 0 && <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {r.likes}</span>}
                      {(r.dislikes ?? 0) > 0 && <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> {r.dislikes}</span>}
                      {revReplies.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {revReplies.length} repl{revReplies.length === 1 ? "y" : "ies"}</span>}
                    </div>
                    {revReplies.length > 0 && (
                      <div className="mt-2 space-y-1.5 border-l-2 border-zinc-100 pl-3">
                        {revReplies.map((rep) => (
                          <div key={rep.id} className="rounded-lg bg-zinc-50 px-3 py-1.5">
                            <p className="text-xs font-semibold text-foreground">{rep.name} <span className="ml-1 font-normal text-zinc-400">{new Date(rep.date).toLocaleDateString()}</span></p>
                            <p className="text-sm text-zinc-600">{rep.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-zinc-400">
        Want to react or reply to a topic review? Open that topic&apos;s page via the links above — reactions live where the
        review was posted. General reviews can be written right below.
      </p>
    </div>
  );
}
