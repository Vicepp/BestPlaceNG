"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, Banknote, Clock, Wrench, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApartmentsByOwnerLive, formatNaira, type ApartmentListing } from "@/data/apartments";
import { getTenanciesForLandlordLive, type Tenancy } from "@/data/tenancies";
import { getPaymentsForLandlordLive, type Payment } from "@/data/payments";
import { getTicketsForLandlordLive, type MaintenanceTicket } from "@/data/maintenanceTickets";
import { getWallet, type Wallet } from "@/data/wallet";
import TrendChart from "@/components/TrendChart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsPage() {
  const { user, activeView } = useAuth();
  const [units, setUnits] = useState<ApartmentListing[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getApartmentsByOwnerLive(user.uid),
      getTenanciesForLandlordLive(user.uid),
      getPaymentsForLandlordLive(user.uid),
      getTicketsForLandlordLive(user.uid),
      getWallet(user.uid),
    ]).then(([u, t, p, tk, w]) => {
      setUnits(u); setTenancies(t); setPayments(p); setTickets(tk); setWallet(w); setLoading(false);
    });
  }, [user]);

  if (activeView !== "landlord") {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
        Reports are for landlords. Switch to the Landlord view to see your portfolio analytics.
      </div>
    );
  }
  if (loading) return <p className="text-sm text-zinc-400">Loading reports…</p>;

  const activeUnits = units.filter((u) => (u.status ?? "active") === "active").length;
  const rentedUnits = units.filter((u) => u.status === "rented").length;
  const activeTenants = tenancies.filter((t) => t.status === "active").length;
  const successful = payments.filter((p) => p.status === "success");
  const collected = successful.reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "pending" && new Date(p.dueDate) < new Date());
  const openTickets = tickets.filter((t) => t.status !== "completed").length;
  const occupancy = units.length > 0 ? Math.round((rentedUnits / units.length) * 100) : 0;

  // Monthly income for the current year from successful payments.
  const year = new Date().getFullYear();
  const monthly = new Array(12).fill(0) as number[];
  for (const p of successful) {
    const d = new Date(p.verifiedAt ?? p.createdAt);
    if (d.getFullYear() === year) monthly[d.getMonth()] += p.amount;
  }

  const cards = [
    { label: "Total Units", value: String(units.length), icon: <Building2 className="h-5 w-5 text-brand" /> },
    { label: "Occupancy", value: `${occupancy}%`, icon: <TrendingUp className="h-5 w-5 text-green-500" /> },
    { label: "Active Tenants", value: String(activeTenants), icon: <Users className="h-5 w-5 text-blue-500" /> },
    { label: "Total Collected", value: formatNaira(collected), icon: <Banknote className="h-5 w-5 text-green-600" /> },
    { label: "Overdue", value: formatNaira(overdue.reduce((s, p) => s + p.amount, 0)), icon: <Clock className="h-5 w-5 text-red-500" /> },
    { label: "Open Tickets", value: String(openTickets), icon: <Wrench className="h-5 w-5 text-accent" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">A snapshot of your portfolio&apos;s performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">{c.label}</p>
              {c.icon}
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Rent Collected — {year}</h2>
        <div className="mt-4">
          <TrendChart title="" unit="₦" series={MONTHS.map((m, i) => ({ label: m, value: monthly[i] }))} color="#16a34a" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Units on the market</p>
          <p className="mt-1 text-lg font-bold text-green-600">{activeUnits} active</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Units rented out</p>
          <p className="mt-1 text-lg font-bold text-blue-600">{rentedUnits} rented</p>
        </div>
        <Link href="/dashboard/wallet" className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:border-brand">
          <p className="text-xs font-medium text-zinc-400">Wallet available</p>
          <p className="mt-1 text-lg font-bold text-brand-dark">{formatNaira(wallet?.balance ?? 0)}</p>
          <p className="mt-0.5 text-[11px] text-brand">Open wallet →</p>
        </Link>
      </div>
    </div>
  );
}
