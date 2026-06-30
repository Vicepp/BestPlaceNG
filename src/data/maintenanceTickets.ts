import { addFirestoreDoc, setFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";

export type TicketStatus = "pending" | "in-progress" | "completed";

export interface MaintenanceTicket {
  id: string;
  apartmentId: string;
  citySlug: string;
  apartmentTitle: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  issue: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export async function createMaintenanceTicket(params: {
  apartmentId: string;
  citySlug: string;
  apartmentTitle: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  issue: string;
  description: string;
}): Promise<WriteResult> {
  const now = new Date().toISOString();
  return addFirestoreDoc("maintenanceTickets", {
    apartmentId: params.apartmentId,
    citySlug: params.citySlug,
    apartmentTitle: params.apartmentTitle,
    tenantId: params.tenantId,
    tenantName: params.tenantName,
    landlordId: params.landlordId,
    issue: params.issue,
    description: params.description,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<WriteResult> {
  return setFirestoreDoc("maintenanceTickets", ticketId, { status, updatedAt: new Date().toISOString() });
}

export async function getTicketsForLandlordLive(landlordId: string): Promise<MaintenanceTicket[]> {
  const result = await queryFirestoreCollection<MaintenanceTicket>("maintenanceTickets", [["landlordId", landlordId]]);
  return result ?? [];
}

export async function getTicketsForTenantLive(tenantId: string): Promise<MaintenanceTicket[]> {
  const result = await queryFirestoreCollection<MaintenanceTicket>("maintenanceTickets", [["tenantId", tenantId]]);
  return result ?? [];
}
