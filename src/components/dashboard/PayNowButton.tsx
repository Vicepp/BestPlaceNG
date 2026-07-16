"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isPaymentConfigured, startPayment, verifyPayment } from "@/lib/payments";
import { formatNaira } from "@/data/apartments";
import type { Payment } from "@/data/payments";

export default function PayNowButton({ payment, onSuccess }: { payment: Payment; onSuccess?: () => void }) {
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!isPaymentConfigured()) {
    return (
      <span className="text-xs text-zinc-400">
        (Payments not configured yet)
      </span>
    );
  }

  if (done) {
    return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Paid</span>;
  }

  async function handleClick() {
    if (!user?.email) return;
    setError("");
    const reference = `bpng-${payment.id}-${Date.now()}`;
    startPayment({
      email: user.email,
      amountNaira: payment.amount,
      reference,
      paymentId: payment.id,
      onSuccess: async (ref) => {
        setVerifying(true);
        const json = await verifyPayment(ref, payment.id);
        setVerifying(false);
        if (json.ok) {
          setDone(true);
          onSuccess?.();
        } else {
          setError(json.error ?? "Verification failed. Please contact your landlord.");
        }
      },
      onClose: () => setVerifying(false),
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={verifying}
        className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {verifying ? "Verifying..." : `Pay ${formatNaira(payment.amount)}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
