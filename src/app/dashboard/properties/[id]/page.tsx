"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getApartmentsByOwnerLive, formatNaira, type ApartmentListing } from "@/data/apartments";
import {
  getTenanciesForApartmentLive,
  inviteTenant,
  approveTenancy,
  rejectTenancy,
  type Tenancy,
} from "@/data/tenancies";
import { getTicketsForLandlordLive, updateTicketStatus, type MaintenanceTicket } from "@/data/maintenanceTickets";

const TICKET_STYLES: Record<string, string> = {
  pending: "bg-red-100 text-red-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [apartment, setApartment] = useState<ApartmentListing | null>(null);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRent, setInviteRent] = useState("");
  const [invitePeriod, setInvitePeriod] = useState<"year" | "month">("year");
  const [inviteLeaseStart, setInviteLeaseStart] = useState("");
  const [inviteLeaseEnd, setInviteLeaseEnd] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function loadAll() {
    if (!user || !id) return;
    const [apts, ten, tix] = await Promise.all([
      getApartmentsByOwnerLive(user.uid),
      getTenanciesForApartmentLive(id),
      getTicketsForLandlordLive(user.uid),
    ]);
    setApartment(apts.find((a) => a.id === id) ?? null);
    setTenancies(ten);
    setTickets(tix.filter((t) => t.apartmentId === id));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    if (!apartment || !user) return;
    const rent = Number(inviteRent);
    if (!inviteEmail.trim() || !inviteName.trim() || !rent) {
      setInviteError("Please fill in email, name, and rent amount.");
      return;
    }
    setInviting(true);
    const result = await inviteTenant({
      apartmentId: apartment.id,
      citySlug: apartment.citySlug,
      apartmentTitle: apartment.title,
      landlordId: user.uid,
      tenantEmail: inviteEmail,
      tenantName: inviteName,
      rentAmount: rent,
      rentPeriod: invitePeriod,
      leaseStart: inviteLeaseStart || undefined,
      leaseEnd: inviteLeaseEnd || undefined,
    });
    setInviting(false);
    if (!result.ok) {
      setInviteError(result.error);
      return;
    }
    setInviteEmail("");
    setInviteName("");
    setInviteRent("");
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
    loadAll();
  }

  if (loading) return <p className="text-sm text-zinc-400">Loading...</p>;
  if (!apartment) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">Property not found or you don&apos;t own it.</p>
        <Link href="/dashboard/properties" className="mt-4 inline-block text-sm font-semibold text-brand">
          &larr; Back to Properties
        </Link>
      </div>
    );
  }

  const activeT = tenancies.filter((t) => t.status === "active");
  const requestedT = tenancies.filter((t) => t.status === "requested");
  const invitedT = tenancies.filter((t) => t.status === "invited");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/properties" className="mb-1 block text-xs font-semibold text-brand">
            &larr; Properties
          </Link>
          <h1 className="text-xl font-bold text-foreground">{apartment.title}</h1>
          <p className="text-sm text-zinc-500">{apartment.area}</p>
        </div>
        <Link href={`/dashboard/messages?property=${apartment.id}`} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand">
          Group Chat
        </Link>
      </div>

      {requestedT.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Pending Tenant Requests ({requestedT.length})</h2>
          <div className="mt-3 space-y-3">
            {requestedT.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{t.tenantName}</p>
                  <p className="text-xs text-zinc-400">{t.tenantEmail}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => { await approveTenancy(t.id, t); loadAll(); }}
                    className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => { await rejectTenancy(t.id); loadAll(); }}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 hover:border-red-300 hover:text-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Active Tenants ({activeT.length})</h2>
          {invitedT.length > 0 && <p className="mt-1 text-xs text-zinc-400">{invitedT.length} invite(s) pending claim by email.</p>}
          <div className="mt-3 space-y-3">
            {activeT.length === 0 && invitedT.length === 0 && <p className="text-xs text-zinc-400">No tenants yet.</p>}
            {activeT.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-zinc-50 pb-2 last:border-b-0">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.tenantName}</p>
                  <p className="text-xs text-zinc-400">{t.tenantEmail}</p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p>{formatNaira(t.rentAmount)}/{t.rentPeriod}</p>
                  {t.leaseEnd && <p>Ends {new Date(t.leaseEnd).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
            {invitedT.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-zinc-50 pb-2 last:border-b-0 opacity-60">
                <div>
                  <p className="text-sm text-zinc-400">{t.tenantEmail}</p>
                  <p className="text-xs text-zinc-300">Invite sent, awaiting signup</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Invite a Tenant</h2>
          <form onSubmit={handleInvite} className="mt-3 space-y-3">
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="Tenant email address" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Tenant full name" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            <div className="grid grid-cols-2 gap-3">
              <input value={inviteRent} onChange={(e) => setInviteRent(e.target.value)} type="number" placeholder="Rent amount (₦)" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              <select value={invitePeriod} onChange={(e) => setInvitePeriod(e.target.value as "year" | "month")} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="year">Per year</option>
                <option value="month">Per month</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">Lease start (optional)</label>
                <input value={inviteLeaseStart} onChange={(e) => setInviteLeaseStart(e.target.value)} type="date" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400">Lease end (optional)</label>
                <input value={inviteLeaseEnd} onChange={(e) => setInviteLeaseEnd(e.target.value)} type="date" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
            </div>
            {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
            {inviteSuccess && <p className="text-xs text-green-600">Invite sent! They&apos;ll be linked the next time they log in.</p>}
            <button type="submit" disabled={inviting} className="w-full rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {inviting ? "Sending..." : "Send Invite"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Maintenance Tickets</h2>
        {tickets.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-400">No tickets yet for this property.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.issue}</p>
                  <p className="text-xs text-zinc-400">Filed by {t.tenantName}</p>
                </div>
                <select
                  value={t.status}
                  onChange={async (e) => {
                    await updateTicketStatus(t.id, e.target.value as MaintenanceTicket["status"]);
                    loadAll();
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${TICKET_STYLES[t.status]}`}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
