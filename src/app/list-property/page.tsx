"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AddApartmentForm from "@/components/AddApartmentForm";

function Content() {
  const { user, loading, authEnabled } = useAuth();
  return (
    <div className="mt-8">
      {!authEnabled ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
          Listing creation isn&apos;t available right now.
        </p>
      ) : loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : user ? (
        <AddApartmentForm />
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">You need an account to list a property</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/signup?role=landlord" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Create Account</Link>
            <Link href="/login" className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand">Login</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">List a Unit</h1>
      <p className="mt-2 text-zinc-500">Post an apartment, room, shop, or land listing for rent or sale.</p>
      <Suspense fallback={<p className="mt-8 text-sm text-zinc-400">Loading...</p>}>
        <Content />
      </Suspense>
    </div>
  );
}
