/** Provider-agnostic payment facade: Flutterwave and Paystack behind one API.
 *
 * When both are configured, Flutterwave is preferred (set it up second, so if
 * it's present it's because Paystack wasn't working). The success token passed
 * to onSuccess encodes everything the verify route needs, so call sites treat
 * it as an opaque string: `verifyPayment(token, paymentId)`.
 */
import { isPaystackConfigured as psConfigured, payWithPaystack } from "@/lib/paystack";

export function isFlutterwaveConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY);
}

export function isPaymentConfigured(): boolean {
  return isFlutterwaveConfigured() || psConfigured();
}

export function activeProvider(): "flutterwave" | "paystack" | null {
  if (isFlutterwaveConfigured()) return "flutterwave";
  if (psConfigured()) return "paystack";
  return null;
}

/** Calls the server verify route safely — always resolves (never hangs). The
 * token is either a raw Paystack reference or "flw:<transactionId>:<txRef>". */
export async function verifyPayment(token: string, paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, string> = { paymentId };
  if (token.startsWith("flw:")) {
    const [, transactionId, ...refParts] = token.split(":");
    body.provider = "flutterwave";
    body.transactionId = transactionId;
    body.reference = refParts.join(":");
  } else {
    body.provider = "paystack";
    body.reference = token;
  }
  try {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    const json = await res.json().catch(() => null);
    if (json && typeof json.ok === "boolean") return json;
    return { ok: false, error: `Couldn't confirm the payment (HTTP ${res.status}). If you were charged it will reflect shortly — refresh your dashboard in a moment.` };
  } catch (e) {
    const msg = (e as Error)?.name === "TimeoutError"
      ? "Confirming the payment took too long. If you were charged it will reflect shortly — refresh your dashboard."
      : "Couldn't reach the server to confirm payment. If you were charged, refresh in a moment.";
    return { ok: false, error: msg };
  }
}

/** Verify a hotel-booking payment (one payment may cover several units). */
export async function verifyBookingPayment(token: string, bookingIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, unknown> = { bookingIds };
  if (token.startsWith("flw:")) {
    const [, transactionId, ...refParts] = token.split(":");
    body.provider = "flutterwave";
    body.transactionId = transactionId;
    body.reference = refParts.join(":");
  } else {
    body.provider = "paystack";
    body.reference = token;
  }
  try {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    const json = await res.json().catch(() => null);
    if (json && typeof json.ok === "boolean") return json;
    return { ok: false, error: `Couldn't confirm the payment (HTTP ${res.status}). If you were charged it will reflect shortly.` };
  } catch {
    return { ok: false, error: "Couldn't reach the server to confirm payment. If you were charged, refresh in a moment." };
  }
}

interface StartArgs {
  email: string;
  name?: string;
  amountNaira: number;
  reference: string;
  paymentId: string;
  onSuccess: (token: string) => void;
  onClose?: () => void;
}

/** Opens the checkout popup of whichever provider is configured. */
export function startPayment(args: StartArgs) {
  if (isFlutterwaveConfigured()) return payWithFlutterwave(args);
  return payWithPaystack(args); // facade keeps Paystack's exact signature
}

function payWithFlutterwave({ email, name, amountNaira, reference, paymentId, onSuccess, onClose }: StartArgs) {
  function open() {
    const checkout = (window as unknown as Record<string, unknown>).FlutterwaveCheckout as (cfg: unknown) => void;
    checkout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: reference,
      amount: amountNaira,
      currency: "NGN",
      customer: { email, name: name || email },
      meta: { paymentId },
      customizations: { title: "BestPlaceNG", description: "Rent payment (escrow protected)" },
      callback: (data: { status: string; transaction_id: number | string; tx_ref: string }) => {
        if (data.status === "successful" || data.status === "completed") {
          onSuccess(`flw:${data.transaction_id}:${data.tx_ref}`);
        } else {
          onClose?.();
        }
      },
      onclose: onClose,
    });
  }

  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).FlutterwaveCheckout) {
    open();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://checkout.flutterwave.com/v3.js";
  script.async = true;
  script.onload = open;
  document.body.appendChild(script);
}
