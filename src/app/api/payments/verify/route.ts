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

  await paymentRef.update({
    status: "success",
    paystackReference: reference,
    verifiedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
