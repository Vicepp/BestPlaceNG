"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, MapPin, FileText, Download, Zap, Wrench, ArrowLeft, MapPinned, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFirestoreDoc } from "@/lib/firestoreData";
import { getTenanciesForTenantLive, type Tenancy } from "@/data/tenancies";
import { getPaymentsForTenantLive, createTenantInvoice, type Payment } from "@/data/payments";
import { getUtilityFeesForTenant, getUtilityRequestsForTenant, markUtilityRequestPaid, type UtilityFee, type UtilityPaymentRequest } from "@/data/utilityFees";
import { formatNaira, type ApartmentListing } from "@/data/apartments";
import { cities } from "@/data/cities";
import { isPaystackConfigured, payWithPaystack } from "@/lib/paystack";
import PayNowButton from "@/components/dashboard/PayNowButton";

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [apt, setApt] = useState<ApartmentListing | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fees, setFees] = useState<UtilityFee[]>([]);
  const [requests, setRequests] = useState<UtilityPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingReq, setPayingReq] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const tenancies = await getTenanciesForTenantLive(user.uid);
    const t = tenancies.find((x) => x.id === id) ?? null;
    setTenancy(t);
    if (t) {
      const [a, p, f, r] = await Promise.all([
        getFirestoreDoc<ApartmentListing>("apartments", t.apartmentId),
        getPaymentsForTenantLive(user.uid),
        getUtilityFeesForTenant(user.uid),
        getUtilityRequestsForTenant(user.uid),
      ]);
      setApt(a);
      setPayments(p.filter((x) => x.tenancyId === t.id));
      setFees(f.filter((x) => x.tenancyId === t.id && x.status === "active"));
      setRequests(r.filter((x) => x.tenancyId === t.id));
    }
    setLoading(false);
  }, [user, id]);

  useEffect(() => { load(); }, [load]);

  async function payUtility(reqDoc: UtilityPaymentRequest) {
    if (!user?.email || !tenancy) return;
    if (!isPaystackConfigured()) return;
    setPayingReq(reqDoc.id);
    const invoice = await createTenantInvoice({
      tenancyId: tenancy.id,
      apartmentId: tenancy.apartmentId,
      apartmentTitle: `${reqDoc.feeName} — ${tenancy.apartmentTitle}`,
      landlordId: tenancy.landlordId,
      tenantId: user.uid,
      amount: reqDoc.amount,
    });
    if (!invoice.ok) { setPayingReq(null); return; }
    payWithPaystack({
      email: user.email,
      amountNaira: reqDoc.amount,
      reference: `bpng-${invoice.id}-${Date.now()}`,
      paymentId: invoice.id,
      onSuccess: async (ref) => {
        const res = await fetch("/api/payments/verify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref, paymentId: invoice.id }),
        });
        const json = await res.json();
        if (json.ok) await markUtilityRequestPaid(reqDoc.id);
        setPayingReq(null);
        load();
      },
      onClose: () => setPayingReq(null),
    });
  }

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (!tenancy) return (
    <div className="py-16 text-center">
      <p className="text-sm text-zinc-500">Rental not found.</p>
      <Link href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-brand">← Back to dashboard</Link>
    </div>
  );

  const city = cities.find((c) => c.slug === tenancy.citySlug);
  const isActive = tenancy.status === "active";
  const pendingRent = payments.filter((p) => p.status === "pending");
  const paidPayments = payments.filter((p) => p.status === "success");
  const pendingReqs = requests.filter((r) => r.status === "pending");

  return (
    <div className="max-w-3xl space-y-5">
      <button onClick={() => router.push("/dashboard")} className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </button>

      {/* Property header */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand"><Home className="h-6 w-6" /></span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground">{tenancy.apartmentTitle}</h1>
            <p className="flex items-center gap-1 text-sm text-zinc-500"><MapPin className="h-3.5 w-3.5" /> {apt?.area ?? ""}{city ? `, ${city.name}` : ""}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-accent/20 text-accent-dark"}`}>
              {isActive ? "Active tenancy" : tenancy.status}
            </span>
          </div>
        </div>
        {/* Full address — visible now the tenant has paid/active */}
        {isActive && apt?.fullAddress && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <MapPinned className="h-4 w-4 shrink-0 text-brand" /> {apt.fullAddress}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/city/${tenancy.citySlug}`} className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-brand hover:border-brand">
            <MapPinned className="h-4 w-4" /> Visit {city?.name ?? "city"}
          </Link>
          <Link href="/dashboard/maintenance" className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">
            <Wrench className="h-4 w-4" /> Request maintenance
          </Link>
        </div>
      </div>

      {/* Rent payments due */}
      {pendingRent.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">Rent Due</h2>
          <div className="space-y-3">
            {pendingRent.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{formatNaira(p.amount)}</p>
                  <p className="text-xs text-zinc-400">Due {new Date(p.dueDate).toLocaleDateString()}</p>
                </div>
                <PayNowButton payment={p} onSuccess={load} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilities */}
      {(fees.length > 0 || pendingReqs.length > 0) && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground"><Zap className="h-4 w-4 text-accent" /> Utilities &amp; Other Fees</h2>

          {pendingReqs.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-500">Payment requested by your landlord</p>
              {pendingReqs.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.feeName}</p>
                    <p className="text-xs text-zinc-400">{formatNaira(r.amount)}/{r.period} · due {new Date(r.dueDate).toLocaleDateString()}</p>
                  </div>
                  {isPaystackConfigured() ? (
                    <button onClick={() => payUtility(r)} disabled={payingReq === r.id} className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                      {payingReq === r.id ? "Processing…" : `Pay ${formatNaira(r.amount)}`}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400">Pay landlord directly</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {fees.length > 0 && (
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="mb-2 text-xs font-semibold text-zinc-500">Recurring charges on this unit</p>
              <div className="space-y-1.5">
                {fees.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{f.name}</span>
                    <span className="text-zinc-500">{formatNaira(f.amount)}/{f.period}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tenancy agreement / clause (read-only — locked once signed) */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><FileText className="h-4 w-4 text-brand" /> Your Tenancy Agreement</h2>
        <p className="mt-1 text-xs text-zinc-400">You accepted these terms{tenancy.agreedAt ? ` on ${new Date(tenancy.agreedAt).toLocaleDateString()}` : ""}. The landlord cannot change them for your tenancy.</p>
        {apt?.clauseText && (
          <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600">{apt.clauseText}</div>
        )}
        {apt?.clausePdfUrl && (
          <a href={apt.clausePdfUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-brand hover:border-brand">
            <Download className="h-4 w-4" /> Download agreement (PDF)
          </a>
        )}
        {!apt?.clauseText && !apt?.clausePdfUrl && (
          <p className="mt-2 text-sm text-zinc-500">No written clause was attached to this property.</p>
        )}
      </div>

      {/* Payment history */}
      {paidPayments.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">Payment History</h2>
          <div className="space-y-2">
            {paidPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-foreground"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> {formatNaira(p.amount)}</span>
                <span className="text-xs text-zinc-400">{p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : "Paid"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
