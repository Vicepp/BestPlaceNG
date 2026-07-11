"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Clock, CheckCircle2, Wallet, XCircle, CalendarX } from "lucide-react";
import type { Tenancy } from "@/data/tenancies";
import type { Payment } from "@/data/payments";
import { formatNaira } from "@/data/apartments";

type BucketId = "active" | "awaiting" | "approved" | "paid" | "cancelled" | "expired";

/** Landlord pipeline: every tenancy and payment organised by lifecycle stage —
 * Active Tenant / Awaiting Approval / Approved / Completed Payment (incl.
 * utilities) / Cancelled (vacancies + declined requests) / Expired (leases +
 * unpaid invoices incl. utilities). */
export default function TenantPipeline({ tenancies, payments }: { tenancies: Tenancy[]; payments: Payment[] }) {
  const [tab, setTab] = useState<BucketId>("active");
  const now = new Date();

  const buckets = useMemo(() => {
    const leaseExpired = (t: Tenancy) => Boolean(t.leaseEnd && new Date(t.leaseEnd) < now);
    return {
      active: tenancies.filter((t) => t.status === "active" && !leaseExpired(t)),
      awaiting: tenancies.filter((t) => t.status === "requested"),
      approved: tenancies.filter((t) => t.status === "invited"),
      paid: [...payments.filter((p) => p.status === "success")].sort((a, b) => (b.verifiedAt ?? b.createdAt).localeCompare(a.verifiedAt ?? a.createdAt)),
      cancelled: tenancies.filter((t) => t.status === "rejected" || (t.status === "ended" && !leaseExpired(t))),
      expired: {
        tenancies: tenancies.filter(leaseExpired),
        invoices: payments.filter((p) => p.status === "pending" && new Date(p.dueDate) < now),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenancies, payments]);

  const TABS: { id: BucketId; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "active", label: "Active Tenant", icon: Users, count: buckets.active.length },
    { id: "awaiting", label: "Awaiting Approval", icon: Clock, count: buckets.awaiting.length },
    { id: "approved", label: "Approved", icon: CheckCircle2, count: buckets.approved.length },
    { id: "paid", label: "Completed Payment", icon: Wallet, count: buckets.paid.length },
    { id: "cancelled", label: "Cancelled", icon: XCircle, count: buckets.cancelled.length },
    { id: "expired", label: "Expired", icon: CalendarX, count: buckets.expired.tenancies.length + buckets.expired.invoices.length },
  ];

  const TenRow = ({ t, note }: { t: Tenancy; note?: string }) => (
    <Link href={`/dashboard/properties/${t.apartmentId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-50 px-4 py-3 transition hover:bg-zinc-50/60">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{t.tenantName || t.tenantEmail}</p>
        <p className="truncate text-xs text-zinc-400">{t.apartmentTitle}{note ? ` · ${note}` : ""}</p>
      </div>
      <p className="text-xs font-semibold text-zinc-500">{formatNaira(t.rentAmount)}/{t.rentPeriod}</p>
    </Link>
  );

  const Empty = ({ text }: { text: string }) => (
    <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-xs text-zinc-400">{text}</p>
  );

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-foreground">Tenants &amp; Payments</h2>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active ? "bg-brand text-white" : "border border-zinc-200 text-zinc-500 hover:border-brand hover:text-brand"
              }`}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-zinc-100 text-zinc-500"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        {tab === "active" && (buckets.active.length === 0 ? <Empty text="No active tenants yet." /> :
          buckets.active.map((t) => (
            <TenRow key={t.id} t={t} note={t.moveInConfirmed ? "Moved in ✓" : t.moveInDate ? `Move-in ${new Date(t.moveInDate).toLocaleDateString()}` : "Move-in not set"} />
          )))}

        {tab === "awaiting" && (buckets.awaiting.length === 0 ? <Empty text="No requests waiting for your approval." /> :
          buckets.awaiting.map((t) => <TenRow key={t.id} t={t} note="Requested to rent — approve on the property page" />))}

        {tab === "approved" && (buckets.approved.length === 0 ? <Empty text="No approved invites awaiting the tenant." /> :
          buckets.approved.map((t) => <TenRow key={t.id} t={t} note="Invited — awaiting tenant signup/claim" />))}

        {tab === "paid" && (buckets.paid.length === 0 ? <Empty text="No completed payments yet." /> :
          buckets.paid.slice(0, 12).map((p) => (
            <Link key={p.id} href={p.apartmentId ? `/dashboard/properties/${p.apartmentId}` : "/dashboard/payments"}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-50 px-4 py-3 transition hover:bg-zinc-50/60">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.kind === "utility" ? "bg-accent/20 text-accent-dark" : "bg-brand-light text-brand-dark"}`}>{p.kind === "utility" ? "Utility" : "Rent"}</span>
                  <span className="truncate">{p.apartmentTitle}</span>
                </p>
                <p className="text-xs text-zinc-400">Paid {p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-green-600">{formatNaira(p.amount)}</p>
            </Link>
          )))}

        {tab === "cancelled" && (buckets.cancelled.length === 0 ? <Empty text="No cancelled requests or vacancies." /> :
          buckets.cancelled.map((t) => (
            <TenRow key={t.id} t={t} note={t.status === "rejected" ? "Request declined" : `Vacated${t.leaveReason ? ` — ${t.leaveReason}` : ""}`} />
          )))}

        {tab === "expired" && (buckets.expired.tenancies.length + buckets.expired.invoices.length === 0 ? <Empty text="Nothing expired — leases and invoices are current." /> : (
          <>
            {buckets.expired.tenancies.map((t) => (
              <TenRow key={t.id} t={t} note={`Lease ended ${t.leaseEnd ? new Date(t.leaseEnd).toLocaleDateString() : ""}${t.status === "ended" ? " · vacated" : " · renewal due"}`} />
            ))}
            {buckets.expired.invoices.map((p) => (
              <Link key={p.id} href={p.apartmentId ? `/dashboard/properties/${p.apartmentId}` : "/dashboard/payments"}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50/40 px-4 py-3 transition hover:bg-red-50">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.kind === "utility" ? "bg-accent/20 text-accent-dark" : "bg-brand-light text-brand-dark"}`}>{p.kind === "utility" ? "Utility" : "Rent"}</span>
                    <span className="truncate">{p.apartmentTitle}</span>
                  </p>
                  <p className="text-xs font-semibold text-red-500">Unpaid — was due {new Date(p.dueDate).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{formatNaira(p.amount)}</p>
              </Link>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
