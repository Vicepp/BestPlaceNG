"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { MapPin, Search, Building2, ShieldCheck, TrendingUp, Zap, ArrowRight, Star, Mic } from "lucide-react";
import CitySearchBar from "@/components/CitySearchBar";
import AnimatedNigeriaMap from "@/components/home/AnimatedNigeriaMap";
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

const HEADLINE = ["Find", "the", "Best", "Place", "to", "Live", "in", "Nigeria"];

export default function HomeLanding() {
  return (
    <div className="overflow-x-clip">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-brand-light via-white to-white">
        {/* soft animated blobs */}
        <motion.div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          animate={{ y: [0, 24, 0], scale: [1, 1.08, 1] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div aria-hidden className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -20, 0], scale: [1.05, 1, 1.05] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />

        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8">
          <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-white px-4 py-1.5 text-xs font-semibold text-brand-dark shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-brand" /> Nigeria&apos;s city &amp; rental data platform
          </motion.span>

          {/* Word-by-word headline */}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {HEADLINE.map((w, i) => (
              <motion.span key={i} className={`inline-block ${w === "Nigeria" ? "text-brand" : ""} ${w === "Best" ? "relative" : ""}`}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: "easeOut" }}>
                {w}
                {w === "Best" && (
                  <motion.span aria-hidden className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-accent/70"
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.1, duration: 0.5 }} style={{ transformOrigin: "left" }} />
                )}
                {i < HEADLINE.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500">
            Compare cost of living, safety, power supply, schools and real rents across{" "}
            <strong className="text-foreground">753 cities</strong> — then rent your next home directly from the landlord,
            with your money protected until you move in.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.5 }}
            className="mx-auto mt-9 max-w-2xl">
            <CitySearchBar />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
              Try &ldquo;Enugu&rdquo;, &ldquo;Lagos&rdquo; or a ZIP like &ldquo;100001&rdquo; · <Mic className="h-3 w-3 text-brand" /> or talk to the assistant, bottom-right
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/apartments" className="group flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark">
              Browse apartments <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/rankings" className="rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-600 transition hover:border-brand hover:text-brand">
              City rankings
            </Link>
          </motion.div>
        </div>

        {/* City marquee */}
        <div className="relative border-y border-zinc-100 bg-white/70 py-3 backdrop-blur">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
          <motion.div className="flex w-max gap-8" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
            {[...marqueeCities, ...marqueeCities].map((name, i) => (
              <span key={i} className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-brand/50" /> {name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── COUNTERS ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <Counter to={753} label="Cities & LGAs" />
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

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-zinc-50/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">From &ldquo;where?&rdquo; to moved-in</h2>
            <p className="mt-3 text-zinc-500">Three steps. No agents. No blind decisions.</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", icon: <TrendingUp className="h-6 w-6" />, t: "Compare cities with real data", d: "Cost of living, safety, daily power hours, schools, commute times — side by side for any city, updated with sourced research." },
              { n: "02", icon: <Building2 className="h-6 w-6" />, t: "Tour & talk directly", d: "Message landlords in-app, schedule tours on their real availability, and read what residents say in reviews." },
              { n: "03", icon: <ShieldCheck className="h-6 w-6" />, t: "Pay protected, move in", d: "Rent is held in escrow when you pay and only released after you confirm you've moved in. Landlords withdraw straight to their bank." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12}>
                <motion.div whileHover={{ y: -6 }} className="relative h-full rounded-2xl border border-zinc-100 bg-white p-7 shadow-sm">
                  <span className="absolute right-6 top-5 text-4xl font-extrabold text-zinc-100">{s.n}</span>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">{s.icon}</div>
                  <h3 className="text-lg font-bold text-foreground">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.d}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
