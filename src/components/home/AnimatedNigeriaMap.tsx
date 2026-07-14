"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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

  // 3D tilt: the map sits on a slight perspective slab and follows the mouse.
  // Touch devices get a flat map — a fixed tilt with no mouse just skews it.
  const [canTilt, setCanTilt] = useState(false);
  useEffect(() => { setCanTilt(window.matchMedia("(hover: hover) and (pointer: fine)").matches); }, []);
  const tmx = useMotionValue(0);
  const tmy = useMotionValue(0);
  const rotX = useSpring(useTransform(tmy, (v) => 11 - v * 9), { stiffness: 55, damping: 16 });
  const rotY = useSpring(useTransform(tmx, (v) => v * 11), { stiffness: 55, damping: 16 });
  function onTilt(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    tmx.set((e.clientX - r.left) / r.width - 0.5);
    tmy.set((e.clientY - r.top) / r.height - 0.5);
  }

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

  // Travel arcs between major hubs — pulses "move" people between cities.
  const arcs = useMemo(() => {
    const pick = (...ids: string[]) => ids.find((i) => centers[i]);
    const fct = pick("federal-capital-territory", "abuja", "fct");
    const pairs: [string | undefined, string | undefined][] = [
      ["lagos", fct], ["lagos", "rivers"], [fct, "kano"], ["enugu", "lagos"], [fct, "borno"],
    ];
    return pairs.flatMap(([a, b], i) => {
      if (!a || !b || !centers[a] || !centers[b]) return [];
      const p1 = centers[a]; const p2 = centers[b];
      const lift = Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.22;
      return [{ id: `${a}-${b}`, d: `M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2} ${Math.min(p1.y, p2.y) - lift} ${p2.x} ${p2.y}`, dur: 3.6 + i * 0.9, p1, p2 }];
    });
  }, [centers]);

  const activeId = hovered ?? selected ?? locations[spot]?.id ?? null;
  const activeSlug = activeId ? norm(activeId) : null;
  const activeState = activeSlug ? getStateBySlug(activeSlug) : null;
  const allCities = activeSlug ? getCitiesByState(activeSlug) : [];
  const shownCities = allCities.slice(0, 8);
  const moreCount = allCities.length - shownCities.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1fr]">
      {/* ── Map column ─────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-zinc-100 bg-gradient-to-b from-white to-brand-light/30 p-4 shadow-sm"
        style={{ perspective: 1100 }} onMouseMove={onTilt}>
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

        <motion.div style={canTilt ? { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" } : undefined}>
        <svg viewBox={(nigeria as { viewBox: string }).viewBox} className="h-auto w-full" role="img"
          aria-label="Animated 3D map of Nigeria's 36 states and the FCT"
          style={{ filter: canTilt ? "drop-shadow(0 26px 22px rgba(31,77,56,0.22))" : "drop-shadow(0 14px 12px rgba(31,77,56,0.18))" }}>
          {/* Extruded base: the same states, shifted down in a darker shade, give the map thickness */}
          <g aria-hidden style={{ pointerEvents: "none" }}>
            <g transform="translate(0,11)">
              {locations.map((loc) => <path key={`x2-${loc.id}`} d={loc.path} fill="#8fb8a3" />)}
            </g>
            <g transform="translate(0,6)">
              {locations.map((loc) => <path key={`x1-${loc.id}`} d={loc.path} fill="#b8d3c5" />)}
            </g>
          </g>
          {locations.map((loc, i) => {
            const isActive = activeId === loc.id;
            return (
              <motion.path
                key={loc.id}
                ref={(el) => { pathRefs.current[loc.id] = el as SVGPathElement | null; }}
                d={loc.path}
                initial={{ opacity: 0, scale: 0.92, fill: "#e8f2ec" }}
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

          {/* Travel arcs: pulses moving between the big hubs */}
          <g aria-hidden style={{ pointerEvents: "none" }}>
            {arcs.map((a) => (
              <g key={a.id}>
                <path d={a.d} fill="none" stroke="var(--brand)" strokeWidth={1.2} strokeDasharray="3 5" opacity={0.3} />
                <circle r={3.2} fill="var(--accent, #f59e0b)">
                  <animateMotion dur={`${a.dur}s`} repeatCount="indefinite" path={a.d} />
                </circle>
                <circle r={5.5} fill="var(--accent, #f59e0b)" opacity={0.25}>
                  <animateMotion dur={`${a.dur}s`} repeatCount="indefinite" path={a.d} />
                </circle>
                {[a.p1, a.p2].map((p, j) => (
                  <circle key={j} cx={p.x} cy={p.y} r={2.6} fill="var(--brand)" opacity={0.85}>
                    <animate attributeName="r" values="2.2;4.2;2.2" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.85;0.35;0.85" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                ))}
              </g>
            ))}
          </g>
        </svg>
        </motion.div>
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
