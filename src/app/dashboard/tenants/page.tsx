"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Settings2, Users, Clock, CheckCircle2, Wallet, XCircle, CalendarX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTenanciesForLandlordLive, approveTenancy, rejectTenancy, type Tenancy } from "@/data/tenancies";
import { getPaymentsForLandlordLive, type Payment } from "@/data/payments";
import { formatNaira } from "@/data/apartments";
import { getOrCreateDirectConversation } from "@/data/conversations";
import ManageTenantModal from "@/components/dashboard/ManageTenantModal";

type BucketId = "active" | "awaiting" | "approved" | "paid" | "cancelled" | "expired";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-blue-100 text-blue-700",
  requested: "bg-accent/20 text-accent-dark",
  rejected: "bg-red-100 text-red-700",
  ended: "bg-zinc-100 text-zinc-500",
};

export default function TenantsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BucketId>("active");
  const [manageTenant, setManageTenant] = useState<Tenancy | null>(null);
  const [messaging, setMessaging] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const [all, pays] = await Promise.all([getTenanciesForLandlordLive(user.uid), getPaymentsForLandlordLive(user.uid)]);
    // Collapse duplicate LIVE rows: one per (tenant, apartment), keeping the most
    // meaningful status (active > requested > invited). Rejected/ended rows are
    // kept as-is — they feed the Cancelled and Expired tabs.
    const rank: Record<string, number> = { active: 4, requested: 3, invited: 2 };
    const best = new Map<string, Tenancy>();
    const closed: Tenancy[] = [];
    for (const t of all) {
      if (t.status === "rejected" || t.status === "ended") { closed.push(t); continue; }
      const key = `${t.tenantId ?? t.tenantEmail}__${t.apartmentId}`;
      const cur = best.get(key);
      if (!cur || (rank[t.status] ?? 0) > (rank[cur.status] ?? 0)) best.set(key, t);
    }
    const byDate = (a: Tenancy, b: Tenancy) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    setTenancies([...[...best.values()].sort(byDate), ...closed.sort(byDate)]);
    setPayments(pays);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = useMemo(() => new Date(), []);
  const leaseExpired = (t: Tenancy) => Boolean(t.leaseEnd && new Date(t.leaseEnd) < now);

  const buckets = useMemo(() => ({
    active: tenancies.filter((t) => t.status === "active" && !leaseExpired(t)),
    awaiting: tenancies.filter((t) => t.status === "requested"),
    approved: tenancies.filter((t) => t.status === "invited"),
    paid: [...payments.filter((p) => p.status === "success")].sort((a, b) => (b.verifiedAt ?? b.createdAt).localeCompare(a.verifiedAt ?? a.createdAt)),
    cancelled: tenancies.filter((t) => t.status === "rejected" || (t.status === "ended" && !leaseExpired(t))),
    expiredTenancies: tenancies.filter(leaseExpired),
    expiredInvoices: payments.filter((p) => p.status === "pending" && new Date(p.dueDate) < now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [tenancies, payments]); // eslint-disable-line react-hooks/exhaustive-deps

  const TABS: { id: BucketId; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "active", label: "Active Tenant", icon: Users, count: buckets.active.length },
    { id: "awaiting", label: "Awaiting Approval", icon: Clock, count: buckets.awaiting.length },
    { id: "approved", label: "Approved", icon: CheckCircle2, count: buckets.approved.length },
    { id: "paid", label: "Completed Payment", icon: Wallet, count: buckets.paid.length },
    { id: "cancelled", label: "Cancelled", icon: XCircle, count: buckets.cancelled.length },
    { id: "expired", label: "Expired", icon: CalendarX, count: buckets.expiredTenancies.length + buckets.expiredInvoices.length },
  ];

  async function messageTenant(t: Tenancy) {
    if (!user || !t.tenantId) return;
    setMessaging(t.id);
    const convoId = await getOrCreateDirectConversation(
      user.uid,
      profile?.displayName ?? user.email ?? "Landlord",
      t.tenantId,
      t.tenantName
    );
    router.push(`/dashboard/messages?c=${convoId}`);
  }

  const tenantNameFor = (p: Payment) => tenancies.find((t) => t.id === p.tenancyId)?.tenantName ?? "—";

  /* Tenancy table used by the tenancy-based tabs; `note` adds bucket context. */
  function TenancyTable({ rows, note }: { rows: Tenancy[]; note?: (t: Tenancy) => string | null }) {
    if (rows.length === 0) return null;
    return (
      <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-5 py-3 font-medium">Tenant</th>
              <th className="px-5 py-3 font-medium">Property</th>
              <th className="px-5 py-3 font-medium">Rent</th>
              <th className="px-5 py-3 font-medium">Lease End</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const extra = note?.(t);
              return (
                <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-foreground">{t.tenantName}</p>
                    <p className="text-xs text-zinc-400">{t.tenantEmail}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/properties/${t.apartmentId}`} className="font-medium text-brand hover:underline">
                      {t.apartmentTitle}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{formatNaira(t.rentAmount)}/{t.rentPeriod}</td>
                  <td className="px-5 py-3 text-zinc-500">{t.leaseEnd ? new Date(t.leaseEnd).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                    {extra && <p className="mt-1 max-w-[180px] text-[11px] text-zinc-400">{extra}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.status === "requested" && (
                        <>
                          <button onClick={async () => { await approveTenancy(t.id, t); load(); }} className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark">Approve</button>
                          <button onClick={async () => { await rejectTenancy(t.id); load(); }} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 hover:border-red-300 hover:text-red-600">Reject</button>
                        </>
                      )}
                      {t.tenantId && (t.status === "active" || t.status === "requested") && (
                        <button onClick={() => messageTenant(t)} disabled={messaging === t.id} title="Message tenant"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-brand hover:text-brand disabled:opacity-50">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {t.status === "active" && (
                        <button onClick={() => setManageTenant(t)} title="Manage tenant"
                          className="flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
                          <Settings2 className="h-3.5 w-3.5" /> Manage
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  /* Payments table for Completed Payment + expired invoices. */
  function PaymentsTable({ rows, dueStyle }: { rows: Payment[]; dueStyle?: boolean }) {
    if (rows.length === 0) return null;
    return (
      <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-5 py-3 font-medium">Tenant</th>
              <th className="px-5 py-3 font-medium">Property</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">{dueStyle ? "Was due" : "Paid on"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-5 py-3 font-semibold text-foreground">{tenantNameFor(p)}</td>
                <td className="px-5 py-3">
                  {p.apartmentId ? (
                    <Link href={`/dashboard/properties/${p.apartmentId}`} className="font-medium text-brand hover:underline">{p.apartmentTitle}</Link>
                  ) : (
                    <span className="text-zinc-600">{p.apartmentTitle}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.kind === "utility" ? "bg-accent/20 text-accent-dark" : "bg-brand-light text-brand-dark"}`}>
                    {p.kind === "utility" ? "Utility" : "Rent"}
                  </span>
                </td>
                <td className={`px-5 py-3 font-bold ${dueStyle ? "text-foreground" : "text-green-600"}`}>{formatNaira(p.amount)}</td>
                <td className={`px-5 py-3 ${dueStyle ? "font-semibold text-red-500" : "text-zinc-500"}`}>
                  {dueStyle ? new Date(p.dueDate).toLocaleDateString() : new Date(p.verifiedAt ?? p.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const Empty = ({ text }: { text: string }) => (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-400">{text}</div>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Tenants</h1>

      {/* Lifecycle tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                active ? "bg-brand text-white" : "border border-zinc-200 bg-white text-zinc-500 hover:border-brand hover:text-brand"
              }`}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-zinc-100 text-zinc-500"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : (
        <>
          {tab === "active" && (buckets.active.length === 0 ? <Empty text="No active tenants yet. Invite a tenant from a property's detail page." /> :
            <TenancyTable rows={buckets.active} note={(t) => t.moveInConfirmed ? "Moved in ✓" : t.moveInDate ? `Move-in ${new Date(t.moveInDate).toLocaleDateString()}` : "Move-in not set"} />)}

          {tab === "awaiting" && (buckets.awaiting.length === 0 ? <Empty text="No rental requests waiting for approval." /> :
            <TenancyTable rows={buckets.awaiting} note={() => "Requested to rent"} />)}

          {tab === "approved" && (buckets.approved.length === 0 ? <Empty text="No approved invites awaiting the tenant." /> :
            <TenancyTable rows={buckets.approved} note={() => "Invited — awaiting signup/claim"} />)}

          {tab === "paid" && (buckets.paid.length === 0 ? <Empty text="No completed payments yet — rent and utility payments will appear here." /> :
            <PaymentsTable rows={buckets.paid} />)}

          {tab === "cancelled" && (buckets.cancelled.length === 0 ? <Empty text="No cancelled requests or vacancies." /> :
            <TenancyTable rows={buckets.cancelled} note={(t) => t.status === "rejected" ? "Request declined" : `Vacated${t.leaveReason ? ` — ${t.leaveReason}` : ""}`} />)}

          {tab === "expired" && (buckets.expiredTenancies.length + buckets.expiredInvoices.length === 0 ? (
            <Empty text="Nothing expired — leases and invoices are current." />
          ) : (
            <div className="space-y-4">
              {buckets.expiredTenancies.length > 0 && (
                <div>
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">Expired leases</h2>
                  <TenancyTable rows={buckets.expiredTenancies} note={(t) => t.status === "ended" ? "Vacated" : "Renewal due"} />
                </div>
              )}
              {buckets.expiredInvoices.length > 0 && (
                <div>
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">Unpaid invoices past due (incl. utilities)</h2>
                  <PaymentsTable rows={buckets.expiredInvoices} dueStyle />
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {manageTenant && <ManageTenantModal tenancy={manageTenant} onClose={() => { setManageTenant(null); load(); }} />}
    </div>
  );
}
