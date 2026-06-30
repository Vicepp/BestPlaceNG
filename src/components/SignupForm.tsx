"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type UserRole } from "@/context/AuthContext";

const ROLE_LABELS: Record<UserRole, string> = {
  tenant: "Tenant / Home Seeker",
  landlord: "Landlord / Agent",
  business: "Business / Organization",
};

export default function SignupForm({ initialRole }: { initialRole: UserRole }) {
  const { signUp, authEnabled } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Please fill in your name, email, and a password of at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim(), role);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (role === "landlord") router.push("/list-property");
    else if (role === "business") router.push("/list-business");
    else router.push("/");
  }

  if (!authEnabled) {
    return (
      <p className="mt-6 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        Account creation isn&apos;t available right now. Please check back soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 w-full space-y-3 rounded-2xl border border-zinc-100 bg-white p-6 text-left shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
              role === r ? "border-brand bg-brand-light text-brand-dark" : "border-zinc-200 text-zinc-500 hover:border-brand"
            }`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Email address"
        className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password (min. 6 characters)"
        className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Creating account..." : `Create ${ROLE_LABELS[role]} Account`}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </form>
  );
}
