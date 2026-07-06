"use client";

import { useState } from "react";
import { X, ArrowRightLeft, UserCheck } from "lucide-react";
import { getUserByEmail } from "@/data/users";
import type { UserProfile } from "@/context/AuthContext";

/** Reusable "transfer to another landlord" dialog. Looks up the recipient by
 * email, shows who they are, then calls onConfirm with their profile. */
export default function TransferModal({
  title,
  subtitle,
  currentUid,
  onConfirm,
  onClose,
}: {
  title: string;
  subtitle: string;
  currentUid: string;
  onConfirm: (recipient: UserProfile) => Promise<void>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState("");

  async function lookup() {
    setError(""); setFound(null);
    if (!email.trim()) return;
    setChecking(true);
    const u = await getUserByEmail(email);
    setChecking(false);
    if (!u) { setError("No BestPlaceNG account uses that email. Ask them to sign up first."); return; }
    if (u.uid === currentUid) { setError("That's your own account."); return; }
    setFound(u);
  }

  async function confirm() {
    if (!found) return;
    setTransferring(true);
    await onConfirm(found);
    setTransferring(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><ArrowRightLeft className="h-5 w-5 text-brand" /> {title}</h2>
            <p className="text-xs text-zinc-400">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <label className="mb-1 block text-xs font-semibold text-zinc-500">New owner&apos;s email</label>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFound(null); }}
            placeholder="landlord@email.com"
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button onClick={lookup} disabled={checking} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand disabled:opacity-60">
            {checking ? "…" : "Find"}
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        {found && (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand-light p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark"><UserCheck className="h-4 w-4" /> {found.displayName || found.email}</p>
            <p className="text-xs text-zinc-500">{found.email}{found.businessName ? ` · ${found.businessName}` : ""}</p>
            <p className="mt-2 text-xs text-zinc-500">Transferring is permanent — you&apos;ll no longer manage this once done.</p>
            <button onClick={confirm} disabled={transferring} className="mt-3 w-full rounded-full bg-brand py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
              {transferring ? "Transferring…" : `Transfer to ${found.displayName || "this landlord"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
