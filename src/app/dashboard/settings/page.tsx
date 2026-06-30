"use client";

import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user, profile, activeView, setActiveView } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Profile</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-zinc-400">Name</p>
            <p className="mt-1 text-sm text-foreground">{profile?.displayName ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400">Email</p>
            <p className="mt-1 text-sm text-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400">Account type</p>
            <p className="mt-1 text-sm capitalize text-foreground">{profile?.role ?? "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Dashboard view</h2>
        <p className="mt-1 text-xs text-zinc-400">
          You can rent a property AND own properties at the same time. Switch which dashboard you see here, or from
          the sidebar.
        </p>
        <div className="mt-4 flex max-w-xs rounded-full bg-zinc-100 p-1 text-sm font-semibold">
          {(["landlord", "tenant"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`flex-1 rounded-full px-4 py-2 capitalize transition ${
                activeView === v ? "bg-brand text-white shadow-sm" : "text-zinc-500 hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
