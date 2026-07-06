import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured, verifyIdToken } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

/**
 * A tenant leaves/vacates a unit. Trusted server action because the tenant is
 * NOT the apartment's owner and so can't archive it under the security rules.
 *  1. Verify the caller's Firebase ID token = the tenant on the tenancy.
 *  2. End the tenancy.
 *  3. Send the apartment to the landlord's ARCHIVE (status "archived") — NOT
 *     back onto the public market. The landlord re-lists it manually.
 *  4. Notify the landlord.
 */
export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Not available right now." }, { status: 503 });
  }
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  let tenancyId: string;
  try {
    ({ tenancyId } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  if (!tenancyId) return NextResponse.json({ ok: false, error: "Missing tenancyId" }, { status: 400 });

  try {
    const db = getAdminDb();
    const tRef = db.collection("tenancies").doc(tenancyId);
    const tSnap = await tRef.get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Tenancy not found" }, { status: 404 });
    const tenancy = tSnap.data()!;
    if (tenancy.tenantId !== uid) {
      return NextResponse.json({ ok: false, error: "This isn't your tenancy." }, { status: 403 });
    }

    const now = new Date().toISOString();
    await tRef.update({ status: "ended", endedAt: now });

    if (tenancy.apartmentId) {
      // Archive (not relist) so the landlord chooses when to put it back up.
      await db.collection("apartments").doc(tenancy.apartmentId as string).update({ status: "archived" }).catch(() => {});
    }

    if (tenancy.landlordId) {
      await db.collection("notifications").add({
        userId: tenancy.landlordId,
        type: "tenancy",
        title: "A tenant has left",
        body: `${tenancy.tenantName ?? "Your tenant"} has left ${tenancy.apartmentTitle}. The unit is now in your Archive — re-list it from Properties when you're ready.`,
        link: "/dashboard/properties",
        read: false,
        createdAt: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tenancy/leave] failed:", e);
    return NextResponse.json({ ok: false, error: "Could not process leaving. Please try again." }, { status: 500 });
  }
}
