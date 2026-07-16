import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
// Give the function real headroom (used where the platform plan allows it) so a
// slightly slow Paystack call or Firestore write can't trip the default limit
// and return a non-JSON 500. The work itself targets ~1-2s with REST transport.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Payments not configured on the server." }, { status: 503 });
  }
  let reference: string, paymentId: string, provider: string, transactionId: string;
  try {
    const body = await req.json();
    reference = body?.reference;
    paymentId = body?.paymentId;
    provider = body?.provider === "flutterwave" ? "flutterwave" : "paystack";
    transactionId = body?.transactionId ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  if (!reference || !paymentId) {
    return NextResponse.json({ ok: false, error: "Missing reference or paymentId" }, { status: 400 });
  }
  if (provider === "flutterwave") {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: "Flutterwave not configured on the server." }, { status: 503 });
    }
    if (!transactionId) {
      return NextResponse.json({ ok: false, error: "Missing Flutterwave transactionId" }, { status: 400 });
    }
  } else if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Paystack not configured on the server." }, { status: 503 });
  }

  // Everything below is wrapped so the client ALWAYS gets JSON back — a thrown
  // error here (bad admin creds, Paystack timeout, Firestore error) must never
  // leave the caller's "Confirming payment…" spinner hanging forever.
  try {
    // Run the two independent network reads concurrently — verifying with
    // Paystack and loading the invoice don't depend on each other, so overlapping
    // them roughly halves the route's latency.
    const db = getAdminDb();
    const paymentRef = db.collection("payments").doc(paymentId);
    const verifyUrl =
      provider === "flutterwave"
        ? `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`
        : `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
    const secret = (provider === "flutterwave" ? process.env.FLUTTERWAVE_SECRET_KEY : process.env.PAYSTACK_SECRET_KEY)!.trim();
    const [verifyRes, snap] = await Promise.all([
      fetch(verifyUrl, {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(15000),
      }),
      paymentRef.get(),
    ]);
    const verifyJson = await verifyRes.json().catch(() => null);

    const providerOk =
      provider === "flutterwave"
        ? verifyRes.ok && verifyJson?.status === "success" && verifyJson?.data?.status === "successful" && verifyJson?.data?.tx_ref === reference
        : verifyRes.ok && verifyJson?.data?.status === "success";
    if (!providerOk) {
      return NextResponse.json({ ok: false, error: `Payment not verified by ${provider === "flutterwave" ? "Flutterwave" : "Paystack"}.` }, { status: 402 });
    }

    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Payment invoice not found" }, { status: 404 });
    }

    // Already verified? Return success idempotently (avoids double-processing).
    if (snap.data()!.status === "success") {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    // Amount check: Paystack reports kobo, Flutterwave reports naira.
    const expectedNaira = snap.data()!.amount as number;
    const chargedOk =
      provider === "flutterwave"
        ? Number(verifyJson.data.amount) >= expectedNaira
        : verifyJson.data.amount === Math.round(expectedNaira * 100);
    if (!chargedOk) {
      return NextResponse.json({ ok: false, error: "Amount mismatch — transaction amount does not match invoice" }, { status: 409 });
    }
    if (verifyJson.data.currency && verifyJson.data.currency !== "NGN") {
      return NextResponse.json({ ok: false, error: "Currency mismatch — expected NGN" }, { status: 409 });
    }

    const payment = snap.data()!;
    const now = new Date().toISOString();

    // The one write that must succeed before we tell the client "paid".
    await paymentRef.update({
      status: "success",
      escrowStatus: "held", // funds held in escrow until the tenant confirms move-in
      provider,
      providerReference: reference,
      ...(provider === "paystack" ? { paystackReference: reference } : { flutterwaveTransactionId: transactionId }),
      verifiedAt: now,
    });

    // The follow-on effects are independent of each other, so run them
    // concurrently and don't let a slow/failed one hold up (or fail) the
    // response — the payment is already recorded as successful. Each is
    // best-effort and its own errors are swallowed by allSettled.
    const { FieldValue } = await import("firebase-admin/firestore");
    const sideEffects: Promise<unknown>[] = [];

    // Paying is what makes someone a tenant: activate the tenancy if not already.
    if (payment.tenancyId) {
      sideEffects.push(
        db.collection("tenancies").doc(payment.tenancyId as string).get().then((tSnap) => {
          if (tSnap.exists && tSnap.data()!.status !== "active") {
            return db.collection("tenancies").doc(payment.tenancyId as string).update({ status: "active", activatedAt: now });
          }
        })
      );
    }
    // Take the apartment off the public market.
    if (payment.apartmentId) {
      sideEffects.push(db.collection("apartments").doc(payment.apartmentId as string).update({ status: "rented" }));
    }
    // Escrow: credit the landlord's HELD balance (not withdrawable until the
    // tenant confirms move-in, via /api/payments/release). Atomic increment.
    if (payment.landlordId) {
      sideEffects.push(
        db.collection("wallets").doc(payment.landlordId as string).set(
          {
            landlordId: payment.landlordId,
            held: FieldValue.increment(payment.amount as number),
            totalReceived: FieldValue.increment(payment.amount as number),
            updatedAt: now,
          },
          { merge: true }
        )
      );
    }

    const results = await Promise.allSettled(sideEffects);
    results.forEach((r) => { if (r.status === "rejected") console.error("[verify] side-effect failed:", r.reason); });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[verify] fatal error:", e);
    const msg = (e as Error)?.name === "TimeoutError"
      ? "Payment verification timed out. If you were charged, it will reflect shortly — please refresh."
      : "Could not confirm the payment on the server. If you were charged, contact support with your reference.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
