import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Payments not configured on the server." }, { status: 503 });
  }
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Paystack not configured on the server." }, { status: 503 });
  }

  let reference: string, paymentId: string;
  try {
    const body = await req.json();
    reference = body?.reference;
    paymentId = body?.paymentId;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  if (!reference || !paymentId) {
    return NextResponse.json({ ok: false, error: "Missing reference or paymentId" }, { status: 400 });
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const verifyJson = await verifyRes.json().catch(() => null);

  if (!verifyRes.ok || verifyJson?.data?.status !== "success") {
    return NextResponse.json({ ok: false, error: "Payment not verified" }, { status: 402 });
  }

  const db = getAdminDb();
  const paymentRef = db.collection("payments").doc(paymentId);
  const snap = await paymentRef.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Payment invoice not found" }, { status: 404 });
  }

  const expectedKobo = Math.round((snap.data()!.amount as number) * 100);
  if (verifyJson.data.amount !== expectedKobo) {
    return NextResponse.json({ ok: false, error: "Amount mismatch — transaction amount does not match invoice" }, { status: 409 });
  }
  if (verifyJson.data.currency && verifyJson.data.currency !== "NGN") {
    return NextResponse.json({ ok: false, error: "Currency mismatch — expected NGN" }, { status: 409 });
  }

  const payment = snap.data()!;
  const now = new Date().toISOString();

  await paymentRef.update({
    status: "success",
    escrowStatus: "held", // funds held in escrow until the tenant confirms move-in
    paystackReference: reference,
    verifiedAt: now,
  });

  // Paying is what makes someone a tenant: activate the tenancy if it isn't already,
  // and take the apartment off the public market (status -> "rented").
  if (payment.tenancyId) {
    try {
      const tenancyRef = db.collection("tenancies").doc(payment.tenancyId as string);
      const tSnap = await tenancyRef.get();
      if (tSnap.exists && tSnap.data()!.status !== "active") {
        await tenancyRef.update({ status: "active", activatedAt: now });
      }
    } catch (e) {
      console.error("[verify] tenancy activation failed:", e);
    }
  }
  if (payment.apartmentId) {
    try {
      await db.collection("apartments").doc(payment.apartmentId as string).update({ status: "rented" });
    } catch (e) {
      console.error("[verify] apartment mark-rented failed:", e);
    }
  }

  // Escrow: credit the landlord's HELD balance (not withdrawable yet). It only
  // moves to the withdrawable balance once the tenant confirms move-in, via
  // /api/payments/release. Atomic increment so concurrent payments can't clobber.
  if (payment.landlordId) {
    try {
      const { FieldValue } = await import("firebase-admin/firestore");
      const walletRef = db.collection("wallets").doc(payment.landlordId as string);
      await walletRef.set(
        {
          landlordId: payment.landlordId,
          held: FieldValue.increment(payment.amount as number),
          totalReceived: FieldValue.increment(payment.amount as number),
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (e) {
      console.error("[verify] wallet escrow credit failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
