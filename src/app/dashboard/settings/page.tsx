"use client";

import { useState } from "react";
import { User, Star, ShieldCheck, Lock, MapPin, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProfileTab from "@/components/dashboard/settings/ProfileTab";
import ReviewsTab from "@/components/dashboard/settings/ReviewsTab";
import KycTab from "@/components/dashboard/settings/KycTab";
import PasswordTab from "@/components/dashboard/settings/PasswordTab";
import TourBookingsTab from "@/components/dashboard/settings/TourBookingsTab";
import IntentLocationsTab from "@/components/dashboard/settings/IntentLocationsTab";

type TabId = "profile" | "reviews" | "kyc" | "password" | "tour-bookings" | "intent-locations";

/** Settings, organised BestPlaces-style: a sidebar of setting groups with each
 * group's content on the right. Tour Bookings appears for the landlord view. */
export default function SettingsPage() {
  const { activeView, profile } = useAuth();
  const [tab, setTab] = useState<TabId>("profile");

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "kyc", label: "KYC", icon: ShieldCheck, badge: profile?.kycStatus === "submitted" ? undefined : "!" },
    { id: "password", label: "Password", icon: Lock },
    ...(activeView === "landlord"
      ? [{ id: "tour-bookings" as TabId, label: "Tour Bookings", icon: CalendarDays }]
      : []),
    { id: "intent-locations", label: "Intent Locations", icon: MapPin },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Sidebar (horizontal scroll strip on mobile) */}
        <nav className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:pb-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition lg:w-full ${
                  active
                    ? "border-brand/40 bg-white text-foreground shadow-sm"
                    : "border-transparent text-zinc-500 hover:bg-white hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-brand" : "text-zinc-400"}`} />
                {t.label}
                {t.badge && <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600">{t.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {tab === "profile" && <ProfileTab />}
          {tab === "reviews" && <ReviewsTab />}
          {tab === "kyc" && <KycTab />}
          {tab === "password" && <PasswordTab />}
          {tab === "tour-bookings" && <TourBookingsTab />}
          {tab === "intent-locations" && <IntentLocationsTab />}
        </div>
      </div>
    </div>
  );
}
