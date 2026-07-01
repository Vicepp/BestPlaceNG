/**
 * Utility fees: extra recurring charges a landlord attaches to a specific
 * tenancy AFTER the tenant has moved in (e.g. electricity, water, service charge).
 *
 * Each fee is per-tenancy — the landlord decides which fees apply to which
 * tenant independently. Fees only appear in the tenant's dashboard after their
 * tenancy is active; they never show on the public listing.
 *
 * Flow:
 *  1. Landlord creates a fee (createUtilityFee) — fee appears in both dashboards.
 *  2. Landlord requests payment (requestUtilityPayment) — tenant sees a notification.
 *  3. Tenant pays (via Paystack) or landlord cancels the request.
 *  4. Landlord can deactivate (removeUtilityFee) or reactivate at any time.
 */
import {
  addFirestoreDoc,
  setFirestoreDoc,
  queryFirestoreCollection,
  type WriteResult,
} from "@/lib/firestoreWrite";

export type UtilityPeriod = "monthly" | "yearly";
export type UtilityFeeStatus = "active" | "removed";
export type UtilityRequestStatus = "pending" | "paid" | "cancelled";

export interface UtilityFee {
  id: string;
  tenancyId: string;
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  /** Custom name the landlord gives this fee (e.g. "Electricity", "Water Bill") */
  name: string;
  amount: number;
  period: UtilityPeriod;
  status: UtilityFeeStatus;
  createdAt: string;
}

export interface UtilityPaymentRequest {
  id: string;
  utilityFeeId: string;
  tenancyId: string;
  apartmentId: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  feeName: string;
  amount: number;
  period: UtilityPeriod;
  status: UtilityRequestStatus;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
}

export async function createUtilityFee(
  params: Omit<UtilityFee, "id" | "status" | "createdAt">
): Promise<WriteResult> {
  return addFirestoreDoc("utilityFees", {
    ...params,
    status: "active",
    createdAt: new Date().toISOString(),
  });
}

export async function removeUtilityFee(id: string): Promise<WriteResult> {
  return setFirestoreDoc("utilityFees", id, { status: "removed" });
}

export async function reactivateUtilityFee(id: string): Promise<WriteResult> {
  return setFirestoreDoc("utilityFees", id, { status: "active" });
}

/** Create a payment request — tenant sees a notification immediately */
export async function requestUtilityPayment(
  params: Omit<UtilityPaymentRequest, "id" | "status" | "createdAt">
): Promise<WriteResult> {
  return addFirestoreDoc("utilityPaymentRequests", {
    ...params,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
}

export async function cancelUtilityPaymentRequest(id: string): Promise<WriteResult> {
  return setFirestoreDoc("utilityPaymentRequests", id, { status: "cancelled" });
}

export async function getUtilityFeesForTenancy(tenancyId: string): Promise<UtilityFee[]> {
  const r = await queryFirestoreCollection<UtilityFee>("utilityFees", [["tenancyId", tenancyId]]);
  return r ?? [];
}

export async function getUtilityFeesForLandlord(landlordId: string): Promise<UtilityFee[]> {
  const r = await queryFirestoreCollection<UtilityFee>("utilityFees", [["landlordId", landlordId]]);
  return r ?? [];
}

export async function getUtilityFeesForTenant(tenantId: string): Promise<UtilityFee[]> {
  const r = await queryFirestoreCollection<UtilityFee>("utilityFees", [["tenantId", tenantId]]);
  return r ?? [];
}

export async function getUtilityRequestsForTenant(tenantId: string): Promise<UtilityPaymentRequest[]> {
  const r = await queryFirestoreCollection<UtilityPaymentRequest>("utilityPaymentRequests", [
    ["tenantId", tenantId],
  ]);
  return (r ?? []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUtilityRequestsForLandlord(landlordId: string): Promise<UtilityPaymentRequest[]> {
  const r = await queryFirestoreCollection<UtilityPaymentRequest>("utilityPaymentRequests", [
    ["landlordId", landlordId],
  ]);
  return (r ?? []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
