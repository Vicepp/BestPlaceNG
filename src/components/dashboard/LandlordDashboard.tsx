"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Users, AlertTriangle, Wrench, Eye, UserCheck, MessageSquare, Banknote } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApartmentsByOwnerLive, formatNaira, type ApartmentListing } from "@/data/apartments";
import { getTenanciesForLandlordLive, type Tenancy } from "@/data/tenancies";
import { getPaymentsForLandlordLive, type Payment } from "@/data/payments";
import { getTicketsForLandlordLive, type MaintenanceTicket } from "@/data/maintenanceTickets";
import { getViewEventsForOwner, getLeadsForOwner, type ViewEvent, type ListingLead } from "@/data/listingViews";
import { getOrCreateDirectConversation } from "@/data/conversations";
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
  const router = useRouter();
  const [apartments, setApartments] = useState<ApartmentListing[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [events, setEvents] = useState<ViewEvent[]>([]);
  const [leads, setLeads] = useState<ListingLead[]>([]);
  const [messaging, setMessaging] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30" | "90" | "year" | "all" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
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
      getViewEventsForOwner(user.uid),
      getLeadsForOwner(user.uid),
    ]).then(([a, t, p, tk, ev, ld]) => {
      if (cancelled) return;
      setApartments(a);
      setTenancies(t);
      setPayments(p);
      setTickets(tk);
      setEvents(ev);
      setLeads(ld);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function messageLead(lead: ListingLead) {
    if (!user || messaging) return;
    setMessaging(lead.id);
    try {
      const cid = await getOrCreateDirectConversation(
        user.uid, profile?.displayName ?? "Landlord", lead.viewerId, lead.viewerName,
        { id: lead.apartmentId, title: lead.apartmentTitle }
      );
      router.push(`/dashboard/messages?c=${cid}`);
    } finally {
      setMessaging(null);
    }
  }

  if (loading) return <p className="text-sm text-zinc-400">Loading your dashboard...</p>;

  const activeTenancies = tenancies.filter((t) => t.status === "active");
  const pendingRequests = tenancies.filter((t) => t.status === "requested");
  const now = new Date();
  const openTickets = tickets.filter((t) => t.status !== "completed");

  // Date filter: EVERY time-based metric respects it (views, leads, money, tickets).
  const rangeStart =
    period === "30" ? new Date(now.getTime() - 30 * 86400000)
    : period === "90" ? new Date(now.getTime() - 90 * 86400000)
    : period === "year" ? new Date(now.getFullYear(), 0, 1)
    : period === "custom" && customFrom ? new Date(customFrom)
    : null;
  const rangeEnd = period === "custom" && customTo ? new Date(new Date(customTo).getTime() + 86400000) : null;
  const inPeriod = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    if (rangeStart && d < rangeStart) return false;
    if (rangeEnd && d >= rangeEnd) return false;
    return true;
  };
  const PERIOD_LABEL =
    period === "custom"
      ? customFrom || customTo ? "selected dates" : "all time"
      : { "30": "last 30 days", "90": "last 90 days", year: "this year", all: "all time" }[period];

  // Listing performance per UNIT from raw view events: views count everyone,
  // signed in or not; leads are the signed-in viewers you can message.
  const periodEvents = events.filter((e) => inPeriod(e.at));
  const totalViews = periodEvents.length;
  const viewsByUnit = new Map<string, number>();
  for (const e of periodEvents) viewsByUnit.set(e.apartmentId, (viewsByUnit.get(e.apartmentId) ?? 0) + 1);
  const periodLeads = leads.filter((l) => inPeriod(l.lastViewedAt));
  const leadsByUnit = new Map<string, number>();
  for (const l of periodLeads) leadsByUnit.set(l.apartmentId, (leadsByUnit.get(l.apartmentId) ?? 0) + 1);
  const recentLeads = periodLeads.slice(0, 6);

  const collectedInPeriod = payments
    .filter((p) => p.status === "success" && p.verifiedAt && inPeriod(p.verifiedAt))
    .reduce((s, p) => s + p.amount, 0);

  const overdue = payments.filter((p) => p.status === "pending" && new Date(p.dueDate) < now && inPeriod(p.dueDate));
  const overdueTotal = overdue.reduce((s, p) => s + p.amount, 0);

  const timeAgo = (iso: string) => {
    const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  const year = now.getFullYear();
  const monthlyTotals = MONTHS.map((_, i) =>
    payments
      .filter((p) => p.status === "success" && p.verifiedAt && new Date(p.verifiedAt).getFullYear() === year && new Date(p.verifiedAt).getMonth() === i && inPeriod(p.verifiedAt))
      .reduce((s, p) => s + p.amount, 0)
  );

  const upcomingLeases = [...activeTenancies]
    .filter((t) => t.leaseEnd)
    .sort((a, b) => new Date(a.leaseEnd!).getTime() - new Date(b.leaseEnd!).getTime())
    .slice(0, 6);

  const recentTickets = tickets
    .filter((t) => t.status !== "completed" || inPeriod(t.updatedAt))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back, {profile?.displayName?.split(" ")[0] ?? "there"}</h1>
          <p className="mt-1 text-sm text-zinc-500">Here&apos;s the latest snapshot of your properties</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 outline-none focus:border-brand"
            aria-label="Filter dashboard by date range"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="year">This year</option>
            <option value="all">All time</option>
            <option value="custom">Custom dates…</option>
          </select>
          {period === "custom" && (
            <div className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-light/40 px-3 py-1.5">
              <input type="date" value={customFrom} max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-700 outline-none" aria-label="From date" />
              <span className="text-xs font-bold text-zinc-400">→</span>
              <input type="date" value={customTo} min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-700 outline-none" aria-label="To date" />
            </div>
          )}
        </div>
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
            { label: `Views (${PERIOD_LABEL})`, value: totalViews.toLocaleString(), icon: <Eye className="h-5 w-5 text-violet-500" /> },
            { label: `Leads (${PERIOD_LABEL})`, value: String(periodLeads.length), icon: <UserCheck className="h-5 w-5 text-green-600" /> },
            { label: `Collected (${PERIOD_LABEL})`, value: formatNaira(collectedInPeriod), icon: <Banknote className="h-5 w-5 text-brand" /> },
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

      {/* Desktop: stat grid */}
      <div className="hidden grid-cols-2 gap-4 sm:grid sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Properties" value={String(apartments.length)} icon={<Building2 className="h-4 w-4 text-zinc-300" />} />
        <StatCard label="Active Tenants" value={String(activeTenancies.length)} icon={<Users className="h-4 w-4 text-zinc-300" />} />
        <StatCard label={`Views (${PERIOD_LABEL})`} value={totalViews.toLocaleString()} icon={<Eye className="h-4 w-4 text-zinc-300" />} />
        <StatCard label={`Leads (${PERIOD_LABEL})`} value={String(periodLeads.length)} icon={<UserCheck className="h-4 w-4 text-zinc-300" />} />
        <StatCard label="Overdue Payments" value={formatNaira(overdueTotal)} icon={<AlertTriangle className="h-4 w-4 text-zinc-300" />} />
        <StatCard label="Open Tickets" value={String(openTickets.length)} icon={<Wrench className="h-4 w-4 text-zinc-300" />} />
      </div>

      {/* Action-required banner — shown prominently so nothing is missed */}
      {(pendingRequests.length > 0) && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          <p className="font-semibold">⚡ Action required</p>
          <ul className="mt-1.5 space-y-0.5 pl-1">
            {pendingRequests.length > 0 && (
              <li>
                <strong>{pendingRequests.length}</strong> tenant rental {pendingRequests.length === 1 ? "request" : "requests"} waiting for your approval.{" "}
                <Link href="/dashboard/tenants" className="font-semibold underline">Review now →</Link>
              </li>
            )}
          </ul>
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
            {upcomingLeases.map((t) => {
              const days = Math.ceil((new Date(t.leaseEnd!).getTime() - now.getTime()) / 86400000);
              const chip = days < 0 ? "bg-red-100 text-red-700" : days <= 30 ? "bg-red-100 text-red-700" : days <= 90 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500";
              return (
                <div key={t.id} className="flex items-center justify-between border-b border-zinc-50 pb-2 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.tenantName}</p>
                    <p className="truncate text-xs text-zinc-400">{t.apartmentTitle} · {new Date(t.leaseEnd!).toLocaleDateString()}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${chip}`}>
                    {days < 0 ? "Expired" : `${days}d left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Listing performance + leads who viewed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="text-sm font-bold text-foreground">Listing Performance</h2>
            <Link href="/dashboard/leads" className="text-xs font-semibold text-brand">Manage leads →</Link>
          </div>
          {apartments.length === 0 ? (
            <p className="px-6 py-8 text-center text-xs text-zinc-400">
              No listings yet — add a unit under My Listings to start collecting views and leads.
            </p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-6 py-2 font-medium">Unit</th>
                  <th className="px-6 py-2 font-medium">Rent</th>
                  <th className="px-6 py-2 font-medium">Views</th>
                  <th className="px-6 py-2 font-medium">Leads</th>
                  <th className="px-6 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...apartments]
                  .sort((a, b) => (viewsByUnit.get(b.id) ?? 0) - (viewsByUnit.get(a.id) ?? 0))
                  .slice(0, 6)
                  .map((a, i) => (
                    <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                      <td className="px-6 py-3">
                        <Link href={`/city/${a.citySlug}/apartments`} className="font-medium text-foreground hover:text-brand">{a.title}</Link>
                        <p className="text-xs text-zinc-400">{a.area}</p>
                      </td>
                      <td className="px-6 py-3 text-zinc-600">{formatNaira(a.priceNaira)}{a.pricePeriod === "month" ? "/mo" : a.pricePeriod === "year" ? "/yr" : ""}</td>
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-1 text-zinc-600"><Eye className="h-3.5 w-3.5 text-zinc-300" /> {(viewsByUnit.get(a.id) ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-brand">{leadsByUnit.get(a.id) ?? 0}</td>
                      <td className="px-6 py-3">
                        {a.status === "rented" ? (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Rented</span>
                        ) : a.status === "archived" ? (
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">Delisted</span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Live</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          <p className="border-t border-zinc-50 px-6 py-3 text-[11px] text-zinc-400">
            Views count every visitor, signed in or not. Leads are signed-in visitors you can message directly.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Leads — viewed your listings</h2>
            <Link href="/dashboard/leads" className="text-xs font-semibold text-brand">View all</Link>
          </div>
          <div className="mt-3 space-y-3">
            {recentLeads.length === 0 && (
              <p className="py-6 text-center text-xs text-zinc-400">
                No leads {period === "all" ? "yet" : `in the ${PERIOD_LABEL}`}. When a signed-in user opens one of your listings, they&apos;ll appear here so you can reach out.
              </p>
            )}
            {recentLeads.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border-b border-zinc-50 pb-3 last:border-b-0 last:pb-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
                  {l.viewerName.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{l.viewerName}</p>
                  <p className="truncate text-xs text-zinc-400">
                    {l.apartmentTitle} · viewed {l.views > 1 ? `${l.views}×, last ` : ""}{timeAgo(l.lastViewedAt)}
                  </p>
                </div>
                <button onClick={() => messageLead(l)} disabled={messaging === l.id}
                  title={`Message ${l.viewerName}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-brand hover:bg-brand hover:text-white disabled:opacity-50">
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          {leads.length > 1 && (
            <p className="mt-3 text-[11px] text-zinc-400">
              💡 A lead who viewed more than once is warm — message them before their weekend viewing list fills up.
            </p>
          )}
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
