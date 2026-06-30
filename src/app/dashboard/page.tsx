"use client";

import { useAuth } from "@/context/AuthContext";
import LandlordDashboard from "@/components/dashboard/LandlordDashboard";
import TenantDashboard from "@/components/dashboard/TenantDashboard";

export default function DashboardPage() {
  const { activeView } = useAuth();
  return activeView === "landlord" ? <LandlordDashboard /> : <TenantDashboard />;
}
