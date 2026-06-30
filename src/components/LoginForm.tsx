"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const { logIn, authEnabled } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    const result = await logIn(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/");
  }

  if (!authEnabled) {
    return (
      <p className="mt-6 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        Login isn&apos;t available right now. Please check back soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 w-full space-y-3 rounded-2xl border border-zinc-100 bg-white p-6 text-left shadow-sm">
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
        placeholder="Password"
        className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
