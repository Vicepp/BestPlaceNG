"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getTenanciesForLandlordLive, approveTenancy, rejectTenancy, type Tenancy } from "@/data/tenancies";
import { formatNaira } from "@/data/apartments";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-blue-100 text-blue-700",
  requested: "bg-accent/20 text-accent-dark",
  rejected: "bg-red-100 text-red-700",
  ended: "bg-zinc-100 text-zinc-500",
};

export default function TenantsPage() {
  const { user } = useAuth();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setTenancies(await getTenanciesForLandlordLive(user.uid));
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : tenancies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-400">
          No tenants yet. Invite a tenant from a property&apos;s detail page.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3 font-medium">Tenant</th>
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Rent</th>
                <th className="px-5 py-3 font-medium">Lease End</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenancies.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-foreground">{t.tenantName}</p>
                    <p className="text-xs text-zinc-400">{t.tenantEmail}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/properties/${t.apartmentId}`} className="font-medium text-brand hover:underline">
                      {t.apartmentTitle}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{formatNaira(t.rentAmount)}/{t.rentPeriod}</td>
                  <td className="px-5 py-3 text-zinc-500">{t.leaseEnd ? new Date(t.leaseEnd).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    {t.status === "requested" && (
                      <div className="flex gap-2">
                        <button onClick={async () => { await approveTenancy(t.id, t); load(); }} className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark">Approve</button>
                        <button onClick={async () => { await rejectTenancy(t.id); load(); }} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 hover:border-red-300 hover:text-red-600">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
