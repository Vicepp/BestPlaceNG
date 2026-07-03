import { addFirestoreDoc, queryFirestoreCollection, type WriteResult } from "@/lib/firestoreWrite";

export type ReportStatus = "open" | "reviewing" | "resolved";

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  landlordId: string;
  apartmentId: string;
  apartmentTitle: string;
  tenancyId?: string;
  category: "cannot-move-in" | "payment" | "property-condition" | "landlord-conduct" | "other";
  message: string;
  status: ReportStatus;
  createdAt: string;
}

export async function fileReport(params: Omit<Report, "id" | "status" | "createdAt">): Promise<WriteResult> {
  return addFirestoreDoc("reports", {
    ...params,
    status: "open",
    createdAt: new Date().toISOString(),
  });
}

export async function getMyReports(reporterId: string): Promise<Report[]> {
  const r = await queryFirestoreCollection<Report>("reports", [["reporterId", reporterId]]);
  return (r ?? []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
