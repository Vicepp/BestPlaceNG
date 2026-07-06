"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy, Mail, MessageSquare, ChevronDown, Wrench, CreditCard, Home } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does paying rent work?",
    a: "When you pay to rent a unit, your money is held safely (escrow). It's only released to the landlord after you confirm you've moved in — protecting you if anything goes wrong before move-in.",
  },
  {
    q: "I paid but I'm not marked as a tenant.",
    a: "Payment confirmation can take a few seconds. Refresh your dashboard. If it still doesn't show after a minute, your payment reference is safe — use 'Report a problem' on the rental page and we'll resolve it.",
  },
  {
    q: "How do landlords get their money?",
    a: "After the tenant confirms move-in, the rent moves to the landlord's Wallet as available balance. The landlord adds a bank account and withdraws it via the Wallet page.",
  },
  {
    q: "What are utility fees?",
    a: "Landlords can add recurring charges (electricity, water, service charge) to a specific tenant. You'll see them on your rental page with a Pay button, or you can request to pay a full year upfront.",
  },
  {
    q: "Can I switch between renting and being a landlord?",
    a: "Yes. Use the Landlord / Tenant toggle at the top of the dashboard (or in Settings) to switch views with the same account.",
  },
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-100">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground">
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-4 pb-3 text-sm leading-relaxed text-zinc-600">{a}</p>}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><LifeBuoy className="h-6 w-6 text-brand" /> Support</h1>
        <p className="mt-1 text-sm text-zinc-500">Answers to common questions, and how to reach us.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/dashboard/messages" className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-brand">
          <MessageSquare className="h-5 w-5 text-brand" />
          <div><p className="text-sm font-semibold text-foreground">Messages</p><p className="text-xs text-zinc-400">Chat your landlord/tenant</p></div>
        </Link>
        <Link href="/dashboard/maintenance" className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-brand">
          <Wrench className="h-5 w-5 text-accent" />
          <div><p className="text-sm font-semibold text-foreground">Maintenance</p><p className="text-xs text-zinc-400">Report a repair</p></div>
        </Link>
        <Link href="/dashboard/payments" className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-brand">
          <CreditCard className="h-5 w-5 text-green-600" />
          <div><p className="text-sm font-semibold text-foreground">Transactions</p><p className="text-xs text-zinc-400">Your payment history</p></div>
        </Link>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-foreground">Frequently asked</h2>
        {FAQS.map((f) => <Faq key={f.q} {...f} />)}
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Still need help?</h2>
        <p className="mt-1 text-sm text-zinc-600">
          A dispute with a landlord or tenant about a payment or move-in? Open your rental and use{" "}
          <strong>Report a problem</strong> — it goes straight to our admin team.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="mailto:support@bestplaceng.com" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            <Mail className="h-4 w-4" /> Email support@bestplaceng.com
          </a>
          <Link href="/apartments" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">
            <Home className="h-4 w-4" /> Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}
