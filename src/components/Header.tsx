"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, Menu, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUnreadCount } from "@/data/notifications";
import NotificationDrawer from "@/components/NotificationDrawer";

interface DropdownItem {
  label: string;
  href: string;
}

const placesToLive: DropdownItem[] = [
  { label: "Find a City", href: "/search" },
  { label: "Compare Cities", href: "/compare" },
  { label: "Top Rankings", href: "/rankings" },
  { label: "Interactive Map", href: "/#map" },
];

const communityData: DropdownItem[] = [
  { label: "Cost of Living", href: "/rankings?metric=cost-of-living" },
  { label: "Crime & Safety", href: "/rankings?metric=safety" },
  { label: "Climate", href: "/rankings?metric=climate" },
  { label: "Schools", href: "/rankings?metric=schools" },
];

function NavDropdown({ label, items }: { label: string; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 transition hover:text-brand">
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 w-56 overflow-hidden rounded-xl border border-zinc-100 bg-white py-2 shadow-xl"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm text-foreground/80 transition hover:bg-brand-light hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, logOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const unsub = subscribeToUnreadCount(user.uid, setUnreadCount);
    return unsub;
  }, [user]);

  // Admin link visibility: checked once per session per user (cached), so the
  // menu item only ever renders for master/sub-admins.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const cacheKey = `bpng:isAdmin:${user.uid}`;
    const cached = typeof window !== "undefined" ? window.sessionStorage.getItem(cacheKey) : null;
    if (cached !== null) { setIsAdmin(cached === "1"); return; }
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ op: "me" }),
        });
        const json = await res.json().catch(() => null);
        const admin = Boolean(json?.ok && json?.isAdmin);
        setIsAdmin(admin);
        window.sessionStorage.setItem(cacheKey, admin ? "1" : "0");
      } catch { setIsAdmin(false); }
    })();
  }, [user]);

  async function handleSignOut() {
    await logOut();
    setAccountOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            BestPlace<span className="text-brand">NG</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavDropdown label="Places to Live" items={placesToLive} />
          <NavDropdown label="Community Data" items={communityData} />
          <Link href="/apartments" className="px-3 py-2 text-sm font-medium text-foreground/80 transition hover:text-brand">
            Apartments
          </Link>
          <Link href="/shortlets" className="px-3 py-2 text-sm font-medium text-foreground/80 transition hover:text-brand">
            Hotels/Shortlets
          </Link>
          <Link href="/rankings" className="px-3 py-2 text-sm font-medium text-foreground/80 transition hover:text-brand">
            Rankings
          </Link>
          <Link href="/learn" className="px-3 py-2 text-sm font-medium text-foreground/80 transition hover:text-brand">
            Learn
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* Notification bell with full drawer */}
          {user && <NotificationDrawer unreadCount={unreadCount} />}
          <div
            className="relative"
            onMouseEnter={() => setAccountOpen(true)}
            onMouseLeave={() => setAccountOpen(false)}
          >
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-foreground/70 transition hover:border-brand hover:text-brand">
              <User className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 w-48 overflow-hidden rounded-xl border border-zinc-100 bg-white py-2 shadow-xl"
                >
                  {user ? (
                    <>
                      <p className="truncate px-4 py-2 text-xs font-semibold text-zinc-400">
                        {profile?.displayName ?? user.email}
                      </p>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-brand-light hover:text-brand">
                        Dashboard
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" className="block px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">
                          Admin Panel
                        </Link>
                      )}
                      <Link href="/list-property" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-brand-light hover:text-brand">
                        List a Property
                      </Link>
                      <Link href="/list-business" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-brand-light hover:text-brand">
                        Add a Business
                      </Link>
                      <div className="my-1 border-t border-zinc-100" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full px-4 py-2 text-left text-sm text-foreground/80 hover:bg-brand-light hover:text-brand"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-brand-light hover:text-brand">
                        Login
                      </Link>
                      <Link href="/signup" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-brand-light hover:text-brand">
                        Create Account
                      </Link>
                      <div className="my-1 border-t border-zinc-100" />
                      <Link href="/list-property" className="block px-4 py-2 text-sm text-foreground/80 hover:bg-brand-light hover:text-brand">
                        List a Property
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link
            href="/list-property"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            List Your Property
          </Link>
        </div>

        {/* Mobile right side: bell + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationDrawer unreadCount={unreadCount} />}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-zinc-100 bg-white md:hidden"
          >
            <div className="flex flex-col px-4 py-3">
              {[
                ...placesToLive,
                ...communityData,
                { label: "Apartments", href: "/apartments" },
                { label: "Hotels/Shortlets", href: "/shortlets" },
                { label: "Rankings", href: "/rankings" },
                { label: "Learn", href: "/learn" },
                { label: "List a Property", href: "/list-property" },
                ...(user
                  ? [{ label: "Dashboard", href: "/dashboard" }, ...(isAdmin ? [{ label: "Admin Panel", href: "/admin" }] : [])]
                  : [
                      { label: "Login", href: "/login" },
                      { label: "Create Account", href: "/signup" },
                    ]),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-zinc-50 py-3 text-sm font-medium text-foreground/80"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                  className="border-b border-zinc-50 py-3 text-left text-sm font-medium text-foreground/80"
                >
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
