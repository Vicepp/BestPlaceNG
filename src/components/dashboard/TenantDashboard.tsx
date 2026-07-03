"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home, Calendar, Wrench, Zap, CheckCircle, Clock,
  XCircle, Bell, CreditCard, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/data/apartments";
import { getTenanciesForTenantLive, approveTenancy, type Tenancy } from "@/data/tenancies";
import { getPaymentsForTenantLive, type Payment } from "@/data/payments";
import { getTicketsForTenantLive, type MaintenanceTicket } from "@/data/maintenanceTickets";
import { getUtilityFeesForTenant, getUtilityRequestsForTenant, type UtilityFee, type UtilityPaymentRequest } from "@/data/utilityFees";
import { claimPendingInvitesForEmail } from "@/data/tenancies";
import PayNowButton from "@/components/dashboard/PayNowButton";
import { isPaystackConfigured } from "@/lib/paystack";

const PAYMENT_STATUS_STYLE: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  pending: { cls: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3.5 w-3.5" />, label: "Pending" },
  success: { cls: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Paid" },
  failed:  { cls: "bg-red-100 text-red-700",    icon: <XCircle className="h-3.5 w-3.5" />,    label: "Failed" },
};

function PaymentRow({ p, tenancies, onSuccess }: { p: Payment; tenancies: Tenancy[]; onSuccess: () => void }) {
  const tenancy = tenancies.find((t) => t.id === p.tenancyId);
  const overdue = p.status === "pending" && new Date(p.dueDate) < new Date();
  const style = PAYMENT_STATUS_STYLE[p.status] ?? PAYMENT_STATUS_STYLE.pending;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${style.cls}`}>
          {style.icon} {style.label}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{tenancy?.apartmentTitle ?? p.apartmentTitle ?? "Rental payment"}</p>
          <p className={`mt-0.5 text-xs ${overdue ? "font-semibold text-red-600" : "text-zinc-400"}`}>
            {p.status === "success" ? `Paid ${p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : ""}` : `Due ${new Date(p.dueDate).toLocaleDateString()}${overdue ? " · Overdue" : ""}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-base font-bold text-brand-dark">{formatNaira(p.amount)}</p>
        {p.status === "pending" && <PayNowButton payment={p} onSuccess={onSuccess} />}
      </div>
    </div>
  );
}

export default function TenantDashboard() {
  const { user, profile } = useAuth();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [utilityFees, setUtilityFees] = useState<UtilityFee[]>([]);
  const [utilityRequests, setUtilityRequests] = useState<UtilityPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  async function refresh() {
    if (!user) return;
    // Re-run the auto-link claim (catches invites that arrived while logged in)
    if (user.email) await claimPendingInvitesForEmail(user.uid, user.email);

    const [t, p, tk, uf, ur] = await Promise.all([
      getTenanciesForTenantLive(user.uid),
      getPaymentsForTenantLive(user.uid),
      getTicketsForTenantLive(user.uid),
      getUtilityFeesForTenant(user.uid),
      getUtilityRequestsForTenant(user.uid),
    ]);
    setTenancies(t);
    setPayments(p);
    setTickets(tk);
    setUtilityFees(uf.filter((f) => f.status === "active"));
    setUtilityRequests(ur.filter((r) => r.status === "pending"));
    setLoading(false);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  if (loading) return <p className="text-sm text-zinc-400">Loading your dashboard…</p>;

  const invited   = tenancies.filter((t) => t.status === "invited");
  const requested = tenancies.filter((t) => t.status === "requested");
  const active    = tenancies.filter((t) => t.status === "active");
  const pending   = payments.filter((p) => p.status === "pending").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const paid      = payments.filter((p) => p.status === "success").sort((a, b) => new Date(b.verifiedAt ?? b.createdAt).getTime() - new Date(a.verifiedAt ?? a.createdAt).getTime());
  const recentTickets = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome Back, {profile?.displayName?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {active.length > 0 ? `You're renting ${active.length} propert${active.length === 1 ? "y" : "ies"}.` : "Here's your rental dashboard."}
        </p>
      </div>

      {/* ── Pending invites that need manual acceptance ─────────────────── */}
      {invited.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Bell className="h-4 w-4 text-brand" /> Rental Invites
          </h2>
          {invited.map((t) => (
            <div key={t.id} className="rounded-2xl border border-brand/20 bg-brand-light p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-dark">{t.apartmentTitle}</p>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    Rent: <strong>{formatNaira(t.rentAmount)}</strong> / {t.rentPeriod}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">Invited by your landlord — accept to confirm your tenancy</p>
                </div>
                <button
                  onClick={async () => {
                    setAccepting(t.id);
                    await approveTenancy(t.id, t);
                    await refresh();
                    setAccepting(null);
                  }}
                  disabled={accepting === t.id}
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {accepting === t.id ? "Accepting…" : "Accept Invite"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Requests awaiting landlord approval ─────────────────────────── */}
      {requested.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          <p className="font-semibold">Waiting for landlord approval</p>
          <p className="mt-0.5 text-xs">
            You have {requested.length} rental {requested.length === 1 ? "request" : "requests"} pending. The landlord will accept or decline shortly.
          </p>
        </div>
      )}

      {/* ── Active rentals ───────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Your Rentals</h2>
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
            <Home className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            <p className="text-sm font-medium text-foreground">You&apos;re not renting anything yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Browse <Link href="/apartments" className="font-semibold text-brand">apartments</Link> or wait for a landlord to invite you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {active.map((t) => {
              const tenantPayments = pending.filter((p) => p.tenancyId === t.id);
              return (
                <Link key={t.id} href={`/dashboard/rental/${t.id}`} className="block rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground line-clamp-2">{t.apartmentTitle}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatNaira(t.rentAmount)} / {t.rentPeriod}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold text-green-700">Active</span>
                  </div>
                  {t.leaseStart && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(t.leaseStart).toLocaleDateString()} {t.leaseEnd ? `→ ${new Date(t.leaseEnd).toLocaleDateString()}` : "· Ongoing"}
                    </p>
                  )}
                  {tenantPayments.length > 0 ? (
                    <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                      <span className="font-semibold">{tenantPayments.length} payment{tenantPayments.length > 1 ? "s" : ""} due</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-400 italic">No payment due right now</p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    Open rental — utilities, clause, address <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Payments due ────────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground">
            <span className="mr-2 inline-flex items-center gap-1 text-red-600">
              <CreditCard className="h-4 w-4" /> Payments Due
            </span>
            <span className="text-zinc-400">({pending.length})</span>
          </h2>
          {!isPaystackConfigured() && (
            <div className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-xs text-yellow-800">
              Online payment isn&apos;t configured yet — pay your landlord directly (bank transfer, cash) and let them record the payment.
            </div>
          )}
          <div className="space-y-3">
            {pending.map((p) => (
              <PaymentRow key={p.id} p={p} tenancies={tenancies} onSuccess={refresh} />
            ))}
          </div>
        </div>
      )}

      {/* ── Utility payment requests ─────────────────────────────────────── */}
      {utilityRequests.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground">Utility Payment Requests</h2>
          <div className="space-y-2">
            {utilityRequests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.feeName}</p>
                  <p className="text-xs text-zinc-400">{r.period} · Due {new Date(r.dueDate).toLocaleDateString()}</p>
                </div>
                <p className="text-base font-bold text-brand-dark">{formatNaira(r.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active utility fees (recurring charges) ─────────────────────── */}
      {utilityFees.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">Recurring Charges</h2>
          <div className="space-y-2">
            {utilityFees.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Zap className="h-3.5 w-3.5 text-accent" /> {f.name}
                </span>
                <span className="text-zinc-500">{formatNaira(f.amount)}/{f.period}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment history ──────────────────────────────────────────────── */}
      {paid.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <CreditCard className="h-4 w-4" />
            {showHistory ? "Hide" : "Show"} Payment History ({paid.length})
          </button>
          {showHistory && (
            <div className="mt-3 space-y-3">
              {paid.map((p) => (
                <PaymentRow key={p.id} p={p} tenancies={tenancies} onSuccess={refresh} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Maintenance ─────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Maintenance Requests</h2>
          <Link href="/dashboard/maintenance" className="text-xs font-semibold text-brand">View all</Link>
        </div>
        {recentTickets.length === 0 ? (
          <p className="text-xs text-zinc-400">No requests filed yet.</p>
        ) : (
          <div className="space-y-2">
            {recentTickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <Wrench className="h-3.5 w-3.5 text-zinc-300" /> {t.issue}
                </span>
                <span className="text-xs capitalize text-zinc-400">{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
