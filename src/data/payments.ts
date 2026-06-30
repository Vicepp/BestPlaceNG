import { addFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";

export type PaymentStatus = "pending" | "success" | "failed";

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
  paystackReference?: string;
  dueDate: string;
  createdAt: string;
  verifiedAt?: string;
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

export async function getPaymentsForLandlordLive(landlordId: string): Promise<Payment[]> {
  const result = await queryFirestoreCollection<Payment>("payments", [["landlordId", landlordId]]);
  return result ?? [];
}

export async function getPaymentsForTenantLive(tenantId: string): Promise<Payment[]> {
  const result = await queryFirestoreCollection<Payment>("payments", [["tenantId", tenantId]]);
  return result ?? [];
}
