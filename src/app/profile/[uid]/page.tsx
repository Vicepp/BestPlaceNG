import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Building2, Calendar, Clock } from "lucide-react";
import { getFirestoreDoc } from "@/lib/firestoreData";
import type { UserProfile } from "@/context/AuthContext";
import { getApartmentsByOwnerLive, formatNaira } from "@/data/apartments";

export default async function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const user = await getFirestoreDoc<UserProfile>("users", uid);
  if (!user) notFound();

  const listings = (await getApartmentsByOwnerLive(uid)).filter((a) => !a.status || a.status === "active");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Profile card */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-zinc-400">{user.displayName?.charAt(0) ?? "?"}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{user.displayName}</h1>
            {user.businessName && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-brand">
                <Building2 className="h-4 w-4" /> {user.businessName}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
              {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
              {user.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user.address}</span>}
              {user.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
              )}
              {user.lastOnline && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Last seen {new Date(user.lastOnline).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold capitalize text-zinc-600">{user.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active listings */}
      {listings.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-foreground">Active listings ({listings.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/city/${listing.citySlug}/apartments`}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                {listing.images?.[0] && (
                  <img src={listing.images[0]} alt={listing.title} className="h-36 w-full object-cover" />
                )}
                <div className="flex flex-col p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">{listing.type} · For {listing.purpose}</p>
                  <h3 className="mt-1 text-sm font-bold text-foreground line-clamp-2">{listing.title}</h3>
                  <p className="text-xs text-zinc-500">{listing.area}</p>
                  <p className="mt-auto pt-2 text-base font-bold text-brand-dark">
                    {formatNaira(listing.priceNaira)}
                    {listing.pricePeriod === "year" && <span className="text-xs font-normal text-zinc-400">/yr</span>}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
