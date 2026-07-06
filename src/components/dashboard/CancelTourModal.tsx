"use client";

import { useState } from "react";
import { X, CalendarX } from "lucide-react";
import { cancelTour, formatSlot, TOUR_CANCEL_REASONS, type TourBooking } from "@/data/tours";
import { getOrCreateDirectConversation, sendMessage } from "@/data/conversations";
import { createNotification } from "@/data/notifications";

/** Landlord-facing dialog to cancel a booked tour with a reason. The reason is
 * sent straight to the tenant as a DM plus a notification. */
export default function CancelTourModal({
  booking,
  landlordUid,
  landlordName,
  onCancelled,
  onClose,
}: {
  booking: TourBooking;
  landlordUid: string;
  landlordName: string;
  onCancelled: (id: string) => void;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState(TOUR_CANCEL_REASONS[0]);
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOther = choice === "Other";

  async function confirm() {
    const reason = isOther ? custom.trim() : choice;
    if (!reason) { setError("Please type a reason so the tenant understands."); return; }
    setSubmitting(true);
    setError("");

    const res = await cancelTour(booking.id, reason);
    if (!res.ok) { setSubmitting(false); setError(res.error ?? "Couldn't cancel that tour."); return; }

    const when = `${new Date(booking.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at ${formatSlot(booking.time)}`;
    const message = `Hi ${booking.tenantName}, I've had to cancel your tour of "${booking.apartmentTitle}" scheduled for ${when}. Reason: ${reason}`;

    // DM the tenant with the reason (best-effort), then notify them.
    try {
      const convoId = await getOrCreateDirectConversation(
        landlordUid,
        landlordName,
        booking.tenantId,
        booking.tenantName,
        { id: booking.apartmentId, title: booking.apartmentTitle }
      );
      await sendMessage(convoId, landlordUid, landlordName, message);
    } catch { /* notification below still informs them */ }

    createNotification({
      userId: booking.tenantId,
      type: "message",
      title: "Your tour was cancelled",
      body: `${booking.apartmentTitle} — ${when}. Reason: ${reason}`,
      link: "/dashboard/messages",
    }).catch(() => {});

    setSubmitting(false);
    onCancelled(booking.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><CalendarX className="h-5 w-5 text-red-500" /> Cancel this tour</h2>
            <p className="text-xs text-zinc-400">{booking.apartmentTitle} · {new Date(booking.date).toLocaleDateString()} at {formatSlot(booking.time)}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <p className="mb-3 text-sm text-zinc-500">We&apos;ll message {booking.tenantName} with the reason you pick.</p>

        <label className="mb-1 block text-xs font-semibold text-zinc-500">Reason</label>
        <select value={choice} onChange={(e) => setChoice(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand">
          {TOUR_CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {isOther && (
          <textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={3}
            placeholder="Type your reason for the tenant…"
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        )}

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 hover:border-zinc-300">
            Keep tour
          </button>
          <button onClick={confirm} disabled={submitting}
            className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60">
            {submitting ? "Cancelling…" : "Cancel & notify"}
          </button>
        </div>
      </div>
    </div>
  );
}
