"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getPaymentsForLandlordLive, generateInvoice, type Payment } from "@/data/payments";
import { getTenanciesForLandlordLive, type Tenancy } from "@/data/tenancies";
import { formatNaira } from "@/data/apartments";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  success: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTenancy, setSelectedTenancy] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!user) return;
    const [p, t] = await Promise.all([getPaymentsForLandlordLive(user.uid), getTenanciesForLandlordLive(user.uid)]);
    setPayments([...p].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setTenancies(t.filter((t) => t.status === "active"));
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedTenancy || !amount || !dueDate) { setError("Please fill in all fields."); return; }
    const tenancy = tenancies.find((t) => t.id === selectedTenancy);
    if (!tenancy || !tenancy.tenantId || !user) return;
    setSubmitting(true);
    const result = await generateInvoice({
      tenancyId: tenancy.id,
      apartmentId: tenancy.apartmentId,
      apartmentTitle: tenancy.apartmentTitle,
      landlordId: user.uid,
      tenantId: tenancy.tenantId,
      amount: Number(amount),
      dueDate,
    });
    setSubmitting(false);
    if (!result.ok) { setError(result.error); return; }
    setSelectedTenancy(""); setAmount(""); setDueDate(""); setShowForm(false);
    load();
  }

  const totalCollected = payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
  const overdueTotal = payments.filter((p) => p.status === "pending" && new Date(p.dueDate) < new Date()).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        {tenancies.length > 0 && (
          <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            + Generate Invoice
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-400">Total Collected</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">{formatNaira(totalCollected)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-400">Outstanding / Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatNaira(overdueTotal)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleGenerateInvoice} className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">New Invoice</h2>
          <select value={selectedTenancy} onChange={(e) => setSelectedTenancy(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="">Select tenancy</option>
            {tenancies.map((t) => (
              <option key={t.id} value={t.id}>{t.tenantName} – {t.apartmentTitle}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount (₦)" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{submitting ? "Sending..." : "Generate"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-600 hover:border-zinc-400">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-400">
          No invoices yet. Add a tenant to a property, then generate their first invoice.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Tenant</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const tenancy = tenancies.find((t) => t.id === p.tenancyId);
                const overdue = p.status === "pending" && new Date(p.dueDate) < new Date();
                return (
                  <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/properties/${p.apartmentId}`} className="font-medium text-brand hover:underline">
                        {p.apartmentTitle}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{tenancy?.tenantName ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold text-foreground">{formatNaira(p.amount)}</td>
                    <td className={`px-5 py-3 ${overdue ? "font-semibold text-red-600" : "text-zinc-500"}`}>{new Date(p.dueDate).toLocaleDateString()}{overdue ? " · Overdue" : ""}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
