export function isPaystackConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);
}

/** Calls the server verify route safely — always resolves (never hangs), with a
 * 25s client timeout, so a payment popup can never leave the UI stuck on a
 * "Confirming payment…" spinner. */
export async function verifyPayment(reference: string, paymentId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, paymentId }),
      signal: AbortSignal.timeout(25000),
    });
    const json = await res.json().catch(() => null);
    if (json && typeof json.ok === "boolean") return json;
    return { ok: false, error: `Verification failed (HTTP ${res.status}).` };
  } catch (e) {
    const msg = (e as Error)?.name === "TimeoutError"
      ? "Confirming the payment took too long. If you were charged it will reflect shortly — refresh your dashboard."
      : "Couldn't reach the server to confirm payment. If you were charged, refresh in a moment.";
    return { ok: false, error: msg };
  }
}

/** Opens the Paystack Inline payment popup. Loads the script on first call (lazy), so no extra
 * script tag needed in layout.tsx. Calls onSuccess with the Paystack transaction reference when
 * the user completes payment in the popup. */
export function payWithPaystack({
  email,
  amountNaira,
  reference,
  paymentId,
  onSuccess,
  onClose,
}: {
  email: string;
  amountNaira: number;
  reference: string;
  paymentId: string;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}) {
  if (!isPaystackConfigured()) {
    console.error("[paystack] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set");
    return;
  }

  function open() {
    const handler = (window as unknown as Record<string, unknown>).PaystackPop as {
      setup: (cfg: unknown) => { openIframe: () => void };
    };
    const popup = handler.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amountNaira * 100),
      currency: "NGN",
      ref: reference,
      metadata: { paymentId },
      callback: (response: { reference: string }) => onSuccess(response.reference),
      onClose: onClose,
    });
    popup.openIframe();
  }

  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).PaystackPop) {
    open();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://js.paystack.co/v1/inline.js";
  script.async = true;
  script.onload = open;
  document.body.appendChild(script);
}
