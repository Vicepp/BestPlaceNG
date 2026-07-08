"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getPaymentsForLandlordLive, getPaymentsForTenantLive, generateInvoice, type Payment } from "@/data/payments";
import { getTenanciesForLandlordLive, type Tenancy } from "@/data/tenancies";
import { formatNaira } from "@/data/apartments";
import { CheckCircle, Clock, XCircle, CreditCard } from "lucide-react";

const STATUS_STYLES: Record<string, { cls: string; icon: React.ReactNode }> = {
  pending: { cls: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3.5 w-3.5" /> },
  success: { cls: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  failed:  { cls: "bg-red-100  text-red-700",    icon: <XCircle className="h-3.5 w-3.5" />    },
};

export default function PaymentsPage() {
  const { user, activeView } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTenancy, setSelectedTenancy] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLandlord = activeView === "landlord";

  async function load() {
    if (!user) return;
    if (isLandlord) {
      const [p, t] = await Promise.all([getPaymentsForLandlordLive(user.uid), getTenanciesForLandlordLive(user.uid)]);
      setPayments([...p].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setTenancies(t.filter((t) => t.status === "active"));
    } else {
      const p = await getPaymentsForTenantLive(user.uid);
      setPayments([...p].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [user, isLandlord]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedTenancy || !amount || !dueDate) { setError("Please fill in all fields."); return; }
    const tenancy = tenancies.find((t) => t.id === selectedTenancy);
    if (!tenancy?.tenantId || !user) return;
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
  const pendingTotal   = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "pending" && new Date(p.dueDate) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLandlord ? "Payments Received" : "My Payments"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isLandlord ? "Rent collected from your tenants" : "Payments to your landlords"}
          </p>
        </div>
        {isLandlord && tenancies.length > 0 && (
          <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            + Generate Invoice
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-400">{isLandlord ? "Total Collected" : "Total Paid"}</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{formatNaira(totalCollected)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-400">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{formatNaira(pendingTotal)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-zinc-400">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatNaira(overdue.reduce((s, p) => s + p.amount, 0))}</p>
        </div>
      </div>

      {/* Invoice form */}
      {showForm && isLandlord && (
        <form onSubmit={handleGenerateInvoice} className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">New Invoice</h2>
          <select value={selectedTenancy} onChange={(e) => setSelectedTenancy(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="">Select tenancy</option>
            {tenancies.map((t) => <option key={t.id} value={t.id}>{t.tenantName} – {t.apartmentTitle}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount (₦)"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Saving..." : "Generate"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Payment history table */}
      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-zinc-200" />
          <p className="text-sm font-medium text-foreground">No payment records yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isLandlord ? "Generate an invoice to request rent from a tenant." : "Payments will appear here once your landlord requests rent."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-zinc-100">
            <h2 className="text-sm font-bold text-foreground">Payment History ({payments.length})</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {payments.map((p) => {
              const s = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending;
              const overdue = p.status === "pending" && new Date(p.dueDate) < new Date();
              // Each payment clicks through to where its details live: the
              // property page for landlords, the rental page for tenants.
              const detailHref = isLandlord
                ? p.apartmentId ? `/dashboard/properties/${p.apartmentId}` : undefined
                : p.tenancyId ? `/dashboard/rental/${p.tenancyId}` : undefined;
              const row = (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-zinc-50/60">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.kind === "utility" ? "bg-accent/20 text-accent-dark" : "bg-brand-light text-brand-dark"}`}>
                        {p.kind === "utility" ? "Utility" : "Rent"}
                      </span>
                      <p className="truncate text-sm font-semibold text-foreground">{p.apartmentTitle}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Due: <span className={overdue ? "font-semibold text-red-600" : ""}>{new Date(p.dueDate).toLocaleDateString()}{overdue ? " · Overdue" : ""}</span>
                    </p>
                    {p.verifiedAt && <p className="text-xs text-zinc-400">Paid: {new Date(p.verifiedAt).toLocaleDateString()}</p>}
                    {p.paystackReference && <p className="text-xs text-zinc-400">Ref: {p.paystackReference}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-foreground">{formatNaira(p.amount)}</p>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${s.cls}`}>
                      {s.icon} {p.status}
                    </span>
                  </div>
                </div>
              );
              return detailHref ? (
                <Link key={p.id} href={detailHref} className="block">{row}</Link>
              ) : (
                <div key={p.id}>{row}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
