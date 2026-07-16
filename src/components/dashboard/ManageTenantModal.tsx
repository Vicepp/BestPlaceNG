"use client";

import { useEffect, useState } from "react";
import { X, Zap, Trash2, CreditCard, Plus, CalendarClock, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/data/apartments";
import { generateInvoice } from "@/data/payments";
import { setMoveInDate } from "@/data/tenancies";
import { createNotification } from "@/data/notifications";
import {
  getUtilityFeesForTenancy,
  createUtilityFee,
  removeUtilityFee,
  reactivateUtilityFee,
  requestUtilityPayment,
  type UtilityFee,
  type UtilityPeriod,
} from "@/data/utilityFees";
import type { Tenancy } from "@/data/tenancies";

export default function ManageTenantModal({ tenancy, onClose }: { tenancy: Tenancy; onClose: () => void }) {
  const { user } = useAuth();
  const [fees, setFees] = useState<UtilityFee[]>([]);
  const [feeName, setFeeName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feePeriod, setFeePeriod] = useState<UtilityPeriod>("monthly");
  const [rentAmount, setRentAmount] = useState(String(tenancy.rentAmount));
  const [rentDue, setRentDue] = useState("");
  const [moveIn, setMoveIn] = useState(tenancy.moveInDate ? tenancy.moveInDate.slice(0, 10) : "");
  const [savedMoveIn, setSavedMoveIn] = useState(tenancy.moveInDate ?? "");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function saveMoveIn() {
    if (!moveIn || !tenancy.tenantId) return;
    setBusy(true);
    const iso = new Date(moveIn).toISOString();
    await setMoveInDate(tenancy.id, iso);
    setSavedMoveIn(iso);
    createNotification({
      userId: tenancy.tenantId,
      type: "tenancy",
      title: "Move-in date set",
      body: `Your landlord set your move-in date for ${tenancy.apartmentTitle} to ${new Date(iso).toLocaleDateString()}. Confirm once you've moved in to release your rent.`,
      link: "/dashboard",
    }).catch(() => {});
    setBusy(false);
    setMsg("Move-in date saved and tenant notified.");
  }

  async function loadFees() {
    setFees(await getUtilityFeesForTenancy(tenancy.id));
  }
  useEffect(() => { loadFees(); }, [tenancy.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const canManage = tenancy.status === "active" && tenancy.tenantId;

  async function addFee() {
    if (!user || !tenancy.tenantId || !feeName.trim() || !feeAmount) return;
    setBusy(true);
    await createUtilityFee({
      tenancyId: tenancy.id,
      apartmentId: tenancy.apartmentId,
      apartmentTitle: tenancy.apartmentTitle,
      landlordId: user.uid,
      tenantId: tenancy.tenantId,
      tenantName: tenancy.tenantName,
      name: feeName.trim(),
      amount: Number(feeAmount),
      period: feePeriod,
    });
    setFeeName(""); setFeeAmount("");
    await loadFees();
    setBusy(false);
    setMsg("Utility fee added.");
  }

  async function requestFeePayment(fee: UtilityFee) {
    if (!user || !tenancy.tenantId) return;
    setBusy(true);
    await requestUtilityPayment({
      utilityFeeId: fee.id,
      tenancyId: tenancy.id,
      apartmentId: tenancy.apartmentId,
      apartmentTitle: tenancy.apartmentTitle,
      landlordId: user.uid,
      tenantId: tenancy.tenantId,
      tenantName: tenancy.tenantName,
      feeName: fee.name,
      amount: fee.amount,
      period: fee.period,
      dueDate: new Date(Date.now() + 7 * 864e5).toISOString(),
    });
    createNotification({
      userId: tenancy.tenantId,
      type: "payment_made",
      title: `Payment request: ${fee.name}`,
      body: `Your landlord requested ${formatNaira(fee.amount)} for ${fee.name} at ${tenancy.apartmentTitle}.`,
      link: "/dashboard",
    }).catch(() => {});
    setBusy(false);
    setMsg(`Requested ${fee.name} payment from ${tenancy.tenantName}.`);
  }

  async function sendRentInvoice() {
    if (!user || !tenancy.tenantId || !rentAmount) return;
    setBusy(true);
    const res = await generateInvoice({
      tenancyId: tenancy.id,
      apartmentId: tenancy.apartmentId,
      apartmentTitle: tenancy.apartmentTitle,
      landlordId: user.uid,
      tenantId: tenancy.tenantId,
      amount: Number(rentAmount),
      dueDate: rentDue ? new Date(rentDue).toISOString() : new Date(Date.now() + 14 * 864e5).toISOString(),
    });
    if (res.ok) {
      createNotification({
        userId: tenancy.tenantId,
        type: "payment_made",
        title: "New rent invoice",
        body: `${formatNaira(Number(rentAmount))} rent invoice for ${tenancy.apartmentTitle}.`,
        link: "/dashboard",
      }).catch(() => {});
      setMsg("Rent invoice sent to tenant.");
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Manage {tenancy.tenantName}</h2>
            <p className="text-xs text-zinc-400">{tenancy.apartmentTitle} · {tenancy.tenantEmail}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {!canManage ? (
          <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            This tenant isn&apos;t active yet. Once they accept and pay, you can add utility fees and send invoices here.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Rent invoice */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground"><CreditCard className="h-4 w-4 text-brand" /> Send Rent Invoice</h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Amount (₦)</label>
                  <input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Due date</label>
                  <input type="date" value={rentDue} onChange={(e) => setRentDue(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <button onClick={sendRentInvoice} disabled={busy} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">Send</button>
              </div>
            </section>

            {/* Move-in date (escrow release gate) */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <CalendarClock className="h-4 w-4 text-brand" /> Move-in Date
                <span className="group relative inline-flex">
                  <Info className="h-3.5 w-3.5 cursor-help text-zinc-400" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-56 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-[11px] font-normal text-white opacity-0 transition group-hover:opacity-100">
                    Set a move-in date within two weeks to one month. Your rent is held safely until the tenant confirms move-in — a sooner date gets your money to you faster.
                  </span>
                </span>
              </h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Agreed move-in date</label>
                  <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <button onClick={saveMoveIn} disabled={busy || !moveIn} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">Save</button>
              </div>
              {savedMoveIn && (
                <p className="mt-2 text-xs text-zinc-500">
                  Current: <strong className="text-foreground">{new Date(savedMoveIn).toLocaleDateString()}</strong>
                  {tenancy.moveInConfirmed ? " · tenant has confirmed move-in ✓" : " · waiting for tenant to confirm move-in"}
                </p>
              )}
            </section>

            {/* Utility fees */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Zap className="h-4 w-4 text-accent" /> Utility &amp; Other Fees
                {fees.length > 0 && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                    {fees.filter((f) => f.status === "active").length} active
                  </span>
                )}
              </h3>
              {fees.length === 0 && (
                <p className="mb-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-3 text-center text-xs text-zinc-400">
                  No fees added for {tenancy.tenantName} yet — every fee you add appears here.
                </p>
              )}
              <div className="space-y-2">
                {fees.map((f) => (
                  <div key={f.id} className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${f.status === "removed" ? "border-zinc-100 opacity-50" : "border-zinc-100"}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-zinc-400">{formatNaira(f.amount)}/{f.period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.status === "active" ? (
                        <>
                          <button onClick={() => requestFeePayment(f)} disabled={busy} className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-60">Request payment</button>
                          <button onClick={async () => { await removeUtilityFee(f.id); loadFees(); }} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </>
                      ) : (
                        <button onClick={async () => { await reactivateUtilityFee(f.id); loadFees(); }} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">Re-add</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Add fee */}
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-zinc-50 p-3">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Fee name</label>
                  <input value={feeName} onChange={(e) => setFeeName(e.target.value)} placeholder="e.g. Electricity, Service charge" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Amount</label>
                  <input type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Period</label>
                  <select value={feePeriod} onChange={(e) => setFeePeriod(e.target.value as UtilityPeriod)} className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm outline-none focus:border-brand">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <button onClick={addFee} disabled={busy} className="flex items-center gap-1 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"><Plus className="h-3.5 w-3.5" /> Add</button>
              </div>
              {fees.some((f) => f.status === "active") && (
                <p className="mt-2 text-xs font-semibold text-zinc-500">
                  Total active fees:{" "}
                  {(() => {
                    const act = fees.filter((f) => f.status === "active");
                    const monthly = act.filter((f) => f.period === "monthly").reduce((s, f) => s + f.amount, 0);
                    const yearly = act.filter((f) => f.period === "yearly").reduce((s, f) => s + f.amount, 0);
                    return [monthly ? `${formatNaira(monthly)}/month` : "", yearly ? `${formatNaira(yearly)}/year` : ""].filter(Boolean).join(" + ");
                  })()}
                </p>
              )}
              <p className="mt-2 text-[11px] text-zinc-400">Fees are per-tenant — only this tenant sees the ones you add here.</p>
            </section>

            {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">{msg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
