"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Calendar, Wrench, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/data/apartments";
import { getTenanciesForTenantLive, type Tenancy } from "@/data/tenancies";
import { getPaymentsForTenantLive, type Payment } from "@/data/payments";
import { getTicketsForTenantLive, type MaintenanceTicket } from "@/data/maintenanceTickets";
import { getUtilityFeesForTenant, getUtilityRequestsForTenant, type UtilityFee, type UtilityPaymentRequest } from "@/data/utilityFees";
import PayNowButton from "@/components/dashboard/PayNowButton";

export default function TenantDashboard() {
  const { user, profile } = useAuth();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [utilityFees, setUtilityFees] = useState<UtilityFee[]>([]);
  const [utilityRequests, setUtilityRequests] = useState<UtilityPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getTenanciesForTenantLive(user.uid),
      getPaymentsForTenantLive(user.uid),
      getTicketsForTenantLive(user.uid),
      getUtilityFeesForTenant(user.uid),
      getUtilityRequestsForTenant(user.uid),
    ]).then(([t, p, tk, uf, ur]) => {
      setTenancies(t);
      setPayments(p);
      setTickets(tk);
      setUtilityFees(uf.filter((f) => f.status === "active"));
      setUtilityRequests(ur.filter((r) => r.status === "pending"));
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <p className="text-sm text-zinc-400">Loading your dashboard...</p>;

  const activeTenancies = tenancies.filter((t) => t.status === "active");
  const requested = tenancies.filter((t) => t.status === "requested");
  const pendingPayments = payments.filter((p) => p.status === "pending").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const recentTickets = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome Back, {profile?.displayName?.split(" ")[0] ?? "there"}</h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s what you&apos;re renting and what&apos;s due.</p>
      </div>

      {requested.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          You have <strong>{requested.length}</strong> rental {requested.length === 1 ? "request" : "requests"} waiting on the landlord&apos;s
          approval.
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Your Rentals</h2>
        {activeTenancies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
            <Home className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
            <p className="text-sm font-medium text-foreground">You&apos;re not renting anything yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Browse <Link href="/apartments" className="font-semibold text-brand">apartments</Link> and request to rent one, or wait for a
              landlord to invite you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeTenancies.map((t) => (
              <div key={t.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                <p className="text-base font-bold text-foreground">{t.apartmentTitle}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatNaira(t.rentAmount)} / {t.rentPeriod}
                </p>
                {t.leaseEnd && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar className="h-3.5 w-3.5" /> Lease ends {new Date(t.leaseEnd).toLocaleDateString()}
                  </p>
                )}
                <Link href={`/city/${t.citySlug}/apartments`} className="mt-3 inline-block text-xs font-semibold text-brand">
                  View listing &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Payments Due</h2>
        {pendingPayments.length === 0 ? (
          <p className="text-xs text-zinc-400">Nothing due right now.</p>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((p) => {
              const tenancy = tenancies.find((t) => t.id === p.tenancyId);
              const overdue = new Date(p.dueDate) < new Date();
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tenancy?.apartmentTitle ?? p.apartmentTitle}</p>
                    <p className={`mt-0.5 text-xs ${overdue ? "font-semibold text-red-600" : "text-zinc-400"}`}>
                      Due {new Date(p.dueDate).toLocaleDateString()} {overdue && "· Overdue"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-brand-dark">{formatNaira(p.amount)}</p>
                    <PayNowButton payment={p} onSuccess={refresh} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Recent Maintenance Requests</h2>
          <Link href="/dashboard/maintenance" className="text-xs font-semibold text-brand">
            View all
          </Link>
        </div>
        {recentTickets.length === 0 ? (
          <p className="text-xs text-zinc-400">No maintenance requests filed yet.</p>
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

      {/* Utility fees from landlord */}
      {(utilityFees.length > 0 || utilityRequests.length > 0) && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground">Utility Fees</h2>
          {utilityRequests.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-500">Payment requests from your landlord</p>
              {utilityRequests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.feeName}</p>
                    <p className="text-xs text-zinc-400">{r.period} · Due {new Date(r.dueDate).toLocaleDateString()}</p>
                  </div>
                  <p className="text-lg font-bold text-brand-dark">{formatNaira(r.amount)}</p>
                </div>
              ))}
            </div>
          )}
          {utilityFees.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-semibold text-zinc-500">Active recurring charges</p>
              <div className="space-y-1.5">
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
        </div>
      )}
    </div>
  );
}
