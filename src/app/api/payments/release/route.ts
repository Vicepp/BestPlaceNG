import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Releases escrowed rent to the landlord once the tenant has confirmed move-in.
 *
 * Trust model: this route does NOT trust the caller directly. It only releases
 * if the tenancy doc already has moveInConfirmed === true — and Firestore rules
 * let ONLY the tenant set that flag. So money can only move after the real
 * tenant has confirmed. The release is idempotent (guarded by escrowStatus).
 */
export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Payments not configured on the server." }, { status: 503 });
  }

  let tenancyId: string;
  try {
    ({ tenancyId } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  if (!tenancyId) return NextResponse.json({ ok: false, error: "Missing tenancyId" }, { status: 400 });

  const db = getAdminDb();
  const tSnap = await db.collection("tenancies").doc(tenancyId).get();
  if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Tenancy not found" }, { status: 404 });
  const tenancy = tSnap.data()!;

  if (tenancy.moveInConfirmed !== true) {
    return NextResponse.json({ ok: false, error: "Tenant has not confirmed move-in yet." }, { status: 409 });
  }

  const { FieldValue } = await import("firebase-admin/firestore");
  const now = new Date().toISOString();

  // Find held rent payments for this tenancy and release them.
  const heldSnap = await db
    .collection("payments")
    .where("tenancyId", "==", tenancyId)
    .where("escrowStatus", "==", "held")
    .get();

  if (heldSnap.empty) {
    return NextResponse.json({ ok: true, released: 0, message: "Nothing held to release." });
  }

  let releasedTotal = 0;
  const batch = db.batch();
  heldSnap.docs.forEach((d) => {
    releasedTotal += (d.data().amount as number) ?? 0;
    batch.update(d.ref, { escrowStatus: "released", releasedAt: now });
  });
  await batch.commit();

  // Move the released sum from held -> withdrawable balance on the landlord wallet.
  if (tenancy.landlordId && releasedTotal > 0) {
    await db.collection("wallets").doc(tenancy.landlordId as string).set(
      {
        landlordId: tenancy.landlordId,
        held: FieldValue.increment(-releasedTotal),
        balance: FieldValue.increment(releasedTotal),
        updatedAt: now,
      },
      { merge: true }
    );

    // Notify the landlord their money is now withdrawable.
    await db.collection("notifications").add({
      userId: tenancy.landlordId,
      type: "payment_received",
      title: "Funds released to your wallet 💰",
      body: `${tenancy.tenantName ?? "Your tenant"} confirmed move-in at ${tenancy.apartmentTitle}. ₦${releasedTotal.toLocaleString()} is now available to withdraw.`,
      link: "/dashboard/wallet",
      read: false,
      createdAt: now,
    });
  }

  return NextResponse.json({ ok: true, released: releasedTotal });
}
