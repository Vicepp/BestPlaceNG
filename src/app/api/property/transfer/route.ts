import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured, verifyIdToken } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Transfer a unit (or a whole building) to another landlord — works even when
 * the unit is rented. Trusted server action because it must also reassign the
 * tenancies' landlordId (which security rules don't let a client change), so
 * the new owner manages the tenants and receives future rent.
 *
 * Body: { kind: "unit" | "building", id, newOwnerUid }
 * Auth: Bearer <tenant/landlord ID token> — must be the current owner.
 */
export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Transfers aren't available: the server is missing its Firebase Admin credentials (set FIREBASE_ADMIN_PRIVATE_KEY_BASE64 and redeploy)." }, { status: 503 });
  }
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  let kind: string, id: string, newOwnerUid: string;
  try {
    ({ kind, id, newOwnerUid } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  if (!id || !newOwnerUid || (kind !== "unit" && kind !== "building")) {
    return NextResponse.json({ ok: false, error: "Missing or invalid fields" }, { status: 400 });
  }
  if (newOwnerUid === uid) {
    return NextResponse.json({ ok: false, error: "You already own this." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const now = new Date().toISOString();

    // New owner details for denormalised display fields.
    const ownerSnap = await db.collection("users").doc(newOwnerUid).get();
    if (!ownerSnap.exists) return NextResponse.json({ ok: false, error: "Recipient account not found." }, { status: 404 });
    const newOwner = ownerSnap.data()!;
    const ownerFields = { ownerId: newOwnerUid, ownerName: newOwner.displayName ?? null, businessName: newOwner.businessName ?? null };

    // Collect the apartment ids being transferred (one unit, or all units in a building).
    let apartmentIds: string[] = [];
    let label = "";
    if (kind === "unit") {
      const aRef = db.collection("apartments").doc(id);
      const aSnap = await aRef.get();
      if (!aSnap.exists) return NextResponse.json({ ok: false, error: "Unit not found" }, { status: 404 });
      if (aSnap.data()!.ownerId !== uid) return NextResponse.json({ ok: false, error: "You don't own this unit." }, { status: 403 });
      await aRef.update({ ...ownerFields, propertyId: null, propertyName: null });
      apartmentIds = [id];
      label = aSnap.data()!.title ?? "a unit";
    } else {
      const pRef = db.collection("properties").doc(id);
      const pSnap = await pRef.get();
      if (!pSnap.exists) return NextResponse.json({ ok: false, error: "Building not found" }, { status: 404 });
      if (pSnap.data()!.ownerId !== uid) return NextResponse.json({ ok: false, error: "You don't own this building." }, { status: 403 });
      await pRef.update({ ownerId: newOwnerUid, ownerName: newOwner.displayName ?? null, businessName: newOwner.businessName ?? null });
      label = pSnap.data()!.name ?? "a building";
      const unitsSnap = await db.collection("apartments").where("propertyId", "==", id).get();
      const batch = db.batch();
      unitsSnap.docs.forEach((d) => { batch.update(d.ref, ownerFields); apartmentIds.push(d.id); });
      await batch.commit();
    }

    // Reassign the landlord on any live tenancies for those apartments, and
    // remember which tenants to notify. (This is the "tenant comes with it" step.)
    let movedTenancies = 0;
    const affectedTenants: { tenantId: string; apartmentTitle: string }[] = [];
    for (const aptId of apartmentIds) {
      const tenSnap = await db.collection("tenancies").where("apartmentId", "==", aptId).get();
      const batch = db.batch();
      let inBatch = 0;
      tenSnap.docs.forEach((d) => {
        const t = d.data();
        if (t.status === "active" || t.status === "requested" || t.status === "invited") {
          batch.update(d.ref, { landlordId: newOwnerUid });
          inBatch++;
          if (t.tenantId) affectedTenants.push({ tenantId: t.tenantId as string, apartmentTitle: (t.apartmentTitle as string) ?? "your home" });
        }
      });
      if (inBatch > 0) { await batch.commit(); movedTenancies += inBatch; }
    }

    // Everything past this point is best-effort: the ownership + tenancy moves
    // above are what matter, so a failed notification/chat update must not fail
    // (or roll back) the transfer.
    const sideEffects: Promise<unknown>[] = [];

    // Move each property group chat to the new landlord so they're immediately
    // connected to the tenant (swap the old owner out of the participants).
    for (const aptId of apartmentIds) {
      sideEffects.push(
        db.collection("conversations").where("apartmentId", "==", aptId).get().then(async (convSnap) => {
          for (const c of convSnap.docs) {
            const data = c.data();
            const ids: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];
            if (!ids.includes(uid)) continue; // only chats the old owner was in
            const names: Record<string, string> = { ...(data.participantNames ?? {}) };
            delete names[uid];
            names[newOwnerUid] = (newOwner.displayName as string) ?? "Landlord";
            const nextIds = Array.from(new Set(ids.filter((p) => p !== uid).concat(newOwnerUid)));
            await c.ref.update({ participantIds: nextIds, participantNames: names });
          }
        })
      );
    }

    // Tell each affected tenant their property has a new manager.
    for (const t of affectedTenants) {
      sideEffects.push(
        db.collection("notifications").add({
          userId: t.tenantId,
          type: "tenancy",
          title: "Your property has a new manager",
          body: `${newOwner.displayName ?? "A new landlord"} now manages ${t.apartmentTitle}. Your tenancy, rent and payments continue as before.`,
          link: "/dashboard",
          read: false,
          createdAt: now,
        })
      );
    }

    // Notify the new owner.
    sideEffects.push(
      db.collection("notifications").add({
        userId: newOwnerUid,
        type: "system",
        title: "A property was transferred to you",
        body: `You now own ${label}${movedTenancies > 0 ? ` (with ${movedTenancies} active tenant${movedTenancies !== 1 ? "s" : ""})` : ""}. Find it under Properties.`,
        link: "/dashboard/properties",
        read: false,
        createdAt: now,
      })
    );

    const settled = await Promise.allSettled(sideEffects);
    settled.forEach((r) => { if (r.status === "rejected") console.error("[property/transfer] side-effect failed:", r.reason); });

    return NextResponse.json({ ok: true, units: apartmentIds.length, tenancies: movedTenancies });
  } catch (e) {
    console.error("[property/transfer] failed:", e);
    return NextResponse.json({ ok: false, error: "Transfer failed. Please try again." }, { status: 500 });
  }
}
