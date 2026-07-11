"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LifeBuoy, Mail, MessageSquare, ChevronDown, Wrench, CreditCard, Search,
  Home, Building2, ShieldCheck, Zap, Send, Paperclip, CheckCircle, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addFirestoreDoc } from "@/lib/firestoreWrite";
import { uploadFile } from "@/lib/storage";

/* ── FAQ knowledge base — searchable, category-tagged ─────────── */

const CATEGORIES = ["All", "General", "Account", "Landlords", "Tenants", "Payments", "Messaging", "Troubleshooting", "Safety"] as const;
type Category = (typeof CATEGORIES)[number];

const FAQS: { q: string; a: string; cat: Exclude<Category, "All"> }[] = [
  // General
  { cat: "General", q: "What is BestPlaceNG?", a: "BestPlaceNG helps you find the best place to live in Nigeria — compare 750+ cities on cost of living, safety, power, schools and more, then rent an apartment there directly from the landlord, with payments protected in-app." },
  { cat: "General", q: "Is BestPlaceNG free to use?", a: "Browsing city data, listings and the directory is completely free. Listing a property or business is free too. Rent is paid securely in-app through Paystack — tenants pay no extra platform fee on top of their rent." },
  { cat: "General", q: "Can I switch between renting and being a landlord?", a: "Yes. One account does both — use the Landlord / Tenant toggle at the top of the dashboard (or in Settings → Profile) to switch views any time." },
  // Account
  { cat: "Account", q: "How do I change my password?", a: "Go to Settings → Password, enter your current password and the new one, then Update Password. If you've forgotten it entirely, log out and use the reset option on the login page." },
  { cat: "Account", q: "What is KYC and why should I complete it?", a: "KYC (Settings → KYC) verifies your identity with your name as on your NIN, your NIN number, a selfie and an ID document. It builds trust between landlords and tenants. Your details are stored privately — only you and verification staff can access them; they never appear on your public profile." },
  { cat: "Account", q: "How do I manage the listings I've added (church, school, market…)?", a: "Dashboard → My Listings shows everything you've added to city directories in a grid. You can edit details, add a photo or a YouTube video, or delete a listing there." },
  // Landlords
  { cat: "Landlords", q: "How do I list a property?", a: "From the dashboard: Properties → New Building to group units, or Add Unit for a standalone listing. Add photos, price and details — your listing appears in that city's Apartments section immediately." },
  { cat: "Landlords", q: "How do I get my money?", a: "When a tenant pays rent, the money is held in escrow. Once the tenant confirms they've moved in, it moves to your Wallet as an available balance. Add your bank account on the Wallet page and withdraw any time." },
  { cat: "Landlords", q: "How do tour bookings work?", a: "In Settings → Tour Bookings choose the built-in calendar (set the days and hours you're available — tenants can only book those, and booked slots block automatically) or paste your own Calendly-style link (only known schedulers are accepted, to prevent phishing). Bookings land in your DMs and on your Tour Calendar page." },
  { cat: "Landlords", q: "Can I transfer a property to another landlord?", a: "Yes — Properties → the 3-dot menu on a unit or building → Transfer. Look the new owner up by email and confirm. Rented units move with their tenants, the group chat switches to the new owner, and everyone is notified." },
  { cat: "Landlords", q: "What happens when my tenant leaves?", a: "The tenant gives a reason when they leave, which you'll see in the notification. The unit goes to your Archive — not back on the market — so you re-list it whenever you're ready (Properties → Show archived → Re-list)." },
  // Tenants
  { cat: "Tenants", q: "How do I rent an apartment?", a: "Open a listing → Become a Tenant. You'll review the landlord's terms, sign, and pay securely in-app. Your money is held in escrow and only released to the landlord after you confirm you've moved in." },
  { cat: "Tenants", q: "I paid but I'm not marked as a tenant.", a: "Payment confirmation can take a few seconds — refresh your dashboard. If it still doesn't show after a minute your payment reference is safe: open the rental page and use Report a Problem, and we'll resolve it." },
  { cat: "Tenants", q: "How do I schedule a tour?", a: "On any listing (or inside your chat with the landlord) tap Schedule a Tour. Pick from the days and times the landlord has opened; your booking goes straight to their DMs and blocks that slot for everyone else." },
  { cat: "Tenants", q: "What are utility fees?", a: "Landlords can attach recurring charges (electricity, water, service charge) to your tenancy. They show on your rental page with a Pay button, or you can ask to pay a period upfront." },
  { cat: "Tenants", q: "How do I leave my apartment?", a: "Open your rental → Leave Apartment. Pick a reason (it's shared with your landlord and saved), confirm, and your tenancy ends. You can do this before your next payment period starts." },
  // Payments
  { cat: "Payments", q: "Is my rent money safe?", a: "Yes — rent is held in escrow when you pay and is only released to the landlord after you confirm move-in. If something goes wrong before that, use Report a Problem on the rental page and the admin team steps in." },
  { cat: "Payments", q: "What payment methods are supported?", a: "Payments run through Paystack, so you can pay with a Nigerian debit card, bank transfer or USSD, in naira." },
  { cat: "Payments", q: "Why should I keep payments on the platform?", a: "On-platform payments give you an escrow safety net, a verified receipt trail, dispute resolution and stored message history. Off-platform deals have none of that — no payment protection, no dispute support, and a much higher risk of scams." },
  // Messaging
  { cat: "Messaging", q: "How does messaging work?", a: "Message any landlord directly from a listing — no agents in between. Once a tenancy is active you also get a property group chat with your landlord. Photos and property cards can be shared in-chat." },
  // Troubleshooting
  { cat: "Troubleshooting", q: "My payment says 'verification failed'.", a: "Your money is not lost — if you were charged, the payment will reflect shortly. Refresh your dashboard after a minute. If it still hasn't appeared, use Report a Problem with your payment reference and we'll trace it." },
  { cat: "Troubleshooting", q: "My new listing isn't showing on the city page.", a: "Public pages cache for a few minutes — new listings typically appear within about 5 minutes. Your own dashboard shows them instantly." },
  // Safety
  { cat: "Safety", q: "How do I avoid scams?", a: "Never pay rent outside the app — escrow protection only works in-platform. Booking links are restricted to known schedulers, video links to YouTube. If a listing looks wrong or fake, open it and use Report This Listing; for landlord/tenant disputes use Report a Problem on the rental page." },
  { cat: "Safety", q: "How do I report a listing, landlord or problem?", a: "Every directory listing page has a Report This Listing link. For tenancy issues (payments, move-in, property condition, conduct) open your rental page → Report a Problem — it goes straight to the admin team." },
];

/* ── How it works ──────────────────────────────────────────────── */

const TENANT_STEPS = [
  { t: "Compare cities & browse listings", d: "Filter by cost of living, safety, power supply and price across 750+ Nigerian cities." },
  { t: "Check the details", d: "Real photos, clear annual pricing, amenities and the landlord's terms on every listing." },
  { t: "Message & schedule a tour", d: "Talk to the landlord directly in-app and book a viewing slot that works for you." },
  { t: "Pay securely in-app", d: "Sign the terms and pay through Paystack — your money is held in escrow, not sent straight to the landlord." },
  { t: "Confirm move-in", d: "Once you're in, confirm it — only then is the rent released. You're protected until you have the keys." },
];

const LANDLORD_STEPS = [
  { t: "List your property free", d: "Add buildings and units with photos and pricing — live on the city page in minutes." },
  { t: "Set your tour availability", d: "Open the days and hours you're free; bookings land in your DMs and calendar automatically." },
  { t: "Approve your tenant", d: "Review requests, chat directly, and approve who moves in — no agents in between." },
  { t: "Rent arrives in escrow", d: "The tenant pays in-app; the money is held safely until they confirm move-in." },
  { t: "Withdraw to your bank", d: "Released rent sits in your Wallet — add your bank account and withdraw any time." },
];

const WHY_US = [
  { icon: Search, title: "Smarter Search", text: "Filter homes by city data nobody else has — cost of living, safety, daily power hours, commute times and more." },
  { icon: ShieldCheck, title: "Verified & Protected", text: "KYC identity checks, escrow-protected rent, whitelisted booking links and a report system on every listing." },
  { icon: MessageSquare, title: "Direct Messaging", text: "Talk straight to the landlord or tenant in-app — no agent interference, no runaround, full message history." },
  { icon: Zap, title: "Seamless Payouts", text: "Rent paid in-app is released after move-in and lands in the landlord's wallet — withdraw directly to a Nigerian bank." },
];

const SUBJECTS = ["Payment or wallet issue", "Problem with a listing", "Tenancy dispute", "Tour booking issue", "Account or KYC", "Report a bug", "Partnership / business", "Something else"];

/* ── Components ────────────────────────────────────────────────── */

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-100 bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground">
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-4 pb-3 text-sm leading-relaxed text-zinc-600">{a}</p>}
    </div>
  );
}

export default function SupportPage() {
  const { user, profile, activeView } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");

  // Contact form
  const [userType, setUserType] = useState(activeView === "landlord" ? "Landlord" : "Tenant");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => (category === "All" || f.cat === category) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)));
  }, [query, category]);

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - attachments.length);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const res = await uploadFile(file, "support");
      if (res.ok) setAttachments((prev) => [...prev, res.url]);
    }
    setUploading(false);
  }

  async function submitTicket() {
    if (!user) return;
    if (!message.trim()) { setError("Tell us what's going on — a few sentences is perfect."); return; }
    setError("");
    setSending(true);
    const res = await addFirestoreDoc("supportTickets", {
      userId: user.uid,
      name: profile?.displayName ?? user.email ?? "User",
      email: user.email ?? "",
      userType,
      subject,
      message: message.trim(),
      attachments,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    setSending(false);
    if (!res.ok) { setError(res.error ?? "Couldn't send — please try again."); return; }
    setSent(true);
  }

  return (
    <div className="max-w-3xl space-y-10">
      {/* Hero + search */}
      <div className="rounded-2xl bg-gradient-to-b from-brand-light to-white p-8 text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-foreground"><LifeBuoy className="h-7 w-7 text-brand" /> How can we help?</h1>
        <p className="mt-2 text-sm text-zinc-500">Search the help centre, or browse by topic below.</p>
        <div className="relative mx-auto mt-5 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help… e.g. escrow, tour, withdraw"
            className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-brand" />
        </div>
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

      {/* How it works */}
      <section>
        <h2 className="text-xl font-bold text-foreground">How it works</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Home className="h-4 w-4 text-brand" /> For Tenants</h3>
            <ol className="mt-4 space-y-4">
              {TENANT_STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">{i + 1}</span>
                  <div><p className="text-sm font-semibold text-foreground">{s.t}</p><p className="text-xs text-zinc-500">{s.d}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Building2 className="h-4 w-4 text-accent" /> For Landlords</h3>
            <ol className="mt-4 space-y-4">
              {LANDLORD_STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-dark">{i + 1}</span>
                  <div><p className="text-sm font-semibold text-foreground">{s.t}</p><p className="text-xs text-zinc-500">{s.d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section>
        <h2 className="text-xl font-bold text-foreground">Why BestPlaceNG</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {WHY_US.map((w) => {
            const Icon = w.icon;
            return (
              <div key={w.title} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand"><Icon className="h-5 w-5" /></div>
                <h3 className="text-sm font-bold text-foreground">{w.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{w.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ with categories */}
      <section>
        <h2 className="text-xl font-bold text-foreground">Frequently asked questions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${category === c ? "bg-brand text-white" : "border border-zinc-200 text-zinc-500 hover:border-brand hover:text-brand"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-400">
              Nothing matches &ldquo;{query}&rdquo; — try another word, or send us a message below.
            </p>
          ) : (
            filtered.map((f) => <Faq key={f.q} q={f.q} a={f.a} />)
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground">Contact us</h2>
        <p className="mt-1 text-sm text-zinc-500">Need help with renting, listing, or an issue? We&apos;re here for you — we reply within 24 hours.</p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm font-bold text-green-700">Message sent!</p>
            <p className="mt-1 text-sm text-green-600">Our team will get back to you within 24 hours — watch your notifications and email.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-500">I am a…</label>
                <select value={userType} onChange={(e) => setUserType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                  {["Tenant", "Landlord", "Business owner", "General enquiry"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-500">What&apos;s it about?</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                placeholder="Describe the issue — include payment references or listing names if relevant…"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>

            {/* Attachments */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Screenshots or photos (optional, up to 3)</label>
              <div className="flex flex-wrap items-center gap-2">
                {attachments.map((url) => (
                  <span key={url} className="relative">
                    <img src={url} alt="attachment" className="h-16 w-16 rounded-lg border border-zinc-200 object-cover" />
                    <button onClick={() => setAttachments((prev) => prev.filter((u) => u !== url))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white" aria-label="Remove attachment">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {attachments.length < 3 && (
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 hover:border-brand hover:text-brand">
                    {uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" /> : <Paperclip className="h-4 w-4" />}
                    <span className="mt-0.5 text-[9px] font-semibold">Add</span>
                    <input type="file" accept="image/*" multiple onChange={handleAttach} className="hidden" />
                  </label>
                )}
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">Screenshots help us resolve issues much faster.</p>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={submitTicket} disabled={sending || uploading}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">
                <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send message"}
              </button>
              <a href="mailto:support@bestplaceng.com" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:border-brand hover:text-brand">
                <Mail className="h-4 w-4" /> support@bestplaceng.com
              </a>
            </div>
            <p className="text-[11px] text-zinc-400">
              A dispute about a specific payment or move-in? The fastest route is your rental page → <strong>Report a Problem</strong> — it attaches your tenancy details automatically.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
