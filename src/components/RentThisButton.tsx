"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { requestToRent, findTenantTenancyForApartment } from "@/data/tenancies";
import { createNotification } from "@/data/notifications";
import type { ApartmentListing } from "@/data/apartments";

export default function RentThisButton({ listing }: { listing: ApartmentListing }) {
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!listing.ownerId) return null; // sample/seeded listing, no real landlord to request from

  if (!user) {
    return (
      <Link href="/login" className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand">
        Log in to request
      </Link>
    );
  }

  if (user.uid === listing.ownerId) return null; // landlord viewing their own listing

  if (done) {
    return <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">Request sent</span>;
  }

  async function handleClick() {
    setSubmitting(true);
    setError("");
    // Guard against duplicate requests for the same unit.
    const existing = await findTenantTenancyForApartment(user!.uid, listing.id);
    if (existing) {
      setSubmitting(false);
      setError(existing.status === "active" ? "You already rent this unit." : "You've already requested this unit.");
      setDone(existing.status !== "active");
      return;
    }
    const result = await requestToRent({
      apartmentId: listing.id,
      citySlug: listing.citySlug,
      apartmentTitle: listing.title,
      landlordId: listing.ownerId!,
      tenantId: user!.uid,
      tenantName: profile?.displayName ?? user!.email ?? "Tenant",
      tenantEmail: user!.email ?? "",
      rentAmount: listing.priceNaira,
      rentPeriod: listing.pricePeriod === "month" ? "month" : "year",
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Tell the landlord who wants which property.
    createNotification({
      userId: listing.ownerId!,
      type: "tenancy",
      title: "New rent request",
      body: `${profile?.displayName ?? user!.email} wants to rent ${listing.title}. Review it under Tenants.`,
      link: "/dashboard/tenants",
    }).catch(() => {});
    setDone(true);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={submitting}
        className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Sending..." : "I'm Renting This"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
