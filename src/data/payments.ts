import { addFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";

export type PaymentStatus = "pending" | "success" | "failed";
/** Escrow state of a successful payment:
 *  - "held": money confirmed by Paystack but sitting in the platform account,
 *    NOT yet released to the landlord (waiting for the tenant to confirm move-in).
 *  - "released": tenant confirmed move-in, funds moved to the landlord's
 *    withdrawable wallet balance. */
export type EscrowStatus = "held" | "released";
/** Whether this payment is the move-in rent or a recurring utility charge. */
export type PaymentKind = "rent" | "utility";

export interface Payment {
  id: string;
  tenancyId: string;
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  amount: number;
  currency: "NGN";
  status: PaymentStatus;
  kind?: PaymentKind;
  escrowStatus?: EscrowStatus;
  paystackReference?: string;
  dueDate: string;
  createdAt: string;
  verifiedAt?: string;
  releasedAt?: string;
}

/** Landlord generates a rent invoice (a "pending" payment) for one of their active tenancies. */
export async function generateInvoice(params: {
  tenancyId: string;
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  amount: number;
  dueDate: string;
}): Promise<WriteResult> {
  return addFirestoreDoc("payments", {
    tenancyId: params.tenancyId,
    apartmentId: params.apartmentId,
    apartmentTitle: params.apartmentTitle,
    landlordId: params.landlordId,
    tenantId: params.tenantId,
    amount: params.amount,
    currency: "NGN",
    status: "pending",
    dueDate: params.dueDate,
    createdAt: new Date().toISOString(),
  });
}

/** Tenant creates their own move-in invoice (first-year rent + fees) as part of the
 * Become-a-Tenant flow. Status "pending" until Paystack confirms via the verify route. */
export async function createTenantInvoice(params: {
  tenancyId: string;
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  amount: number;
  kind?: PaymentKind;
}): Promise<WriteResult> {
  return addFirestoreDoc("payments", {
    tenancyId: params.tenancyId,
    apartmentId: params.apartmentId,
    apartmentTitle: params.apartmentTitle,
    landlordId: params.landlordId,
    tenantId: params.tenantId,
    amount: params.amount,
    currency: "NGN",
    status: "pending",
    kind: params.kind ?? "rent",
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
}

export async function getPaymentsForLandlordLive(landlordId: string): Promise<Payment[]> {
  const result = await queryFirestoreCollection<Payment>("payments", [["landlordId", landlordId]]);
  return result ?? [];
}

export async function getPaymentsForTenantLive(tenantId: string): Promise<Payment[]> {
  const result = await queryFirestoreCollection<Payment>("payments", [["tenantId", tenantId]]);
  return result ?? [];
}
