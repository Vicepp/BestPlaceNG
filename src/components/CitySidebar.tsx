"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { citySections } from "@/data/citySections";

/** Mobile: slow-auto-scrolling horizontal pill tab strip. */
export function MobileTabStrip({ citySlug }: { citySlug: string }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Scroll the active tab into view before the auto-scroll begins
    const activeEl = el.querySelector<HTMLElement>("[data-active='true']");
    if (activeEl) {
      const elLeft = activeEl.offsetLeft;
      const elWidth = activeEl.offsetWidth;
      const containerWidth = el.clientWidth;
      // Centre the active tab without triggering the "user scrolled" flag
      el.scrollLeft = Math.max(0, elLeft - containerWidth / 2 + elWidth / 2);
    }

    const SPEED_PX_PER_S = 38; // slow, deliberate crawl

    function tick(ts: number) {
      if (lastTimeRef.current === null) lastTimeRef.current = ts;
      const dt = ts - lastTimeRef.current;
      lastTimeRef.current = ts;

      if (!pausedRef.current && el) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft < maxScroll - 1) {
          el.scrollLeft += (SPEED_PX_PER_S * dt) / 1000;
        } else {
          // Reached end — bounce back to start then pause again briefly
          el.scrollLeft = 0;
          lastTimeRef.current = null;
        }
      }

      animRef.current = requestAnimationFrame(tick);
    }

    // Short delay before starting so the user has a moment to orient
    const startTimer = setTimeout(() => {
      animRef.current = requestAnimationFrame(tick);
    }, 1200);

    function pause() {
      pausedRef.current = true;
    }

    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("mousedown", pause);
    el.addEventListener("wheel", pause, { passive: true });

    return () => {
      clearTimeout(startTimer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("mousedown", pause);
      el.removeEventListener("wheel", pause);
    };
  }, []);

  return (
    <div className="relative lg:hidden">
      {/* Fade hint on the right edge so the user knows there's more */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-white via-white/70 to-transparent" />

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth px-4 py-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

        {citySections.map((section) => {
          const href =
            section.slug === "overview"
              ? `/city/${citySlug}`
              : `/city/${citySlug}/${section.slug}`;
          const active = pathname === href;

          return (
            <Link
              key={section.slug}
              href={href}
              data-active={active ? "true" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-brand-light hover:text-brand-dark"
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Desktop: vertical sidebar nav (unchanged from original). */
export default function CitySidebar({ citySlug }: { citySlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="hidden w-full shrink-0 lg:block lg:w-64">
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
