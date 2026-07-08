"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, X, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fileListingReport } from "@/data/reports";
import type { DirectoryListing } from "@/data/directoryListings";

const REPORT_REASONS = [
  "Information is wrong or outdated",
  "This place has closed down",
  "It's a scam or fake listing",
  "Inappropriate or offensive content",
  "Duplicate listing",
  "Other",
];

/** "Report this listing" — flags a public directory entry to the admin. */
export default function ReportListingButton({ listing }: { listing: DirectoryListing }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!user) return;
    if (reason === "Other" && !message.trim()) { setError("Please describe the problem."); return; }
    setError("");
    setSending(true);
    const res = await fileListingReport({
      reporterId: user.uid,
      reporterName: profile?.displayName ?? user.email ?? "User",
      reporterEmail: user.email ?? "",
      listingId: listing.id,
      listingName: listing.name,
      listingCategory: listing.category,
      citySlug: listing.citySlug,
      reason,
      message: message.trim(),
    });
    setSending(false);
    if (res.ok) setSent(true);
    else setError(res.error ?? "Couldn't send the report. Try again.");
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-red-500">
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="py-6 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
                <p className="text-sm font-bold text-foreground">Report sent</p>
                <p className="mt-1 text-sm text-zinc-500">Thanks for keeping the directory accurate — our team will review &ldquo;{listing.name}&rdquo;.</p>
                <button onClick={() => { setOpen(false); setSent(false); setMessage(""); }} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">Done</button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Flag className="h-5 w-5 text-red-500" /> Report listing</h2>
                    <p className="text-xs text-zinc-400">{listing.name}</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>

                {!user ? (
                  <div className="rounded-xl bg-zinc-50 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-600">Log in to report a listing — it takes a minute.</p>
                    <Link href="/login" className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Log in</Link>
                  </div>
                ) : (
                  <>
                    <label className="mb-1 block text-xs font-semibold text-zinc-500">What&apos;s wrong?</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                      {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                      placeholder={reason === "Other" ? "Describe the problem…" : "Any extra details (optional)…"}
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                    <button onClick={submit} disabled={sending}
                      className="mt-3 w-full rounded-full bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">
                      {sending ? "Sending…" : "Send report"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
