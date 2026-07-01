"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X, CheckCircle, XCircle, MessageCircle, CreditCard, Wrench, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllRead,
  type AppNotification,
  type NotificationType,
} from "@/data/notifications";
import { approveTenancy, rejectTenancy, getTenanciesForTenantLive } from "@/data/tenancies";

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  message: MessageCircle,
  payment_received: CreditCard,
  payment_made: CreditCard,
  maintenance: Wrench,
  tenancy: CheckCircle,
  system: Info,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  message: "text-brand",
  payment_received: "text-green-500",
  payment_made: "text-yellow-500",
  maintenance: "text-orange-500",
  tenancy: "text-blue-500",
  system: "text-zinc-400",
};

export default function NotificationDrawer({ unreadCount }: { unreadCount: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingInvites, setPendingInvites] = useState<import("@/data/tenancies").Tenancy[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return unsub;
  }, [user]);

  // Load pending tenancy invites (status "requested" where user is the landlord or "invited" where user is tenant)
  useEffect(() => {
    if (!user) return;
    getTenanciesForTenantLive(user.uid).then((tenancies) => {
      // Show tenancies where this user is the landlord and status="requested" (tenant waiting approval)
      // handled in landlord dashboard; here we show where THIS user is the potential tenant
      setPendingInvites(tenancies.filter((t) => t.status === "invited" && !t.tenantId));
    });
  }, [user]);

  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllRead(user.uid);
  }

  async function handleItemClick(n: AppNotification) {
    if (!n.read) await markNotificationRead(n.id);
  }

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-foreground/70 transition hover:border-brand hover:text-brand"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-bold text-foreground">Notifications</p>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-semibold text-brand hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {/* Pending invites requiring action */}
            {pendingInvites.map((t) => (
              <div key={t.id} className="border-b border-zinc-50 bg-blue-50 px-4 py-3">
                <p className="text-xs font-bold text-blue-700">Rental Invite — Action Required</p>
                <p className="mt-0.5 text-sm text-foreground">{t.apartmentTitle}</p>
                <p className="text-xs text-zinc-500">Invited by landlord · {formatDate(t.createdAt)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      await approveTenancy(t.id, t);
                      setPendingInvites((p) => p.filter((x) => x.id !== t.id));
                    }}
                    className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    onClick={async () => {
                      await rejectTenancy(t.id);
                      setPendingInvites((p) => p.filter((x) => x.id !== t.id));
                    }}
                    className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 hover:border-red-300 hover:text-red-500"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Decline
                  </button>
                </div>
              </div>
            ))}

            {/* Regular notifications */}
            {notifications.length === 0 && pendingInvites.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Info;
                const col = TYPE_COLORS[n.type] ?? "text-zinc-400";
                return (
                  <div
                    key={n.id}
                    className={`border-b border-zinc-50 px-4 py-3 transition hover:bg-zinc-50 ${!n.read ? "bg-brand-light/40" : ""}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${col}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-zinc-600"}`}>{n.title}</p>
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{n.body}</p>
                        <p className="mt-1 text-[10px] text-zinc-400">{formatDate(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                    </div>
                    {n.link && (
                      <Link href={n.link} className="mt-1 block text-[10px] font-semibold text-brand hover:underline" onClick={() => setOpen(false)}>
                        View →
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2 text-center">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-xs font-semibold text-brand hover:underline">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}
