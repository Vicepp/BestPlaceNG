import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured, verifyIdTokenFull } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Single admin API. All data flows through the Admin SDK (bypasses client
 * rules), gated by the `admins` collection:
 *   admins/{uid} = { role: "master"|"sub", permissions: string[] ("*" = all), email }
 * Pending sub-admin invites live in adminInvites/{email} and are claimed
 * automatically the first time that account calls op:"me".
 *
 * POST body: { op: "me" | "overview" | "data" | "action", ... }
 */

const SECTIONS = ["users", "tenancies", "payments", "kyc", "reports", "support", "listings", "reviews", "research", "admins"] as const;
type Section = (typeof SECTIONS)[number];

interface AdminRecord { role: "master" | "sub"; permissions: string[]; email?: string }

function can(admin: AdminRecord, section: string): boolean {
  return admin.role === "master" || admin.permissions.includes("*") || admin.permissions.includes(section);
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Admin backend not configured." }, { status: 503 });
  }
  const caller = await verifyIdTokenFull(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const op = body.op as string;

  try {
    const db = getAdminDb();

    // Resolve admin record; claim a pending email invite on first contact.
    const adminRef = db.collection("admins").doc(caller.uid);
    let adminSnap = await adminRef.get();
    if (!adminSnap.exists && caller.email) {
      const inviteRef = db.collection("adminInvites").doc(caller.email.toLowerCase());
      const invite = await inviteRef.get();
      if (invite.exists) {
        await adminRef.set({
          role: "sub",
          permissions: invite.data()!.permissions ?? [],
          email: caller.email,
          invitedBy: invite.data()!.invitedBy ?? null,
          createdAt: new Date().toISOString(),
        });
        await inviteRef.delete();
        adminSnap = await adminRef.get();
      }
    }
    if (!adminSnap.exists) {
      if (op === "me") return NextResponse.json({ ok: true, isAdmin: false });
      return NextResponse.json({ ok: false, error: "Not an admin" }, { status: 403 });
    }
    const admin = adminSnap.data() as AdminRecord;

    /* ── me ─────────────────────────────────────────────────── */
    if (op === "me") {
      return NextResponse.json({ ok: true, isAdmin: true, role: admin.role, permissions: admin.permissions });
    }

    /* ── overview: counts across the whole platform ───────────── */
    if (op === "overview") {
      const count = async (col: string) => (await db.collection(col).count().get()).data().count;
      const countWhere = async (col: string, f: string, opStr: FirebaseFirestore.WhereFilterOp, v: unknown) =>
        (await db.collection(col).where(f, opStr, v).count().get()).data().count;

      const [users, landlords, tenants, apartments, rented, tenanciesActive, tenanciesRequested,
        paySuccess, payPending, reportsOpen, ticketsOpen, kycSubmitted, reviews, dirListings,
        tours, citySnaps, stateSnaps] = await Promise.all([
        count("users"),
        countWhere("users", "role", "==", "landlord"),
        countWhere("users", "role", "==", "tenant"),
        count("apartments"),
        countWhere("apartments", "status", "==", "rented"),
        countWhere("tenancies", "status", "==", "active"),
        countWhere("tenancies", "status", "==", "requested"),
        countWhere("payments", "status", "==", "success"),
        countWhere("payments", "status", "==", "pending"),
        countWhere("reports", "status", "==", "open"),
        countWhere("supportTickets", "status", "==", "open"),
        countWhere("kyc", "status", "==", "submitted"),
        count("reviews"),
        count("directoryListings"),
        count("tourBookings"),
        count("cityResearch"),
        count("stateResearch"),
      ]);

      // Money aggregates + recent activity
      const paidSnap = await db.collection("payments").where("status", "==", "success").select("amount").get();
      const volume = paidSnap.docs.reduce((s, d) => s + (d.data().amount ?? 0), 0);
      const walletsSnap = await db.collection("wallets").select("held", "balance").get();
      const held = walletsSnap.docs.reduce((s, d) => s + (d.data().held ?? 0), 0);
      const balance = walletsSnap.docs.reduce((s, d) => s + (d.data().balance ?? 0), 0);

      const recentUsers = (await db.collection("users").orderBy("createdAt", "desc").limit(6).get()).docs
        .map((d) => ({ id: d.id, ...d.data() }));
      const recentPayments = (await db.collection("payments").orderBy("createdAt", "desc").limit(6).get()).docs
        .map((d) => ({ id: d.id, ...d.data() }));

      return NextResponse.json({
        ok: true,
        stats: {
          users, landlords, tenants, apartments, rented, tenanciesActive, tenanciesRequested,
          paySuccess, payPending, reportsOpen, ticketsOpen, kycSubmitted, reviews, dirListings,
          tours, research: citySnaps + stateSnaps, volume, escrowHeld: held, walletBalance: balance,
        },
        recentUsers, recentPayments,
      });
    }

    /* ── data: rows for one section ─────────────────────────── */
    if (op === "data") {
      const section = body.section as Section;
      if (!SECTIONS.includes(section)) return NextResponse.json({ ok: false, error: "Unknown section" }, { status: 400 });
      if (!can(admin, section)) return NextResponse.json({ ok: false, error: "You don't have permission for this section." }, { status: 403 });

      const grab = async (col: string, order?: string, limit = 300) => {
        let q: FirebaseFirestore.Query = db.collection(col);
        if (order) q = q.orderBy(order, "desc");
        return (await q.limit(limit).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
      };

      switch (section) {
        case "users": return NextResponse.json({ ok: true, rows: await grab("users", "createdAt") });
        case "tenancies": return NextResponse.json({ ok: true, rows: await grab("tenancies", "createdAt") });
        case "payments": return NextResponse.json({ ok: true, rows: await grab("payments", "createdAt") });
        case "kyc": {
          const rows = await grab("kyc");
          // enrich with account email/name
          const users = new Map((await db.collection("users").select("displayName", "email").get()).docs.map((d) => [d.id, d.data()]));
          return NextResponse.json({ ok: true, rows: rows.map((r) => ({ ...r, account: users.get(r.id) ?? null })) });
        }
        case "reports": return NextResponse.json({ ok: true, rows: await grab("reports", "createdAt") });
        case "support": return NextResponse.json({ ok: true, rows: await grab("supportTickets", "createdAt") });
        case "listings": {
          const [apartments, directory] = await Promise.all([grab("apartments", "createdAt", 200), grab("directoryListings", "createdAt", 200)]);
          return NextResponse.json({ ok: true, apartments, directory });
        }
        case "reviews": {
          const [city, user] = await Promise.all([grab("reviews", "date", 200), grab("userReviews", "date", 100)]);
          return NextResponse.json({ ok: true, city, user });
        }
        case "research": {
          const [city, state] = await Promise.all([grab("cityResearch", "createdAt", 100), grab("stateResearch", "createdAt", 100)]);
          return NextResponse.json({ ok: true, city, state });
        }
        case "admins": {
          if (admin.role !== "master") return NextResponse.json({ ok: false, error: "Master admin only." }, { status: 403 });
          const [admins, invites] = await Promise.all([grab("admins"), grab("adminInvites")]);
          return NextResponse.json({ ok: true, admins, invites });
        }
      }
    }

    /* ── action: mutations, permission-checked per target ─────── */
    if (op === "action") {
      const action = body.action as string;
      const id = body.id as string;
      const now = new Date().toISOString();

      switch (action) {
        case "report-status": {
          if (!can(admin, "reports")) break;
          await db.collection("reports").doc(id).update({ status: body.status, updatedAt: now, updatedBy: caller.uid });
          return NextResponse.json({ ok: true });
        }
        case "ticket-status": {
          if (!can(admin, "support")) break;
          await db.collection("supportTickets").doc(id).update({ status: body.status, updatedAt: now, updatedBy: caller.uid });
          return NextResponse.json({ ok: true });
        }
        case "kyc-verdict": {
          if (!can(admin, "kyc")) break;
          const verdict = body.verdict === "verified" ? "verified" : "rejected";
          await db.collection("kyc").doc(id).update({ status: verdict, reviewedAt: now, reviewedBy: caller.uid });
          await db.collection("users").doc(id).set({ kycStatus: verdict }, { merge: true });
          await db.collection("notifications").add({
            userId: id, type: "system", read: false, createdAt: now,
            title: verdict === "verified" ? "Identity verified ✓" : "KYC needs another look",
            body: verdict === "verified" ? "Your KYC has been approved — your account is now verified." : "We couldn't verify your KYC submission. Please re-check your details in Settings → KYC and resubmit.",
            link: "/dashboard/settings",
          });
          return NextResponse.json({ ok: true });
        }
        case "apartment-archive": {
          if (!can(admin, "listings")) break;
          await db.collection("apartments").doc(id).update({ status: "archived" });
          return NextResponse.json({ ok: true });
        }
        case "directory-delete": {
          if (!can(admin, "listings")) break;
          await db.collection("directoryListings").doc(id).delete();
          return NextResponse.json({ ok: true });
        }
        case "review-delete": {
          if (!can(admin, "reviews")) break;
          const col = body.kind === "user" ? "userReviews" : "reviews";
          await db.collection(col).doc(id).delete();
          return NextResponse.json({ ok: true });
        }
        case "invite-admin": {
          if (admin.role !== "master") break;
          const email = String(body.email ?? "").trim().toLowerCase();
          const permissions = Array.isArray(body.permissions) ? body.permissions : [];
          if (!email || permissions.length === 0) return NextResponse.json({ ok: false, error: "Email and at least one permission required." }, { status: 400 });
          // If the account exists, grant immediately; else store the invite.
          const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
          if (!userSnap.empty) {
            await db.collection("admins").doc(userSnap.docs[0].id).set({ role: "sub", permissions, email, invitedBy: caller.uid, createdAt: now });
            return NextResponse.json({ ok: true, granted: true });
          }
          await db.collection("adminInvites").doc(email).set({ permissions, invitedBy: caller.uid, createdAt: now });
          return NextResponse.json({ ok: true, granted: false });
        }
        case "update-admin": {
          if (admin.role !== "master") break;
          if (id === caller.uid) return NextResponse.json({ ok: false, error: "You can't edit your own master record." }, { status: 400 });
          await db.collection("admins").doc(id).update({ permissions: body.permissions ?? [] });
          return NextResponse.json({ ok: true });
        }
        case "remove-admin": {
          if (admin.role !== "master") break;
          if (id === caller.uid) return NextResponse.json({ ok: false, error: "You can't remove yourself." }, { status: 400 });
          await db.collection("admins").doc(id).delete();
          return NextResponse.json({ ok: true });
        }
        case "cancel-invite": {
          if (admin.role !== "master") break;
          await db.collection("adminInvites").doc(id).delete();
          return NextResponse.json({ ok: true });
        }
        default:
          return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: "You don't have permission for that action." }, { status: 403 });
    }

    return NextResponse.json({ ok: false, error: "Unknown op" }, { status: 400 });
  } catch (e) {
    console.error("[admin] failed:", e);
    return NextResponse.json({ ok: false, error: "Admin request failed — check server logs." }, { status: 500 });
  }
}
