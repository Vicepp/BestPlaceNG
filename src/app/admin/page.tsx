"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield, LayoutDashboard, Users, FileText, CreditCard, ShieldCheck, Flag,
  LifeBuoy, Building2, Star, Newspaper, UserCog, RefreshCw, Trash2, CheckCircle, XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import { formatNaira } from "@/data/apartments";

/* One API for everything: POST /api/admin { op, ... } with the caller's token. */
async function adminApi<T = Record<string, unknown>>(payload: Record<string, unknown>): Promise<T & { ok: boolean; error?: string }> {
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
}

type SectionId = "overview" | "users" | "tenancies" | "payments" | "kyc" | "reports" | "support" | "listings" | "reviews" | "research" | "admins" | "hotels";

const NAV: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }>; perm?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users, perm: "users" },
  { id: "tenancies", label: "Tenancies", icon: FileText, perm: "tenancies" },
  { id: "payments", label: "Payments", icon: CreditCard, perm: "payments" },
  { id: "kyc", label: "KYC Review", icon: ShieldCheck, perm: "kyc" },
  { id: "reports", label: "Reports", icon: Flag, perm: "reports" },
  { id: "support", label: "Support Tickets", icon: LifeBuoy, perm: "support" },
  { id: "listings", label: "Listings", icon: Building2, perm: "listings" },
  { id: "hotels", label: "Hotels & Bookings", icon: Building2, perm: "hotels" },
  { id: "reviews", label: "Reviews", icon: Star, perm: "reviews" },
  { id: "research", label: "City Research", icon: Newspaper, perm: "research" },
  { id: "admins", label: "Admins", icon: UserCog, perm: "admins" },
];

const PERMISSIONS = ["users", "tenancies", "payments", "kyc", "reports", "support", "listings", "hotels", "reviews", "research"];

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [me, setMe] = useState<{ isAdmin: boolean; role?: string; permissions?: string[] } | null>(null);
  const [section, setSection] = useState<SectionId>("overview");
  const [data, setData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    adminApi({ op: "me" }).then((r) => setMe(r.ok ? { isAdmin: Boolean(r.isAdmin), role: r.role as string, permissions: r.permissions as string[] } : { isAdmin: false }));
  }, [user]);

  const loadSection = useCallback(async (s: SectionId) => {
    setLoading(true);
    setNotice("");
    const r = s === "overview" ? await adminApi({ op: "overview" }) : await adminApi({ op: "data", section: s });
    setData(r.ok ? r : null);
    if (!r.ok) setNotice(r.error ?? "Failed to load.");
    setLoading(false);
  }, []);

  useEffect(() => { if (me?.isAdmin) loadSection(section); }, [me, section, loadSection]);

  async function act(payload: Record<string, unknown>) {
    const r = await adminApi({ op: "action", ...payload });
    setNotice(r.ok ? "Done." : r.error ?? "Action failed.");
    if (r.ok) loadSection(section);
  }

  const canSee = (perm?: string) => !perm || me?.role === "master" || me?.permissions?.includes("*") || me?.permissions?.includes(perm);

  if (authLoading) return <Shell><p className="text-sm text-zinc-400">Loading…</p></Shell>;
  if (!user) return (
    <Shell>
      <div className="rounded-2xl border border-zinc-100 bg-white p-10 text-center shadow-sm">
        <Shield className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
        <p className="font-semibold text-foreground">Admin area</p>
        <p className="mt-1 text-sm text-zinc-500">Log in with an admin account to continue.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white">Log in</Link>
      </div>
    </Shell>
  );
  if (me && !me.isAdmin) return (
    <Shell>
      <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
        <XCircle className="mx-auto mb-3 h-10 w-10 text-red-300" />
        <p className="font-semibold text-red-700">This account isn&apos;t an admin</p>
        <p className="mt-1 text-sm text-red-500">Ask the master admin to invite you, or run scripts/grant-admin.mjs.</p>
      </div>
    </Shell>
  );
  if (!me) return <Shell><p className="text-sm text-zinc-400">Checking access…</p></Shell>;

  return (
    <Shell>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Nav */}
        <nav className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-52 lg:flex-col">
          {NAV.filter((n) => canSee(n.perm)).map((n) => {
            const Icon = n.icon;
            const active = section === n.id;
            return (
              <button key={n.id} onClick={() => setSection(n.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition lg:w-full ${
                  active ? "border-brand/40 bg-white text-foreground shadow-sm" : "border-transparent text-zinc-500 hover:bg-white"
                }`}>
                <Icon className={`h-4 w-4 ${active ? "text-brand" : "text-zinc-400"}`} /> {n.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-400">
              Signed in as <span className="text-foreground">{user.email}</span> · {me.role === "master" ? "Master admin" : "Sub-admin"}
            </p>
            <button onClick={() => loadSection(section)} className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:border-brand hover:text-brand">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
          {notice && <div className="rounded-xl bg-brand-light px-4 py-2.5 text-sm text-brand-dark">{notice}</div>}
          {loading ? <p className="py-10 text-center text-sm text-zinc-400">Loading…</p> : (
            <>
              {section === "overview" && data?.stats && <Overview data={data} />}
              {section === "users" && data?.rows && <UsersTable rows={data.rows} />}
              {section === "tenancies" && data?.rows && <TenanciesTable rows={data.rows} />}
              {section === "payments" && data?.rows && <PaymentsTable rows={data.rows} />}
              {section === "kyc" && data?.rows && <KycTable rows={data.rows} act={act} />}
              {section === "reports" && data?.rows && <ReportsTable rows={data.rows} act={act} />}
              {section === "support" && data?.rows && <SupportTable rows={data.rows} act={act} />}
              {section === "listings" && data?.apartments && <ListingsTables apartments={data.apartments} directory={data.directory} act={act} />}
              {section === "reviews" && data?.city && <ReviewsTables city={data.city} user={data.user} act={act} />}
              {section === "research" && data?.city && <ResearchTables city={data.city} state={data.state} />}
              {section === "admins" && data?.admins && <AdminsPanel admins={data.admins} invites={data.invites} act={act} myUid={user.uid} />}
              {section === "hotels" && data?.hotels && <HotelsTables hotels={data.hotels} bookings={data.bookings} />}
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-foreground"><Shield className="h-6 w-6 text-brand" /> BestPlaceNG Admin</h1>
      {children}
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */
function Overview({ data }: { data: Row }) {
  const s = data.stats;
  const cards: [string, string][] = [
    ["Total users", String(s.users)], ["Landlords", String(s.landlords)], ["Tenants", String(s.tenants)],
    ["Apartments", `${s.apartments} (${s.rented} rented)`],
    ["Active tenancies", String(s.tenanciesActive)], ["Pending requests", String(s.tenanciesRequested)],
    ["Payments (success)", String(s.paySuccess)], ["Payments pending", String(s.payPending)],
    ["Payment volume", formatNaira(s.volume)], ["Escrow held", formatNaira(s.escrowHeld)], ["Wallet balances", formatNaira(s.walletBalance)],
    ["Open reports", String(s.reportsOpen)], ["Open tickets", String(s.ticketsOpen)], ["KYC awaiting review", String(s.kycSubmitted)],
    ["City reviews", String(s.reviews)], ["Directory listings", String(s.dirListings)], ["Tour bookings", String(s.tours)], ["Research snapshots", String(s.research)],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400">{label}</p>
            <p className="mt-1 truncate text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Newest users</h3>
          {(data.recentUsers as Row[]).map((u) => (
            <p key={u.id} className="mt-2 flex justify-between text-sm"><span className="truncate font-medium text-foreground">{u.displayName || u.email}</span><span className="ml-2 shrink-0 text-xs text-zinc-400">{u.role} · {u.createdAt?.slice(0, 10)}</span></p>
          ))}
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Latest payments</h3>
          {(data.recentPayments as Row[]).map((p) => (
            <p key={p.id} className="mt-2 flex justify-between text-sm"><span className="truncate text-zinc-600">{p.apartmentTitle}</span><span className={`ml-2 shrink-0 text-xs font-semibold ${p.status === "success" ? "text-green-600" : "text-amber-600"}`}>{formatNaira(p.amount)} · {p.status}</span></p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Generic table bits ───────────────────────────────────────── */
function T({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
          {head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
        </tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
const td = "px-4 py-2.5";
const chip = (cls: string) => `rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`;

function UsersTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const filtered = rows.filter((u) => !q || `${u.displayName} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="w-full max-w-xs rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      <T head={["User", "Role", "KYC", "Joined", "Last online"]}>
        {filtered.map((u) => (
          <tr key={u.id} className="border-b border-zinc-50 last:border-0">
            <td className={td}><p className="font-semibold text-foreground">{u.displayName || "—"}</p><p className="text-xs text-zinc-400">{u.email}</p></td>
            <td className={td}><span className={chip("bg-zinc-100 text-zinc-600 capitalize")}>{u.role}</span></td>
            <td className={td}><span className={chip(u.kycStatus === "verified" ? "bg-green-100 text-green-700" : u.kycStatus === "submitted" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-400")}>{u.kycStatus ?? "none"}</span></td>
            <td className={`${td} text-xs text-zinc-500`}>{u.createdAt?.slice(0, 10)}</td>
            <td className={`${td} text-xs text-zinc-500`}>{u.lastOnline?.slice(0, 10) ?? "—"}</td>
          </tr>
        ))}
      </T>
    </div>
  );
}

function TenanciesTable({ rows }: { rows: Row[] }) {
  return (
    <T head={["Tenant", "Property", "Rent", "Status", "Move-in", "Created"]}>
      {rows.map((t) => (
        <tr key={t.id} className="border-b border-zinc-50 last:border-0">
          <td className={td}><p className="font-semibold text-foreground">{t.tenantName}</p><p className="text-xs text-zinc-400">{t.tenantEmail}</p></td>
          <td className={`${td} text-zinc-600`}>{t.apartmentTitle}</td>
          <td className={`${td} text-zinc-600`}>{formatNaira(t.rentAmount)}/{t.rentPeriod}</td>
          <td className={td}><span className={chip("bg-zinc-100 text-zinc-600 capitalize")}>{t.status}</span>{t.leaveReason && <p className="mt-0.5 max-w-[160px] text-[11px] text-zinc-400">Left: {t.leaveReason}</p>}</td>
          <td className={`${td} text-xs text-zinc-500`}>{t.moveInConfirmed ? "Confirmed ✓" : t.moveInDate ? t.moveInDate.slice(0, 10) : "—"}</td>
          <td className={`${td} text-xs text-zinc-500`}>{t.createdAt?.slice(0, 10)}</td>
        </tr>
      ))}
    </T>
  );
}

function PaymentsTable({ rows }: { rows: Row[] }) {
  return (
    <T head={["Property", "Type", "Amount", "Status", "Escrow", "Created", "Ref"]}>
      {rows.map((p) => (
        <tr key={p.id} className="border-b border-zinc-50 last:border-0">
          <td className={`${td} max-w-[220px] truncate text-zinc-600`}>{p.apartmentTitle}</td>
          <td className={td}><span className={chip(p.kind === "utility" ? "bg-accent/20 text-accent-dark" : "bg-brand-light text-brand-dark")}>{p.kind === "utility" ? "Utility" : "Rent"}</span></td>
          <td className={`${td} font-semibold text-foreground`}>{formatNaira(p.amount)}</td>
          <td className={td}><span className={chip(p.status === "success" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>{p.status}</span></td>
          <td className={`${td} text-xs text-zinc-500`}>{p.escrowStatus ?? "—"}</td>
          <td className={`${td} text-xs text-zinc-500`}>{p.createdAt?.slice(0, 10)}</td>
          <td className={`${td} max-w-[140px] truncate text-xs text-zinc-400`}>{p.paystackReference ?? "—"}</td>
        </tr>
      ))}
    </T>
  );
}

function KycTable({ rows, act }: { rows: Row[]; act: (p: Record<string, unknown>) => void }) {
  const pending = rows.filter((r) => r.status === "submitted");
  const rest = rows.filter((r) => r.status !== "submitted");
  const render = (r: Row) => (
    <tr key={r.id} className="border-b border-zinc-50 last:border-0">
      <td className={td}><p className="font-semibold text-foreground">{r.firstName} {r.lastName}</p><p className="text-xs text-zinc-400">{r.account?.email ?? r.id}</p></td>
      <td className={`${td} text-xs text-zinc-500`}>{r.nin ? `•••••••${String(r.nin).slice(-4)}` : "—"}</td>
      <td className={td}>{r.selfieUrl ? <a href={r.selfieUrl} target="_blank" className="text-xs font-semibold text-brand underline">Selfie</a> : <span className="text-xs text-zinc-300">—</span>} {r.documentUrl ? <a href={r.documentUrl} target="_blank" className="ml-2 text-xs font-semibold text-brand underline">Document</a> : null}</td>
      <td className={td}><span className={chip(r.status === "verified" ? "bg-green-100 text-green-700" : r.status === "submitted" ? "bg-amber-100 text-amber-700" : r.status === "rejected" ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-400")}>{r.status}</span></td>
      <td className={td}>
        {r.status === "submitted" && (
          <span className="flex gap-2">
            <button onClick={() => act({ action: "kyc-verdict", id: r.id, verdict: "verified" })} className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white"><CheckCircle className="h-3 w-3" /> Verify</button>
            <button onClick={() => act({ action: "kyc-verdict", id: r.id, verdict: "rejected" })} className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"><XCircle className="h-3 w-3" /> Reject</button>
          </span>
        )}
      </td>
    </tr>
  );
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground">Awaiting review ({pending.length})</h3>
      <T head={["Name", "NIN", "Files", "Status", "Actions"]}>{pending.map(render)}</T>
      <h3 className="text-sm font-bold text-foreground">History</h3>
      <T head={["Name", "NIN", "Files", "Status", ""]}>{rest.map(render)}</T>
    </div>
  );
}

function ReportsTable({ rows, act }: { rows: Row[]; act: (p: Record<string, unknown>) => void }) {
  return (
    <T head={["From", "About", "Message", "Status", "Actions"]}>
      {rows.map((r) => (
        <tr key={r.id} className="border-b border-zinc-50 last:border-0 align-top">
          <td className={td}><p className="font-semibold text-foreground">{r.reporterName}</p><p className="text-xs text-zinc-400">{r.reporterEmail}</p></td>
          <td className={`${td} text-xs text-zinc-500`}>{r.kind === "listing" ? `Listing: ${r.listingName}` : r.apartmentTitle}<br />{r.category ?? r.reason}</td>
          <td className={`${td} max-w-[280px] text-xs text-zinc-600`}>{r.message}</td>
          <td className={td}><span className={chip(r.status === "open" ? "bg-red-100 text-red-600" : r.status === "reviewing" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>{r.status}</span></td>
          <td className={td}>
            <select value={r.status} onChange={(e) => act({ action: "report-status", id: r.id, status: e.target.value })} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs">
              {["open", "reviewing", "resolved"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </td>
        </tr>
      ))}
    </T>
  );
}

function SupportTable({ rows, act }: { rows: Row[]; act: (p: Record<string, unknown>) => void }) {
  return (
    <T head={["From", "Subject", "Message", "Files", "Status", "Actions"]}>
      {rows.map((r) => (
        <tr key={r.id} className="border-b border-zinc-50 last:border-0 align-top">
          <td className={td}><p className="font-semibold text-foreground">{r.name}</p><p className="text-xs text-zinc-400">{r.email} · {r.userType}</p></td>
          <td className={`${td} text-xs text-zinc-600`}>{r.subject}</td>
          <td className={`${td} max-w-[280px] text-xs text-zinc-600`}>{r.message}</td>
          <td className={td}>{(r.attachments ?? []).map((a: string, i: number) => <a key={a} href={a} target="_blank" className="mr-1 text-xs font-semibold text-brand underline">{i + 1}</a>)}</td>
          <td className={td}><span className={chip(r.status === "open" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700")}>{r.status}</span></td>
          <td className={td}>
            <select value={r.status} onChange={(e) => act({ action: "ticket-status", id: r.id, status: e.target.value })} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs">
              {["open", "in-progress", "closed"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </td>
        </tr>
      ))}
    </T>
  );
}

function ListingsTables({ apartments, directory, act }: { apartments: Row[]; directory: Row[]; act: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-foreground">Apartments ({apartments.length})</h3>
      <T head={["Title", "City", "Price", "Status", "Owner", "Actions"]}>
        {apartments.map((a) => (
          <tr key={a.id} className="border-b border-zinc-50 last:border-0">
            <td className={`${td} max-w-[220px] truncate font-medium text-foreground`}>{a.title}</td>
            <td className={`${td} text-xs text-zinc-500`}>{a.citySlug}</td>
            <td className={`${td} text-zinc-600`}>{formatNaira(a.priceNaira ?? 0)}</td>
            <td className={td}><span className={chip("bg-zinc-100 text-zinc-600 capitalize")}>{a.status ?? "active"}</span></td>
            <td className={`${td} text-xs text-zinc-500`}>{a.ownerName ?? a.ownerId ?? "—"}</td>
            <td className={td}>{(a.status ?? "active") !== "archived" && (
              <button onClick={() => act({ action: "apartment-archive", id: a.id })} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">Take down</button>
            )}</td>
          </tr>
        ))}
      </T>
      <h3 className="text-sm font-bold text-foreground">Directory ({directory.length})</h3>
      <T head={["Name", "Category", "City", "Owner", "Actions"]}>
        {directory.map((d) => (
          <tr key={d.id} className="border-b border-zinc-50 last:border-0">
            <td className={`${td} max-w-[220px] truncate font-medium text-foreground`}>{d.name}</td>
            <td className={`${td} text-xs text-zinc-500`}>{d.category}</td>
            <td className={`${td} text-xs text-zinc-500`}>{d.citySlug}</td>
            <td className={`${td} text-xs text-zinc-500`}>{d.ownerId ?? "seed"}</td>
            <td className={td}><button onClick={() => act({ action: "directory-delete", id: d.id })} className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"><Trash2 className="h-3 w-3" /> Delete</button></td>
          </tr>
        ))}
      </T>
    </div>
  );
}

function ReviewsTables({ city, user, act }: { city: Row[]; user: Row[]; act: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-foreground">City reviews ({city.length})</h3>
      <T head={["Where", "By", "Rating", "Comment", "Actions"]}>
        {city.map((r) => (
          <tr key={r.id} className="border-b border-zinc-50 last:border-0 align-top">
            <td className={`${td} text-xs text-zinc-500`}>{r.citySlug} · {r.section}</td>
            <td className={`${td} font-medium text-foreground`}>{r.name}</td>
            <td className={td}>{r.rating}★</td>
            <td className={`${td} max-w-[300px] text-xs text-zinc-600`}>{r.comment}</td>
            <td className={td}><button onClick={() => act({ action: "review-delete", id: r.id, kind: "city" })} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">Delete</button></td>
          </tr>
        ))}
      </T>
      <h3 className="text-sm font-bold text-foreground">User reviews ({user.length})</h3>
      <T head={["About", "By", "Rating", "Comment", "Actions"]}>
        {user.map((r) => (
          <tr key={r.id} className="border-b border-zinc-50 last:border-0 align-top">
            <td className={`${td} text-xs text-zinc-500`}>{r.subjectId}</td>
            <td className={`${td} font-medium text-foreground`}>{r.reviewerName}</td>
            <td className={td}>{r.rating}★</td>
            <td className={`${td} max-w-[300px] text-xs text-zinc-600`}>{r.comment}</td>
            <td className={td}><button onClick={() => act({ action: "review-delete", id: r.id, kind: "user" })} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">Delete</button></td>
          </tr>
        ))}
      </T>
    </div>
  );
}

function ResearchTables({ city, state }: { city: Row[]; state: Row[] }) {
  const render = (rows: Row[]) => rows.map((r) => (
    <tr key={r.id} className="border-b border-zinc-50 last:border-0 align-top">
      <td className={`${td} text-xs font-semibold text-foreground`}>{r.slug}</td>
      <td className={`${td} text-xs text-zinc-500`}>{r.asOf}</td>
      <td className={`${td} max-w-[380px] text-xs text-zinc-600`}>{r.headline}</td>
      <td className={`${td} text-xs text-zinc-400`}>{(r.sources ?? []).length} sources</td>
    </tr>
  ));
  return (
    <div className="space-y-5">
      <p className="text-xs text-zinc-400">Snapshots are append-only — run /update-city-data to add new ones. History is never overwritten.</p>
      <h3 className="text-sm font-bold text-foreground">City snapshots ({city.length})</h3>
      <T head={["City", "As of", "Headline", "Sources"]}>{render(city)}</T>
      <h3 className="text-sm font-bold text-foreground">State snapshots ({state.length})</h3>
      <T head={["State", "As of", "Headline", "Sources"]}>{render(state)}</T>
    </div>
  );
}

function AdminsPanel({ admins, invites, act, myUid }: { admins: Row[]; invites: Row[]; act: (p: Record<string, unknown>) => void; myUid: string }) {
  const [email, setEmail] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const toggle = (p: string) => setPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Invite a sub-admin</h3>
        <p className="mt-1 text-xs text-zinc-400">If they already have an account they get access immediately; otherwise the invite is claimed the first time they open /admin after signing up with this email.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="their@email.com"
          className="mt-3 w-full max-w-sm rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        <div className="mt-3 flex flex-wrap gap-2">
          {PERMISSIONS.map((p) => (
            <button key={p} onClick={() => toggle(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${perms.includes(p) ? "bg-brand text-white" : "border border-zinc-200 text-zinc-500 hover:border-brand"}`}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={() => { act({ action: "invite-admin", email, permissions: perms }); setEmail(""); setPerms([]); }}
          disabled={!email.trim() || perms.length === 0}
          className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">Send invite</button>
      </div>

      <h3 className="text-sm font-bold text-foreground">Admins ({admins.length})</h3>
      <T head={["Email", "Role", "Permissions", "Actions"]}>
        {admins.map((a) => (
          <tr key={a.id} className="border-b border-zinc-50 last:border-0">
            <td className={`${td} font-medium text-foreground`}>{a.email ?? a.id}</td>
            <td className={td}><span className={chip(a.role === "master" ? "bg-brand-light text-brand-dark" : "bg-zinc-100 text-zinc-600")}>{a.role}</span></td>
            <td className={`${td} text-xs text-zinc-500`}>{(a.permissions ?? []).join(", ")}</td>
            <td className={td}>{a.id !== myUid && a.role !== "master" && (
              <button onClick={() => act({ action: "remove-admin", id: a.id })} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">Remove</button>
            )}</td>
          </tr>
        ))}
      </T>

      {invites.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-foreground">Pending invites ({invites.length})</h3>
          <T head={["Email", "Permissions", "Actions"]}>
            {invites.map((i) => (
              <tr key={i.id} className="border-b border-zinc-50 last:border-0">
                <td className={`${td} font-medium text-foreground`}>{i.id}</td>
                <td className={`${td} text-xs text-zinc-500`}>{(i.permissions ?? []).join(", ")}</td>
                <td className={td}><button onClick={() => act({ action: "cancel-invite", id: i.id })} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">Cancel</button></td>
              </tr>
            ))}
          </T>
        </>
      )}
    </div>
  );
}

function HotelsTables({ hotels, bookings }: { hotels: Row[]; bookings: Row[] }) {
  const statusChip = (s: string) =>
    s === "approved" ? chip("bg-green-100 text-green-700")
    : s === "completed" ? chip("bg-blue-100 text-blue-700")
    : s === "pending_payment" ? chip("bg-amber-100 text-amber-700")
    : s === "expired" ? chip("bg-red-100 text-red-600")
    : chip("bg-zinc-100 text-zinc-500");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-bold text-foreground">Hotels & Shortlets ({hotels.length})</h2>
        <T head={["Name", "Type", "City", "Owner", "Price/night", "Created"]}>
          {hotels.map((h) => (
            <tr key={h.id} className="border-b border-zinc-50">
              <td className={`${td} font-medium text-foreground`}>{h.name}</td>
              <td className={`${td} capitalize text-zinc-500`}>{h.kind}</td>
              <td className={`${td} text-zinc-500`}>{h.area}, {h.cityName}</td>
              <td className={`${td} text-zinc-500`}>{h.ownerName || h.ownerId?.slice(0, 8)}</td>
              <td className={td}>₦{Number(h.defaultPricePerNight ?? 0).toLocaleString()}</td>
              <td className={`${td} text-zinc-400`}>{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </T>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-bold text-foreground">Bookings ({bookings.length})</h2>
        <T head={["Hotel / Room", "Guest", "Dates", "Amount", "Status", "Created"]}>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-zinc-50">
              <td className={`${td} text-foreground`}>{b.hotelName}<span className="text-zinc-400"> · {b.unitName}</span></td>
              <td className={`${td} text-zinc-500`}>{b.guestName}</td>
              <td className={`${td} text-zinc-500`}>{b.checkIn} → {b.checkOut}</td>
              <td className={td}>₦{Number(b.amount ?? 0).toLocaleString()}</td>
              <td className={td}><span className={statusChip(String(b.status))}>{String(b.status).replace("_", " ")}</span></td>
              <td className={`${td} text-zinc-400`}>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </T>
      </div>
    </div>
  );
}
