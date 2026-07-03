import { addFirestoreDoc, setFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";
import { getFirestoreDoc } from "@/lib/firestoreData";
import { ensurePropertyGroupConversation } from "@/data/conversations";
import { createNotification } from "@/data/notifications";

async function landlordDisplayName(landlordId: string): Promise<string> {
  const doc = await getFirestoreDoc<{ displayName?: string }>("users", landlordId);
  return doc?.displayName ?? "Landlord";
}

export type TenancyStatus = "invited" | "requested" | "active" | "rejected" | "ended";

export interface Tenancy {
  id: string;
  apartmentId: string;
  citySlug: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string | null;
  tenantEmail: string;
  tenantName: string;
  status: TenancyStatus;
  rentAmount: number;
  rentPeriod: "year" | "month";
  leaseStart?: string;
  leaseEnd?: string;
  createdAt: string;
  /** Whether this is a home or a commercial unit — shown on the tenant dashboard. */
  unitKind?: "apartment" | "shop";
  // Signed tenancy agreement (captured on the Become-a-Tenant flow)
  signedName?: string;
  signedPhone?: string;
  agreedAt?: string;
  // Move-in / escrow-release gate
  moveInDate?: string;         // set by the landlord after payment
  moveInConfirmed?: boolean;   // tenant clicks "I've moved in"
  moveInConfirmedAt?: string;
}

/** Landlord sets the agreed move-in date after payment is received. Rules allow the
 * landlord to change only these fields on their own tenancy. */
export async function setMoveInDate(tenancyId: string, moveInDate: string): Promise<WriteResult> {
  return setFirestoreDoc("tenancies", tenancyId, { moveInDate });
}

/** Tenant confirms they've moved in — this is the trigger that releases the
 * escrowed money to the landlord (the release route checks this flag). */
export async function confirmMoveIn(tenancyId: string): Promise<WriteResult> {
  return setFirestoreDoc("tenancies", tenancyId, {
    moveInConfirmed: true,
    moveInConfirmedAt: new Date().toISOString(),
  });
}

/** Tenant signs the landlord's clause and requests the tenancy, right before paying.
 * Created as "requested"; the payment-verify route flips it to "active" once
 * Paystack confirms the money, so paying is what actually makes them a tenant. */
export async function signAndRequestTenancy(params: {
  apartmentId: string;
  citySlug: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  rentAmount: number;
  rentPeriod: "year" | "month";
  unitKind: "apartment" | "shop";
  signedName: string;
  signedPhone: string;
}): Promise<WriteResult> {
  return addFirestoreDoc("tenancies", {
    apartmentId: params.apartmentId,
    citySlug: params.citySlug,
    apartmentTitle: params.apartmentTitle,
    landlordId: params.landlordId,
    tenantId: params.tenantId,
    tenantEmail: params.tenantEmail.trim().toLowerCase(),
    tenantName: params.tenantName,
    status: "requested",
    rentAmount: params.rentAmount,
    rentPeriod: params.rentPeriod,
    unitKind: params.unitKind,
    signedName: params.signedName,
    signedPhone: params.signedPhone,
    agreedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
}

/** Landlord invites a tenant by email. Always created as "invited" with tenantId null - the
 * matching tenant account (existing or newly signed-up) links itself the next time it's
 * authenticated in the app (see claimPendingInvitesForEmail), since only the tenant's own
 * auth session can satisfy the tenantEmail == request.auth.token.email rule check. */
export async function inviteTenant(params: {
  apartmentId: string;
  citySlug: string;
  apartmentTitle: string;
  landlordId: string;
  tenantEmail: string;
  tenantName: string;
  rentAmount: number;
  rentPeriod: "year" | "month";
  leaseStart?: string;
  leaseEnd?: string;
}): Promise<WriteResult> {
  return addFirestoreDoc("tenancies", {
    apartmentId: params.apartmentId,
    citySlug: params.citySlug,
    apartmentTitle: params.apartmentTitle,
    landlordId: params.landlordId,
    tenantId: null,
    tenantEmail: params.tenantEmail.trim().toLowerCase(),
    tenantName: params.tenantName,
    status: "invited",
    rentAmount: params.rentAmount,
    rentPeriod: params.rentPeriod,
    leaseStart: params.leaseStart,
    leaseEnd: params.leaseEnd,
    createdAt: new Date().toISOString(),
  });
}

/** Tenant requests to rent a listing - landlord approves or rejects from their dashboard. */
export async function requestToRent(params: {
  apartmentId: string;
  citySlug: string;
  apartmentTitle: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  rentAmount: number;
  rentPeriod: "year" | "month";
}): Promise<WriteResult> {
  return addFirestoreDoc("tenancies", {
    apartmentId: params.apartmentId,
    citySlug: params.citySlug,
    apartmentTitle: params.apartmentTitle,
    landlordId: params.landlordId,
    tenantId: params.tenantId,
    tenantEmail: params.tenantEmail.trim().toLowerCase(),
    tenantName: params.tenantName,
    status: "requested",
    rentAmount: params.rentAmount,
    rentPeriod: params.rentPeriod,
    createdAt: new Date().toISOString(),
  });
}

export async function approveTenancy(tenancyId: string, tenancy: Tenancy): Promise<WriteResult> {
  const result = await setFirestoreDoc("tenancies", tenancyId, { status: "active" });
  if (result.ok && tenancy.tenantId) {
    const landlordName = await landlordDisplayName(tenancy.landlordId);
    await ensurePropertyGroupConversation({
      apartmentId: tenancy.apartmentId,
      apartmentTitle: tenancy.apartmentTitle,
      landlordId: tenancy.landlordId,
      landlordName,
      tenantId: tenancy.tenantId,
      tenantName: tenancy.tenantName,
    }).catch((e) => console.error("[tenancies] ensurePropertyGroupConversation failed:", e));
  }
  return result;
}

export async function rejectTenancy(tenancyId: string): Promise<WriteResult> {
  return setFirestoreDoc("tenancies", tenancyId, { status: "rejected" });
}

/** Run on every authenticated session (login, signup, or page load with a persisted
 * session) - links any "invited" tenancies addressed to this user's own verified email. */
export async function claimPendingInvitesForEmail(uid: string, email: string): Promise<void> {
  const matches = await queryFirestoreCollection<Tenancy>("tenancies", [
    ["tenantEmail", email.trim().toLowerCase()],
    ["tenantId", null],
  ]);
  if (!matches || matches.length === 0) return;
  for (const t of matches) {
    if (t.status !== "invited") continue;
    await setFirestoreDoc("tenancies", t.id, { tenantId: uid, status: "active" });
    // Notify the tenant they've been confirmed as a tenant
    createNotification({
      userId: uid,
      type: "tenancy",
      title: "You're now a tenant 🏠",
      body: `Your tenancy at ${t.apartmentTitle} is confirmed. Check your dashboard for rent and payment details.`,
      link: "/dashboard",
    }).catch(() => {});
    const landlordName = await landlordDisplayName(t.landlordId);
    await ensurePropertyGroupConversation({
      apartmentId: t.apartmentId,
      apartmentTitle: t.apartmentTitle,
      landlordId: t.landlordId,
      landlordName,
      tenantId: uid,
      tenantName: t.tenantName,
    }).catch((e) => console.error("[tenancies] ensurePropertyGroupConversation failed:", e));
  }
}

export async function getTenanciesForLandlordLive(landlordId: string): Promise<Tenancy[]> {
  const result = await queryFirestoreCollection<Tenancy>("tenancies", [["landlordId", landlordId]]);
  return result ?? [];
}

export async function getTenanciesForTenantLive(tenantId: string): Promise<Tenancy[]> {
  const result = await queryFirestoreCollection<Tenancy>("tenancies", [["tenantId", tenantId]]);
  return result ?? [];
}

export async function getTenanciesForApartmentLive(apartmentId: string): Promise<Tenancy[]> {
  const result = await queryFirestoreCollection<Tenancy>("tenancies", [["apartmentId", apartmentId]]);
  return result ?? [];
}
