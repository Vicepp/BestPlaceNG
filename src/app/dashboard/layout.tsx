"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, authEnabled } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authEnabled && !loading && !user) {
      router.push("/login");
    }
  }, [authEnabled, loading, user, router]);

  if (!authEnabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-zinc-500">
        The dashboard isn&apos;t available right now. Please check back soon.
      </div>
    );
  }

  if (loading || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-zinc-400">Loading...</div>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
