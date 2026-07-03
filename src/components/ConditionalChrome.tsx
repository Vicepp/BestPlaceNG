"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

/** Renders the site Footer everywhere EXCEPT the dashboard, which is an app-like
 *  full-height workspace (its own bottom nav on mobile) where a marketing footer
 *  just gets in the way. */
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) return null;
  return <Footer />;
}
