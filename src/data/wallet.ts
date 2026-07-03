/**
 * Landlord wallet (Option B — escrow + Paystack Transfers).
 *
 * Money flow:
 *  1. Tenant pays  -> funds land in the platform Paystack account; verify route
 *     credits wallet.held (escrow), NOT the withdrawable balance.
 *  2. Tenant confirms move-in -> release route moves held -> balance.
 *  3. Landlord withdraws -> transfer route pushes balance to their bank via
 *     the Paystack Transfer API and decrements balance.
 *
 * The wallet doc is admin-write-only (see firestore.rules); the landlord can
 * only read their own. Bank/payout details live on the same doc and ARE
 * landlord-writable through a narrow rule (payout fields only).
 */
import { getFirestoreDoc } from "@/lib/firestoreData";
import { setFirestoreDoc, type WriteResult } from "@/lib/firestoreWrite";

export interface BankDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface Wallet {
  landlordId: string;
  /** Withdrawable balance (released from escrow). */
  balance: number;
  /** Held in escrow — paid by tenants but not yet released (awaiting move-in). */
  held: number;
  /** Lifetime gross received. */
  totalReceived: number;
  /** Lifetime withdrawn to bank. */
  totalWithdrawn?: number;
  bank?: BankDetails;
  updatedAt?: string;
}

export async function getWallet(landlordId: string): Promise<Wallet> {
  const w = await getFirestoreDoc<Wallet>("wallets", landlordId);
  return (
    w ?? { landlordId, balance: 0, held: 0, totalReceived: 0, totalWithdrawn: 0 }
  );
}

/** Landlord saves their payout bank details (narrow rule allows only the `bank` field). */
export async function savePayoutBank(landlordId: string, bank: BankDetails): Promise<WriteResult> {
  return setFirestoreDoc("wallets", landlordId, { bank, landlordId });
}

/** A short list of major Nigerian banks with Paystack (NIP) codes for the payout dropdown. */
export const NIGERIAN_BANKS: { name: string; code: string }[] = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank For Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];
