"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, UserCheck, MessageSquare, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getViewEventsForOwner, getLeadsForOwner, type ViewEvent, type ListingLead } from "@/data/listingViews";
import { getOrCreateDirectConversation } from "@/data/conversations";

/** Leads centre: everyone who viewed the landlord's units — signed-in leads are
 * messageable; anonymous visits still count in each unit's view totals. */
export default function LeadsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<ViewEvent[]>([]);
  const [leads, setLeads] = useState<ListingLead[]>([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [messaging, setMessaging] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getViewEventsForOwner(user.uid), getLeadsForOwner(user.uid)]).then(([ev, ld]) => {
      if (cancelled) return;
      setEvents(ev);
      setLeads(ld);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const inRange = (iso: string) => {
    const d = new Date(iso);
    if (from && d < new Date(from)) return false;
    if (to && d >= new Date(new Date(to).getTime() + 86400000)) return false;
    return true;
  };

  const filteredEvents = useMemo(() => events.filter((e) => inRange(e.at)), [events, from, to]); // eslint-disable-line react-hooks/exhaustive-deps
  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          inRange(l.lastViewedAt) &&
          (!q.trim() ||
            l.viewerName.toLowerCase().includes(q.trim().toLowerCase()) ||
            l.apartmentTitle.toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [leads, q, from, to] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Per-unit rollup: total views (incl. anonymous) vs signed-in leads.
  const units = useMemo(() => {
    const map = new Map<string, { title: string; views: number; anon: number; leadCount: number }>();
    for (const e of filteredEvents) {
      const u = map.get(e.apartmentId) ?? { title: e.apartmentTitle, views: 0, anon: 0, leadCount: 0 };
      u.views += 1;
      if (!e.viewerId) u.anon += 1;
      map.set(e.apartmentId, u);
    }
    for (const l of filteredLeads) {
      const u = map.get(l.apartmentId) ?? { title: l.apartmentTitle, views: 0, anon: 0, leadCount: 0 };
      u.leadCount += 1;
      map.set(l.apartmentId, u);
    }
    return [...map.entries()].sort((a, b) => b[1].views - a[1].views);
  }, [filteredEvents, filteredLeads]);

  async function messageLead(lead: ListingLead) {
    if (!user || messaging) return;
    setMessaging(lead.id);
    try {
      const cid = await getOrCreateDirectConversation(
        user.uid, profile?.displayName ?? "Landlord", lead.viewerId, lead.viewerName,
        { id: lead.apartmentId, title: lead.apartmentTitle }
      );
      router.push(`/dashboard/messages?c=${cid}`);
    } finally {
      setMessaging(null);
    }
  }

  const timeAgo = (iso: string) => {
    const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading leads...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Who viewed your listings — message the signed-in ones before they rent elsewhere
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or unit…"
              className="rounded-full border border-zinc-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold outline-none focus:border-brand" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5">
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-700 outline-none" aria-label="From date" />
            <span className="text-xs font-bold text-zinc-400">→</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-700 outline-none" aria-label="To date" />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total views", value: filteredEvents.length, icon: <Eye className="h-4 w-4 text-violet-500" /> },
          { label: "Signed-in leads", value: filteredLeads.length, icon: <UserCheck className="h-4 w-4 text-green-600" /> },
          { label: "Anonymous views", value: filteredEvents.filter((e) => !e.viewerId).length, icon: <Eye className="h-4 w-4 text-zinc-400" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">{s.label}</p>
              {s.icon}
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leads list */}
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm lg:col-span-2">
          <h2 className="px-6 pt-6 text-sm font-bold text-foreground">Signed-in leads ({filteredLeads.length})</h2>
          {filteredLeads.length === 0 ? (
            <p className="px-6 py-10 text-center text-xs text-zinc-400">
              No leads {q || from || to ? "match your filters" : "yet — when a signed-in user opens one of your listings, they appear here"}.
            </p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-6 py-2 font-medium">Lead</th>
                  <th className="px-6 py-2 font-medium">Viewed unit</th>
                  <th className="px-6 py-2 font-medium">Times</th>
                  <th className="px-6 py-2 font-medium">Last seen</th>
                  <th className="px-6 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l, i) => (
                  <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                          {l.viewerName.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="font-semibold text-foreground">{l.viewerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">{l.apartmentTitle}</td>
                    <td className="px-6 py-3 font-semibold text-brand">{l.views}×</td>
                    <td className="px-6 py-3 text-zinc-400">{timeAgo(l.lastViewedAt)}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => messageLead(l)} disabled={messaging === l.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
                        <MessageSquare className="h-3 w-3" /> Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Per-unit rollup */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Views by unit</h2>
          <div className="mt-3 space-y-3">
            {units.length === 0 && <p className="py-6 text-center text-xs text-zinc-400">No views recorded in this range.</p>}
            {units.map(([id, u]) => (
              <div key={id} className="border-b border-zinc-50 pb-3 last:border-b-0 last:pb-0">
                <p className="truncate text-sm font-semibold text-foreground">{u.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-600">{u.views}</span> view{u.views === 1 ? "" : "s"}
                  {" · "}{u.leadCount} lead{u.leadCount === 1 ? "" : "s"}
                  {" · "}{u.anon} anonymous
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-brand"
                    style={{ width: `${units[0] ? Math.max(8, Math.round((u.views / Math.max(units[0][1].views, 1)) * 100)) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-zinc-400">
            Anonymous visitors can&apos;t be messaged, but their interest still shows demand for a unit — a
            high-view, low-lead unit may need a better price or better photos.
          </p>
        </div>
      </div>
    </div>
  );
}
