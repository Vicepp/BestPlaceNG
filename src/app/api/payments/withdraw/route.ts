import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured, verifyIdToken } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

const PAYSTACK = "https://api.paystack.co";

/**
 * Landlord withdrawal via the Paystack Transfer API (Option B).
 *  1. Verify the caller's Firebase ID token -> uid = landlord.
 *  2. Read their wallet: must have balance > 0 and saved bank details.
 *  3. Create (or reuse) a Paystack transfer recipient for their bank account.
 *  4. Initiate a transfer of the full balance from the platform Paystack balance.
 *  5. On success, zero the wallet balance, bump totalWithdrawn, log a withdrawal.
 *
 * Note: in Paystack TEST mode transfers simulate success; in live mode the
 * business must have transfers enabled and sufficient settled balance.
 */
export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "Payouts not configured on the server." }, { status: 503 });
  }
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Paystack not configured on the server." }, { status: 503 });
  }

  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const db = getAdminDb();
  const walletRef = db.collection("wallets").doc(uid);
  const wSnap = await walletRef.get();
  const wallet = wSnap.exists ? wSnap.data()! : null;

  const balance = (wallet?.balance as number) ?? 0;
  const bank = wallet?.bank as { bankCode?: string; accountNumber?: string; accountName?: string } | undefined;

  if (balance <= 0) return NextResponse.json({ ok: false, error: "No withdrawable balance yet." }, { status: 400 });
  if (!bank?.bankCode || !bank?.accountNumber) {
    return NextResponse.json({ ok: false, error: "Add your bank account in Payout settings first." }, { status: 400 });
  }

  const auth = { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" };

  try {
    // 1. Transfer recipient (reuse stored code if present)
    let recipientCode = wallet?.recipientCode as string | undefined;
    if (!recipientCode) {
      const recRes = await fetch(`${PAYSTACK}/transferrecipient`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          type: "nuban",
          name: bank.accountName ?? "Landlord",
          account_number: bank.accountNumber,
          bank_code: bank.bankCode,
          currency: "NGN",
        }),
      });
      const recJson = await recRes.json();
      if (!recRes.ok || !recJson?.data?.recipient_code) {
        return NextResponse.json({ ok: false, error: recJson?.message ?? "Could not verify bank account." }, { status: 400 });
      }
      recipientCode = recJson.data.recipient_code as string;
      await walletRef.set({ recipientCode }, { merge: true });
    }

    // 2. Initiate transfer (amount in kobo)
    const trRes = await fetch(`${PAYSTACK}/transfer`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(balance * 100),
        recipient: recipientCode,
        reason: "BestPlaceNG rent payout",
      }),
    });
    const trJson = await trRes.json();
    // Paystack returns status "success" (test) or "pending"/"otp" (live). Treat non-failed as accepted.
    if (!trRes.ok || trJson?.status === false) {
      return NextResponse.json({ ok: false, error: trJson?.message ?? "Transfer could not be initiated." }, { status: 402 });
    }

    const now = new Date().toISOString();
    const { FieldValue } = await import("firebase-admin/firestore");
    await walletRef.set(
      {
        balance: 0,
        totalWithdrawn: FieldValue.increment(balance),
        updatedAt: now,
      },
      { merge: true }
    );
    await db.collection("withdrawals").add({
      landlordId: uid,
      amount: balance,
      reference: trJson?.data?.reference ?? null,
      transferCode: trJson?.data?.transfer_code ?? null,
      status: trJson?.data?.status ?? "pending",
      createdAt: now,
    });

    return NextResponse.json({ ok: true, amount: balance, status: trJson?.data?.status ?? "pending" });
  } catch (e) {
    console.error("[withdraw] failed:", e);
    return NextResponse.json({ ok: false, error: "Withdrawal failed. Please try again." }, { status: 500 });
  }
}
