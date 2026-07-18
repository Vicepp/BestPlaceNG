"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Search, ShieldCheck, Zap, ArrowRight, Star } from "lucide-react";
import AnimatedNigeriaMap from "@/components/home/AnimatedNigeriaMap";
import Hero3D from "@/components/home/Hero3D";
import MoveJourney from "@/components/home/MoveJourney";
import { cities } from "@/data/cities";

const featured = cities.filter((c) => c.tier === "major").sort((a, b) => b.population - a.population).slice(0, 8);
const marqueeCities = cities.filter((c) => c.tier === "major").slice(0, 20).map((c) => c.name);

/* Scroll-reveal wrapper */
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Animated number counter */
function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-extrabold text-foreground sm:text-4xl">{n.toLocaleString()}{suffix}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
    </div>
  );
}

export default function HomeLanding() {
  return (
    <div className="overflow-x-clip">
      {/* ── 3D HERO ──────────────────────────────────────────────── */}
      <Hero3D />

        {/* City marquee */}
      <section className="relative border-y border-zinc-100 bg-white/70 py-3 backdrop-blur">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
          <motion.div className="flex w-max gap-8" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
            {[...marqueeCities, ...marqueeCities].map((name, i) => (
              <span key={i} className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-brand/50" /> {name}
              </span>
            ))}
        </motion.div>
      </section>

      {/* ── COUNTERS ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <Counter to={1048} label="Cities, LGAs & Towns" />
          <Counter to={37} label="States covered" />
          <Counter to={24} suffix="+" label="Data sections per city" />
          <Counter to={100} suffix="%" label="Rent held safe till move-in" />
        </div>
      </section>

      {/* ── ANIMATED MAP ─────────────────────────────────────── */}
      <section id="map" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">One map. Every state. Real answers.</h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-500">Watch the spotlight tour all 36 states + the FCT — or take over: hover any state and click through to its cities.</p>
        </Reveal>
        <Reveal delay={0.15} className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-xl shadow-zinc-100 sm:p-8">
          <AnimatedNigeriaMap />
        </Reveal>
      </section>

      {/* ── HOW IT WORKS: scroll-driven moving-truck journey ── */}
      <MoveJourney />

      {/* ── FEATURED CITIES ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Most popular cities</h2>
            <p className="mt-2 text-zinc-500">Start with Nigeria&apos;s biggest — every card is a full city profile.</p>
          </div>
          <Link href="/rankings" className="hidden text-sm font-bold text-brand sm:flex sm:items-center sm:gap-1">
            All rankings <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.06}>
              <motion.div whileHover={{ y: -6 }} className="h-full">
                <Link href={`/city/${c.slug}`} className="group block h-full overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:border-brand hover:shadow-lg">
                  <div className="h-1.5 w-full bg-gradient-to-r from-brand to-accent opacity-60 transition group-hover:opacity-100" />
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand">{c.stateName}</p>
                    <h3 className="mt-1 text-lg font-extrabold text-foreground group-hover:text-brand">{c.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">Pop. {c.population.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-zinc-400">
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-accent" /> Cost {c.costOfLivingIndex ?? "—"}</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-brand" /> Safety {c.safetyIndex ?? "—"}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── WHY ──────────────────────────────────────────────── */}
      <section className="bg-zinc-50/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Everything you need before you move</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Search className="h-5 w-5" />, t: "Smarter search", d: "Filter by data nobody else has — power hours, safety, commute, real rents." },
              { icon: <Star className="h-5 w-5" />, t: "Resident reviews", d: "Real people rating real neighbourhoods, topic by topic, with replies." },
              { icon: <ShieldCheck className="h-5 w-5" />, t: "Escrow-protected rent", d: "Money moves only after you confirm move-in. Disputes go to our team." },
              { icon: <Zap className="h-5 w-5" />, t: "AI assistant", d: "Ask anything — \"cheapest safe city with good schools?\" — and get sourced answers." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">{f.icon}</div>
                  <h3 className="font-bold text-foreground">{f.t}</h3>
                  <p className="mt-1.5 text-sm text-zinc-500">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-14 text-center sm:px-12">
            <motion.div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
              animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 7, repeat: Infinity }} />
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Your next address is in here somewhere.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">Join tenants and landlords doing renting the safe way — data first, escrow always, no agents in between.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup" className="rounded-full bg-white px-7 py-3 text-sm font-bold text-brand-dark transition hover:bg-brand-light">Create a free account</Link>
              <Link href="/list-property" className="rounded-full border border-white/40 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10">List a property</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
