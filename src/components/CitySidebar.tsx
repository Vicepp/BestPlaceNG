"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { citySections } from "@/data/citySections";

export default function CitySidebar({ citySlug }: { citySlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="w-full shrink-0 lg:w-64">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Explore
      </p>
      <ul className="space-y-0.5">
        {citySections.map((section) => {
          const href =
            section.slug === "overview"
              ? `/city/${citySlug}`
              : `/city/${citySlug}/${section.slug}`;
          const active = pathname === href;
          return (
            <li key={section.slug}>
              <Link
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "border-l-4 border-brand bg-brand-light font-semibold text-brand-dark"
                    : "border-l-4 border-transparent text-foreground/70 hover:bg-zinc-50 hover:text-brand"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
