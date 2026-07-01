"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wrench,
  MessageSquare,
  BarChart3,
  LifeBuoy,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth, type DashboardView } from "@/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Tenants", href: "/dashboard/tenants", icon: Users },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
];

const TENANT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
];

const HELP_ITEMS: NavItem[] = [
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/** Bottom-nav items shown on mobile — the 5 most important nav destinations. */
const MOBILE_NAV_LANDLORD: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Account", href: "/dashboard/settings", icon: User },
];

const MOBILE_NAV_TENANT: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Account", href: "/dashboard/settings", icon: User },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, profile, activeView, setActiveView, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = activeView === "landlord" ? NAV_ITEMS : TENANT_NAV_ITEMS;
  const mobileNavItems = activeView === "landlord" ? MOBILE_NAV_LANDLORD : MOBILE_NAV_TENANT;

  async function handleSignOut() {
    await logOut();
    router.push("/");
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between md:flex">
        <div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Viewing as</p>
            <div className="mt-2 flex rounded-full bg-zinc-100 p-1 text-xs font-semibold">
              {(["landlord", "tenant"] as DashboardView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`flex-1 rounded-full px-3 py-1.5 capitalize transition ${
                    activeView === v ? "bg-brand text-white shadow-sm" : "text-zinc-500 hover:text-foreground"
                  }`}
                >
                  {v === "landlord" ? "Landlord" : "Tenant"}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-brand-light text-brand-dark" : "text-foreground/70 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Help &amp; Support</p>
          <nav className="space-y-1">
            {HELP_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-brand-light text-brand-dark" : "text-foreground/70 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{profile?.displayName ?? user?.email}</p>
            <p className="truncate text-xs text-zinc-400">{user?.email}</p>
          </div>
          <button onClick={handleSignOut} className="shrink-0 rounded-full p-2 text-zinc-400 hover:bg-zinc-50 hover:text-red-500" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ── Mobile top-bar (view switcher) ───────────────────── */}
      <div className="fixed left-0 right-0 top-16 z-20 border-b border-zinc-100 bg-white/95 px-4 py-2 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Dashboard</span>
          <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs font-semibold">
            {(["landlord", "tenant"] as DashboardView[]).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={`rounded-full px-3 py-1 capitalize transition ${
                  activeView === v ? "bg-brand text-white shadow-sm" : "text-zinc-500"
                }`}
              >
                {v === "landlord" ? "Landlord" : "Tenant"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      {/* On mobile: top padding for the fixed top-bar, bottom padding for the bottom nav */}
      <main className="min-w-0 flex-1 pt-10 pb-24 md:pb-0 md:pt-0">{children}</main>

      {/* ── Mobile bottom navigation ─────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-stretch">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
                  active ? "text-brand" : "text-zinc-400"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-brand" : ""}`} />
                {item.label}
                {active && <span className="h-0.5 w-4 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
