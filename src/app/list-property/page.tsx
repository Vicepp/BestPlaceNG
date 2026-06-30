"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AddApartmentForm from "@/components/AddApartmentForm";

export default function ListPropertyPage() {
  const { user, loading, authEnabled } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">List Your Property</h1>
      <p className="mt-2 text-zinc-500">Post an apartment, house, duplex, or land listing for rent or sale.</p>

      <div className="mt-8">
        {!authEnabled ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
            Listing creation isn&apos;t available right now. Please check back soon.
          </p>
        ) : loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : user ? (
          <AddApartmentForm />
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">You need an account to list a property</p>
            <p className="mt-1 text-xs text-zinc-400">It only takes a minute, and it&apos;s free.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/signup?role=landlord" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                Create Account
              </Link>
              <Link href="/login" className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand">
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
