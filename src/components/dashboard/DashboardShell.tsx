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
  Wallet,
  CalendarDays,
  Store,
  UserCheck,
  Hotel,
  CalendarCheck,
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
  { label: "Leads", href: "/dashboard/leads", icon: UserCheck },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "My Listings", href: "/dashboard/my-listings", icon: Store },
  { label: "Hotels & Shortlets", href: "/dashboard/hotels", icon: Hotel },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
];

// Only relevant when the landlord uses the built-in tour calendar (not an
// external booking link) — inserted into the landlord nav conditionally below.
const CALENDAR_ITEM: NavItem = { label: "Tour calendar", href: "/dashboard/calendar", icon: CalendarDays };

const TENANT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/dashboard/payments", icon: CreditCard },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "My Listings", href: "/dashboard/my-listings", icon: Store },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
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
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Account", href: "/dashboard/settings", icon: User },
];

const MOBILE_NAV_TENANT: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Account", href: "/dashboard/settings", icon: User },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, profile, activeView, setActiveView, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navItems =
    activeView === "landlord"
      ? profile?.bookingMode === "external"
        ? NAV_ITEMS
        : // insert the tour calendar right after "Properties"
          [...NAV_ITEMS.slice(0, 2), CALENDAR_ITEM, ...NAV_ITEMS.slice(2)]
      : TENANT_NAV_ITEMS;
  const mobileNavItems = activeView === "landlord" ? MOBILE_NAV_LANDLORD : MOBILE_NAV_TENANT;

  async function handleSignOut() {
    await logOut();
    router.push("/");
  }

  return (
    /* Mobile: full-screen column, no outer padding (sticky bars + bottom nav handle spacing)
       Desktop: max-width centred row with sidebar, standard padding */
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col md:mx-auto md:max-w-7xl md:flex-row md:gap-6 md:px-4 md:py-6 lg:px-8">
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

      {/* ── Mobile top-bar: view switcher, fixed below the site header ─── */}
      <div className="fixed left-0 right-0 top-16 z-20 border-b border-zinc-100 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">
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
      {/* Mobile: px-4 horizontal padding, pt-14 clears the sticky view-switcher bar (~52px),
          pb-24 clears the fixed bottom nav (~60px). Desktop resets all three. */}
      <main className="min-w-0 flex-1 px-4 pb-24 pt-14 md:px-0 md:pb-0 md:pt-0">{children}</main>

      {/* ── Mobile floating Tour-calendar button ─────────────────
          Only for landlords on the built-in calendar; sits above the chat
          launcher (which is at bottom-24 on dashboard mobile) and clears the
          bottom nav. Hidden on the calendar page itself and on desktop. */}
      {activeView === "landlord" && profile?.bookingMode !== "external" && pathname !== "/dashboard/calendar" && (
        <Link
          href="/dashboard/calendar"
          aria-label="Tour calendar"
          className="fixed bottom-44 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-brand shadow-xl md:hidden"
        >
          <CalendarDays className="h-5 w-5" />
        </Link>
      )}

      {/* ── Mobile bottom navigation ─────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 backdrop-blur safe-area-inset-bottom md:hidden">
        <div className="flex">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition ${
                  active ? "text-brand" : "text-zinc-400"
                }`}
              >
                {active && <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand" />}
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
