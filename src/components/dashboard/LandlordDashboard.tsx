"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, AlertTriangle, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApartmentsByOwnerLive, formatNaira, type ApartmentListing } from "@/data/apartments";
import { getTenanciesForLandlordLive, type Tenancy } from "@/data/tenancies";
import { getPaymentsForLandlordLive, type Payment } from "@/data/payments";
import { getTicketsForLandlordLive, type MaintenanceTicket } from "@/data/maintenanceTickets";
import StatCard from "@/components/dashboard/StatCard";
import TrendChart from "@/components/TrendChart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TICKET_STYLES: Record<string, string> = {
  pending: "bg-red-100 text-red-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function LandlordDashboard() {
  const { user, profile } = useAuth();
  const [apartments, setApartments] = useState<ApartmentListing[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getApartmentsByOwnerLive(user.uid),
      getTenanciesForLandlordLive(user.uid),
      getPaymentsForLandlordLive(user.uid),
      getTicketsForLandlordLive(user.uid),
    ]).then(([a, t, p, tk]) => {
      if (cancelled) return;
      setApartments(a);
      setTenancies(t);
      setPayments(p);
      setTickets(tk);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <p className="text-sm text-zinc-400">Loading your dashboard...</p>;

  const activeTenancies = tenancies.filter((t) => t.status === "active");
  const pendingRequests = tenancies.filter((t) => t.status === "requested");
  const now = new Date();
  const overdue = payments.filter((p) => p.status === "pending" && new Date(p.dueDate) < now);
  const overdueTotal = overdue.reduce((s, p) => s + p.amount, 0);
  const openTickets = tickets.filter((t) => t.status !== "completed");

  const year = now.getFullYear();
  const monthlyTotals = MONTHS.map((_, i) =>
    payments
      .filter((p) => p.status === "success" && p.verifiedAt && new Date(p.verifiedAt).getFullYear() === year && new Date(p.verifiedAt).getMonth() === i)
      .reduce((s, p) => s + p.amount, 0)
  );

  const upcomingLeases = [...activeTenancies]
    .filter((t) => t.leaseEnd)
    .sort((a, b) => new Date(a.leaseEnd!).getTime() - new Date(b.leaseEnd!).getTime())
    .slice(0, 6);

  const recentTickets = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome Back, {profile?.displayName?.split(" ")[0] ?? "there"}</h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s the latest snapshot of your properties</p>
      </div>

      {/* Mobile: horizontal swipeable carousel — each card snaps to center */}
      <div className="sm:hidden">
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {[
            { label: "Total Properties", value: String(apartments.length), icon: <Building2 className="h-5 w-5 text-brand" /> },
            { label: "Active Tenants", value: String(activeTenancies.length), icon: <Users className="h-5 w-5 text-blue-500" /> },
            { label: "Overdue Payments", value: formatNaira(overdueTotal), icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
            { label: "Open Tickets", value: String(openTickets.length), icon: <Wrench className="h-5 w-5 text-accent" /> },
          ].map((card) => (
            <div
              key={card.label}
              className="w-[72vw] shrink-0 snap-center rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">{card.label}</p>
                {card.icon}
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: 4-column grid */}
      <div className="hidden grid-cols-2 gap-4 sm:grid sm:grid-cols-4">
        <StatCard label="Total Properties" value={String(apartments.length)} icon={<Building2 className="h-4 w-4 text-zinc-300" />} />
        <StatCard label="Active Tenants" value={String(activeTenancies.length)} icon={<Users className="h-4 w-4 text-zinc-300" />} />
        <StatCard label="Overdue Payments" value={formatNaira(overdueTotal)} icon={<AlertTriangle className="h-4 w-4 text-zinc-300" />} />
        <StatCard label="Open Tickets" value={String(openTickets.length)} icon={<Wrench className="h-4 w-4 text-zinc-300" />} />
      </div>

      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          You have <strong>{pendingRequests.length}</strong> pending tenant {pendingRequests.length === 1 ? "request" : "requests"} waiting for
          approval.{" "}
          <Link href="/dashboard/tenants" className="font-semibold underline">
            Review now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-foreground">Rent Collection ({year})</h2>
          <div className="mt-4">
            <TrendChart title="" series={MONTHS.map((m, i) => ({ label: m, value: monthlyTotals[i] }))} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Lease Expirations</h2>
          <div className="mt-3 space-y-3">
            {upcomingLeases.length === 0 && <p className="text-xs text-zinc-400">No active leases with an end date yet.</p>}
            {upcomingLeases.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-zinc-50 pb-2 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{t.tenantName}</p>
                  <p className="truncate text-xs text-zinc-400">{t.apartmentTitle}</p>
                </div>
                <p className="shrink-0 text-xs font-semibold text-zinc-500">{new Date(t.leaseEnd!).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-sm font-bold text-foreground">Maintenance Tickets</h2>
          <Link href="/dashboard/maintenance" className="text-xs font-semibold text-brand">
            View all
          </Link>
        </div>
        {recentTickets.length === 0 ? (
          <p className="px-6 py-8 text-center text-xs text-zinc-400">No maintenance tickets yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-6 py-2 font-medium">Property</th>
                <th className="px-6 py-2 font-medium">Issue</th>
                <th className="px-6 py-2 font-medium">Status</th>
                <th className="px-6 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-6 py-3 text-foreground">{t.apartmentTitle}</td>
                  <td className="px-6 py-3 text-zinc-600">{t.issue}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TICKET_STYLES[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-6 py-3 text-zinc-400">{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
