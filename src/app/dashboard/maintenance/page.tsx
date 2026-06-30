"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getTicketsForLandlordLive, getTicketsForTenantLive, updateTicketStatus, createMaintenanceTicket, type MaintenanceTicket } from "@/data/maintenanceTickets";
import { getTenanciesForTenantLive, type Tenancy } from "@/data/tenancies";

const TICKET_STYLES: Record<string, string> = {
  pending: "bg-red-100 text-red-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function MaintenancePage() {
  const { user, profile, activeView } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [myTenancies, setMyTenancies] = useState<Tenancy[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTenancy, setSelectedTenancy] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function load() {
    if (!user) return;
    if (activeView === "landlord") {
      setTickets(await getTicketsForLandlordLive(user.uid));
    } else {
      const [t, ten] = await Promise.all([getTicketsForTenantLive(user.uid), getTenanciesForTenantLive(user.uid)]);
      setTickets(t);
      setMyTenancies(ten.filter((t) => t.status === "active"));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [user, activeView]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const tenancy = myTenancies.find((t) => t.id === selectedTenancy);
    if (!tenancy || !issue.trim() || !description.trim() || !user) { setError("Please fill all fields and select a property."); return; }
    setSubmitting(true);
    const result = await createMaintenanceTicket({
      apartmentId: tenancy.apartmentId,
      citySlug: tenancy.citySlug,
      apartmentTitle: tenancy.apartmentTitle,
      tenantId: user.uid,
      tenantName: profile?.displayName ?? user.email ?? "Tenant",
      landlordId: tenancy.landlordId,
      issue: issue.trim(),
      description: description.trim(),
    });
    setSubmitting(false);
    if (!result.ok) { setError(result.error); return; }
    setIssue(""); setDescription(""); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>

      {activeView === "tenant" && myTenancies.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Submit a Request</h2>
          <select value={selectedTenancy} onChange={(e) => setSelectedTenancy(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="">Select your property</option>
            {myTenancies.map((t) => <option key={t.id} value={t.id}>{t.apartmentTitle}</option>)}
          </select>
          <input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Issue title (e.g. Leaky faucet)" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the problem..." className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">Request submitted!</p>}
          <button type="submit" disabled={submitting} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{submitting ? "Submitting..." : "Submit Request"}</button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-400">
          No maintenance tickets yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3 font-medium">Property</th>
                {activeView === "landlord" && <th className="px-5 py-3 font-medium">Tenant</th>}
                <th className="px-5 py-3 font-medium">Issue</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {[...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/properties/${t.apartmentId}`} className="font-medium text-brand hover:underline">{t.apartmentTitle}</Link>
                  </td>
                  {activeView === "landlord" && <td className="px-5 py-3 text-zinc-600">{t.tenantName}</td>}
                  <td className="px-5 py-3 text-foreground">{t.issue}</td>
                  <td className="px-5 py-3">
                    {activeView === "landlord" ? (
                      <select
                        value={t.status}
                        onChange={async (e) => { await updateTicketStatus(t.id, e.target.value as MaintenanceTicket["status"]); load(); }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${TICKET_STYLES[t.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${TICKET_STYLES[t.status]}`}>{t.status}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
