"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, MapPin, Lock, FileText, Download, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFirestoreDoc } from "@/lib/firestoreData";
import { formatNaira, firstYearTotal, type ApartmentListing } from "@/data/apartments";
import { signAndRequestTenancy } from "@/data/tenancies";
import { createTenantInvoice } from "@/data/payments";
import { createNotification } from "@/data/notifications";
import { isPaystackConfigured, payWithPaystack } from "@/lib/paystack";
import { cities } from "@/data/cities";

export default function BecomeTenantPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [apt, setApt] = useState<ApartmentListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    getFirestoreDoc<ApartmentListing>("apartments", id).then((a) => { setApt(a); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (profile?.displayName) setName(profile.displayName);
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  if (loading) return <p className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-400">Loading…</p>;
  if (!apt) return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-sm text-zinc-500">This listing is no longer available.</p>
      <Link href="/apartments" className="mt-4 inline-block text-sm font-semibold text-brand">← Browse apartments</Link>
    </div>
  );

  if (!user) return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-sm text-foreground font-medium">Please sign in to rent this property</p>
      <div className="mt-4 flex justify-center gap-3">
        <Link href="/login" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">Login</Link>
        <Link href="/signup" className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-foreground">Create account</Link>
      </div>
    </div>
  );

  const city = cities.find((c) => c.slug === apt.citySlug);
  const total = firstYearTotal(apt);
  const isShop = apt.type === "Shop/Office";
  const kind: "apartment" | "shop" = isShop ? "shop" : "apartment";
  const unit = apt.purpose === "Rent" ? (apt.pricePeriod === "month" ? "/month" : "/year") : "";

  async function handleProceed() {
    setError("");
    if (!apt || !user) return;
    if (!apt.ownerId) { setError("This listing has no owner to pay — please contact support."); return; }
    if (!name.trim() || !phone.trim()) { setError("Enter your full name and phone number."); return; }
    if (!agreed) { setError("You must accept the landlord's terms to continue."); return; }
    if (!isPaystackConfigured()) { setError("Online payment isn't set up yet. Please contact the landlord to arrange payment."); return; }
    if (!user.email) { setError("Your account has no email on file."); return; }

    setBusy(true);
    setStatus("Recording your signed agreement…");
    const tenancy = await signAndRequestTenancy({
      apartmentId: apt.id,
      citySlug: apt.citySlug,
      apartmentTitle: apt.title,
      landlordId: apt.ownerId,
      tenantId: user.uid,
      tenantName: name.trim(),
      tenantEmail: user.email,
      rentAmount: apt.priceNaira,
      rentPeriod: apt.pricePeriod === "month" ? "month" : "year",
      unitKind: kind,
      signedName: name.trim(),
      signedPhone: phone.trim(),
    });
    if (!tenancy.ok) { setBusy(false); setError(tenancy.error); return; }

    setStatus("Creating your invoice…");
    const invoice = await createTenantInvoice({
      tenancyId: tenancy.id,
      apartmentId: apt.id,
      apartmentTitle: apt.title,
      landlordId: apt.ownerId,
      tenantId: user.uid,
      amount: total,
    });
    if (!invoice.ok) { setBusy(false); setError(invoice.error); return; }

    setStatus("Opening secure payment…");
    payWithPaystack({
      email: user.email,
      amountNaira: total,
      reference: `bpng-${invoice.id}-${Date.now()}`,
      paymentId: invoice.id,
      onSuccess: async (ref) => {
        setStatus("Confirming payment…");
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref, paymentId: invoice.id }),
        });
        const json = await res.json();
        if (json.ok) {
          createNotification({
            userId: apt.ownerId!,
            type: "tenancy",
            title: "New tenant moved in 🎉",
            body: `${name.trim()} has paid and become a tenant at ${apt.title}.`,
            link: "/dashboard/tenants",
          }).catch(() => {});
          setStatus("Done! You're now a tenant.");
          router.push("/dashboard");
        } else {
          setBusy(false);
          setError(json.error ?? "Payment could not be verified. Please contact your landlord.");
        }
      },
      onClose: () => { setBusy(false); setStatus(""); },
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href={`/city/${apt.citySlug}/apartments`} className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to listings
      </Link>

      <h1 className="text-2xl font-extrabold text-foreground">Become a Tenant</h1>
      <p className="mt-1 text-sm text-zinc-500">Review the property, accept the landlord&apos;s terms, then pay to move in.</p>

      {/* Property info */}
      <div className="mt-6 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand"><Home className="h-6 w-6" /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{apt.type} · For {apt.purpose}</p>
            <h2 className="text-lg font-bold text-foreground">{apt.title}</h2>
            <p className="flex items-center gap-1 text-sm text-zinc-500"><MapPin className="h-3.5 w-3.5" /> {apt.area}{city ? `, ${city.name}` : ""}</p>
          </div>
        </div>
        {/* Full address hidden until payment */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
          <Lock className="h-4 w-4 shrink-0" />
          The exact address is revealed to you right after your payment is confirmed.
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">What you pay to move in (first {apt.pricePeriod === "month" ? "month" : "year"})</h3>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label={`Rent${unit}`} value={formatNaira(apt.priceNaira)} />
          {apt.cautionFee ? <Row label="Caution / deposit (refundable)" value={formatNaira(apt.cautionFee)} /> : null}
          {apt.agencyFee ? <Row label="Agency fee" value={formatNaira(apt.agencyFee)} /> : null}
          {apt.agreementFee ? <Row label="Agreement fee" value={formatNaira(apt.agreementFee)} /> : null}
          {apt.legalFee ? <Row label="Legal fee" value={formatNaira(apt.legalFee)} /> : null}
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold text-foreground">
            <span>Total today</span><span className="text-brand-dark">{formatNaira(total)}</span>
          </div>
        </div>
      </div>

      {/* Landlord clause / agreement */}
      <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><FileText className="h-4 w-4 text-brand" /> Tenancy Agreement &amp; House Rules</h3>
        {apt.clauseText || apt.clausePdfUrl ? (
          <>
            {apt.clauseText && (
              <div className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600">
                {apt.clauseText}
              </div>
            )}
            {apt.clausePdfUrl && (
              <a href={apt.clausePdfUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-brand hover:border-brand">
                <Download className="h-4 w-4" /> Download the full agreement (PDF)
              </a>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">The landlord hasn&apos;t uploaded specific terms for this property. Standard Nigerian tenancy terms apply — confirm details directly with the landlord after moving in.</p>
        )}
      </div>

      {/* Sign form */}
      <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><ShieldCheck className="h-4 w-4 text-brand" /> Sign &amp; Accept</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Full name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Phone number *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803 123 4567" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
          I have read and agree to the landlord&apos;s tenancy agreement, house rules, and the terms &amp; conditions of this platform.
        </label>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {status && !error && <p className="mt-3 text-xs font-medium text-brand">{status}</p>}

        <button
          onClick={handleProceed}
          disabled={busy || !agreed}
          className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Please wait…" : `Make Payment · ${formatNaira(total)}`}
        </button>
        <p className="mt-2 text-center text-[11px] text-zinc-400">
          Secured by Paystack. Your payment is held safely and released to the landlord; you become a tenant automatically once payment is confirmed.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-zinc-600">
      <span>{label}</span><span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
