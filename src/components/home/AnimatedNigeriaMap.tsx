"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import nigeria from "@svg-maps/nigeria";
import { getStateBySlug } from "@/data/states";
import { getCitiesByState } from "@/data/cities";

interface MapLocation { id: string; name: string; path: string }

const ALIASES: Record<string, string> = { nassarawa: "nasarawa" };
const norm = (id: string) => ALIASES[id] ?? id;

/** Animated Nigeria map, two-column like the classic version: the map (staggered
 * draw-in, state names on every state, spotlight tour) on the left, and the
 * active state's cities — clickable through to each city page — on the right.
 * Hover previews a state, click pins it; the tour pauses once you take over. */
export default function AnimatedNigeriaMap() {
  const locations = useMemo(() => (nigeria as { locations: MapLocation[] }).locations, []);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [spot, setSpot] = useState(0);

  // Measure each state's bounding box once so its name sits at its centre.
  useEffect(() => {
    const c: Record<string, { x: number; y: number }> = {};
    for (const loc of locations) {
      const el = pathRefs.current[loc.id];
      if (el) {
        const b = el.getBBox();
        c[loc.id] = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      }
    }
    setCenters(c);
  }, [locations]);

  // Spotlight tour — runs until the visitor hovers or clicks a state.
  useEffect(() => {
    if (hovered || selected) return;
    const t = setInterval(() => setSpot((s) => (s + 1) % locations.length), 2400);
    return () => clearInterval(t);
  }, [hovered, selected, locations.length]);

  const activeId = hovered ?? selected ?? locations[spot]?.id ?? null;
  const activeSlug = activeId ? norm(activeId) : null;
  const activeState = activeSlug ? getStateBySlug(activeSlug) : null;
  const allCities = activeSlug ? getCitiesByState(activeSlug) : [];
  const shownCities = allCities.slice(0, 8);
  const moreCount = allCities.length - shownCities.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1fr]">
      {/* ── Map column ─────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        {/* Floating state pill */}
        <motion.div
          key={activeId ?? "none"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-brand/20 bg-white/95 px-4 py-1.5 shadow-md backdrop-blur"
        >
          <p className="whitespace-nowrap text-xs font-bold text-foreground">
            {activeState?.name ?? "Nigeria"}
            {activeState && <span className="ml-1.5 font-medium text-zinc-400">· {allCities.length} {allCities.length === 1 ? "city" : "cities"}</span>}
          </p>
        </motion.div>

        <svg viewBox={(nigeria as { viewBox: string }).viewBox} className="h-auto w-full" role="img" aria-label="Animated map of Nigeria's 36 states and the FCT">
          {locations.map((loc, i) => {
            const isActive = activeId === loc.id;
            return (
              <motion.path
                key={loc.id}
                ref={(el) => { pathRefs.current[loc.id] = el as SVGPathElement | null; }}
                d={loc.path}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.035, duration: 0.45, ease: "easeOut" }}
                style={{ transformOrigin: "center", cursor: "pointer" }}
                stroke="#ffffff"
                strokeWidth={1.4}
                animate={{ fill: isActive ? "var(--brand)" : "#e8f2ec" }}
                onMouseEnter={() => setHovered(loc.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(loc.id)}
              >
                <title>{loc.name}</title>
              </motion.path>
            );
          })}

          {/* State names on the map */}
          {Object.keys(centers).length > 0 &&
            locations.map((loc, i) => {
              const c = centers[loc.id];
              if (!c) return null;
              const isActive = activeId === loc.id;
              return (
                <motion.text
                  key={`label-${loc.id}`}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + i * 0.02 }}
                  style={{
                    fontSize: isActive ? 11 : 8.5,
                    fontWeight: isActive ? 800 : 600,
                    fill: isActive ? "#ffffff" : "#3f6152",
                    pointerEvents: "none",
                    transition: "font-size 0.2s",
                  }}
                >
                  {loc.name.replace(" State", "")}
                </motion.text>
              );
            })}
        </svg>
        <p className="mt-1 text-center text-xs text-zinc-400">
          {selected ? "Click another state to switch." : "Hover to pause the tour · click a state to pin its cities"}
        </p>
      </div>

      {/* ── Cities column ──────────────────────────────────── */}
      <div className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        {activeState ? (
          <motion.div key={activeState.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">{activeState.region}</p>
            <h3 className="mt-1 text-2xl font-extrabold text-foreground">{activeState.name}</h3>
            <p className="text-sm text-zinc-400">Capital: {activeState.capital}</p>

            <div className="mt-4 space-y-2">
              {shownCities.map((c, i) => (
                <motion.div key={c.slug} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/city/${c.slug}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-2.5 text-sm transition hover:border-brand hover:bg-brand-light/40">
                    <span className="font-semibold text-foreground">{c.name}</span>
                    <span className="text-xs text-zinc-400">{c.population.toLocaleString()} people</span>
                  </Link>
                </motion.div>
              ))}
              {moreCount > 0 && (
                <Link href={`/search?q=${encodeURIComponent(activeState.name)}`}
                  className="block rounded-xl border border-dashed border-zinc-200 px-4 py-2.5 text-center text-xs font-semibold text-zinc-400 transition hover:border-brand hover:text-brand">
                  +{moreCount} more cities in {activeState.name}
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          <p className="m-auto max-w-[240px] text-center text-sm text-zinc-400">
            Hover or click a state to see its cities, then jump straight to the city overview.
          </p>
        )}
      </div>
    </div>
  );
}
