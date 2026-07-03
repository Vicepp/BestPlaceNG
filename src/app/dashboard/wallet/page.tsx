"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet as WalletIcon, Lock, Banknote, Building2, Info, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import { getWallet, savePayoutBank, NIGERIAN_BANKS, type Wallet } from "@/data/wallet";
import { formatNaira } from "@/data/apartments";

export default function WalletPage() {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const w = await getWallet(user.uid);
    setWallet(w);
    if (w.bank) {
      setBankCode(w.bank.bankCode);
      setAccountNumber(w.bank.accountNumber);
      setAccountName(w.bank.accountName);
    } else if (profile?.displayName && !accountName) {
      setAccountName(profile.displayName);
    }
    setLoading(false);
  }, [user, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function handleSaveBank() {
    if (!user || !bankCode || !accountNumber.trim() || !accountName.trim()) {
      setMsg({ kind: "err", text: "Fill in bank, account number and account name." });
      return;
    }
    setSavingBank(true);
    const bankName = NIGERIAN_BANKS.find((b) => b.code === bankCode)?.name ?? "";
    const res = await savePayoutBank(user.uid, { bankName, bankCode, accountNumber: accountNumber.trim(), accountName: accountName.trim() });
    setSavingBank(false);
    setMsg(res.ok ? { kind: "ok", text: "Payout account saved." } : { kind: "err", text: res.error });
    load();
  }

  async function handleWithdraw() {
    if (!user) return;
    setWithdrawing(true);
    setMsg(null);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const res = await fetch("/api/payments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      setMsg(json.ok
        ? { kind: "ok", text: `Withdrawal of ${formatNaira(json.amount)} initiated (${json.status}). It will reflect in your bank shortly.` }
        : { kind: "err", text: json.error ?? "Withdrawal failed." });
    } catch {
      setMsg({ kind: "err", text: "Withdrawal failed. Please try again." });
    }
    setWithdrawing(false);
    load();
  }

  if (loading) return <p className="text-sm text-zinc-400">Loading wallet…</p>;
  const w = wallet!;
  const hasBank = Boolean(w.bank?.accountNumber);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><WalletIcon className="h-6 w-6 text-brand" /> Wallet</h1>
        <p className="mt-1 text-sm text-zinc-500">Rent you receive is held safely until the tenant confirms move-in, then it becomes available to withdraw to your bank.</p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1 text-xs font-medium text-zinc-400"><Banknote className="h-3.5 w-3.5" /> Available</p>
          <p className="mt-2 text-2xl font-bold text-brand-dark">{formatNaira(w.balance)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1 text-xs font-medium text-zinc-400"><Lock className="h-3.5 w-3.5" /> Held in escrow</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatNaira(w.held)}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Released when tenants confirm move-in</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Total received</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatNaira(w.totalReceived)}</p>
          {w.totalWithdrawn ? <p className="mt-1 text-[11px] text-zinc-400">Withdrawn: {formatNaira(w.totalWithdrawn)}</p> : null}
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      {/* Withdraw */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Withdraw to bank</h2>
        <p className="mt-1 text-xs text-zinc-400">Sends your full available balance to your saved bank account via Paystack.</p>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || w.balance <= 0 || !hasBank}
          className="mt-3 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {withdrawing ? "Processing…" : w.balance > 0 ? `Withdraw ${formatNaira(w.balance)}` : "No funds available"}
        </button>
        {!hasBank && <p className="mt-2 text-xs text-red-500">Add your bank account below first.</p>}
      </div>

      {/* Payout bank details */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Building2 className="h-4 w-4 text-brand" /> Payout account</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Bank</label>
            <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
              <option value="">Select your bank</option>
              {NIGERIAN_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Account number</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="10-digit NUBAN" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Account name</label>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="As it appears at the bank" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>
        <button onClick={handleSaveBank} disabled={savingBank} className="mt-3 rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand disabled:opacity-60">
          {savingBank ? "Saving…" : hasBank ? "Update account" : "Save account"}
        </button>
        {hasBank && (
          <p className="mt-2 flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3.5 w-3.5" /> {w.bank!.bankName} · {w.bank!.accountNumber}</p>
        )}
      </div>

      <div className="flex gap-2 rounded-xl bg-brand-light p-4 text-xs text-brand-dark">
        <Info className="h-4 w-4 shrink-0" />
        <p>How it works: tenants pay into escrow → you set a move-in date → the tenant confirms move-in → the rent moves to your Available balance → you withdraw to your bank. This protects both sides.</p>
      </div>
    </div>
  );
}
