"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { MapPin, ArrowRight, Mic, ShieldCheck, Zap, Car, Truck, Bike, Home, Plane, SlidersHorizontal } from "lucide-react";
import CitySearchBar from "@/components/CitySearchBar";

/* ── Random content pools: a fresh mix every page load ── */
const LISTING_POOL = [
  { seed: "lagos", tag: "Lagos · Lekki", line: "2-bed from ₦4.5m/yr", sub: "Escrow protected" },
  { seed: "abuja", tag: "Abuja · Gwarinpa", line: "3-bed from ₦3.5m/yr", sub: "Escrow protected" },
  { seed: "ph", tag: "Port Harcourt · GRA", line: "2-bed from ₦2.5m/yr", sub: "Escrow protected" },
  { seed: "ibadan", tag: "Ibadan · Bodija", line: "Self-con from ₦450k/yr", sub: "Escrow protected" },
  { seed: "enugu", tag: "Enugu · GRA", line: "Safety score 80", sub: "Resident reviewed" },
  { seed: "uyo", tag: "Uyo · Shelter Afrique", line: "2-bed from ₦1.5m/yr", sub: "Escrow protected" },
  { seed: "calabar", tag: "Calabar · State Housing", line: "Safety score 86", sub: "Best we track" },
  { seed: "ilorin", tag: "Ilorin · GRA", line: "Family 3-bed ₦900k/yr", sub: "Escrow protected" },
];
const CHIP_POOL = [
  { t: "Abuja · Band A", d: "20+ power hours a day" },
  { t: "Calabar · Safety 86", d: "Highest score we track" },
  { t: "Ilorin · Cost index 82", d: "Northern costs, southern access" },
  { t: "Jos · 22°C evenings", d: "Coolest big city in Nigeria" },
  { t: "Ibadan · Rail linked", d: "Lagos in ~2 hours by train" },
];
const MOVER_POOL = [
  { name: "Chiamaka moved in 🎉", route: "Port Harcourt → Uyo" },
  { name: "Ibrahim moved in 🎉", route: "Lagos → Abeokuta" },
  { name: "Tolu moved in 🎉", route: "Abuja → Kaduna" },
  { name: "Ngozi moved in 🎉", route: "Lagos → Enugu" },
  { name: "Musa moved in 🎉", route: "Kano → Abuja" },
  { name: "Ada moved in 🎉", route: "Owerri → Lagos" },
];
const ROAD_WORDS = [
  "Moving day", "New keys 🔑", "Inspection at 3pm", "Rent sorted ✔", "Escrow released",
  "Off to see a flat", "No agent, no wahala", "City switch loading…", "Goodbye traffic", "Fresh start",
];
const SKY_ROUTES = ["Lagos → Abuja", "Uyo → Lagos", "Kano → Abuja", "PH → Calabar", "Abuja → Enugu"];

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
const pickFrom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** One vehicle (or plane) gliding across, with a random phrase that changes
 * every time it re-enters the scene. Labels attach client-side only, so the
 * randomness never fights server rendering. */
function Mover({ Icon, top, dur, delay, size, dir, words, plane = false }: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  top: string; dur: number; delay: number; size: number; dir: 1 | -1; words: string[]; plane?: boolean;
}) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    setLabel(pickFrom(words));
    const t = setInterval(() => setLabel(pickFrom(words)), dur * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dur]);

  return (
    <motion.div
      aria-hidden
      className="absolute flex items-center gap-1.5"
      style={{ top }}
      initial={{ x: dir === 1 ? "-14vw" : "114vw" }}
      animate={{ x: dir === 1 ? "114vw" : "-14vw" }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
    >
      {label && (
        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold shadow-sm ${plane ? "bg-brand text-white" : "bg-white/90 text-brand-dark"}`}>
          {label}
        </span>
      )}
      {plane && <span className="h-px w-10 bg-gradient-to-l from-brand/40 to-transparent" style={{ transform: dir === -1 ? "scaleX(-1)" : undefined }} />}
      <motion.span
        animate={{ y: plane ? [0, -6, 0] : [0, -2, 0] }}
        transition={{ duration: plane ? 2.4 : 0.7, repeat: Infinity, ease: "easeInOut" }}
        className={plane ? "text-brand/60" : "text-brand/70"}
        style={{ transform: `${dir === -1 ? "scaleX(-1) " : ""}${plane ? `rotate(${dir === 1 ? 45 : 45}deg)` : ""}` }}
      >
        <Icon style={{ width: size, height: size }} />
      </motion.span>
    </motion.div>
  );
}

/** Full-viewport 3D hero: a perspective scene whose layers follow the mouse at
 * different depths, a receding grid floor with traffic moving across it, and
 * floating city cards tilted in space. Light theme, brand colors. */
export default function Hero3D() {
  const ref = useRef<HTMLDivElement>(null);

  // A fresh random deck of floating cards on every page load (client-side,
  // after mount, so server and client markup never disagree).
  const [deck, setDeck] = useState<{
    cardA: typeof LISTING_POOL[number]; cardB: typeof LISTING_POOL[number];
    chip: typeof CHIP_POOL[number]; mover: typeof MOVER_POOL[number];
  } | null>(null);
  useEffect(() => {
    const [a, b] = shuffle(LISTING_POOL);
    setDeck({ cardA: a, cardB: b, chip: pickFrom(CHIP_POOL), mover: pickFrom(MOVER_POOL) });
  }, []);

  // Mouse position → springs → parallax offsets per depth layer.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 18 });
  const smy = useSpring(my, { stiffness: 50, damping: 18 });

  const farX = useTransform(smx, (v) => v * -18);
  const farY = useTransform(smy, (v) => v * -10);
  const midX = useTransform(smx, (v) => v * 26);
  const midY = useTransform(smy, (v) => v * 16);
  const nearX = useTransform(smx, (v) => v * 48);
  const nearY = useTransform(smy, (v) => v * 30);
  const tiltX = useTransform(smy, (v) => v * -6);
  const tiltY = useTransform(smx, (v) => v * 8);

  // Scroll: the whole scene gently recedes as you leave it.
  const { scrollY } = useScroll();
  const sceneY = useTransform(scrollY, [0, 700], [0, -90]);
  const sceneScale = useTransform(scrollY, [0, 700], [1, 0.94]);
  const sceneOpacity = useTransform(scrollY, [0, 600], [1, 0.35]);

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative flex min-h-[94vh] flex-col justify-center overflow-hidden bg-gradient-to-b from-brand-light via-white to-white"
      style={{ perspective: 1400 }}
    >
      {/* ── Depth layer: giant watermark type (farthest) ── */}
      <motion.div
        aria-hidden
        style={{ x: farX, y: farY }}
        className="pointer-events-none absolute inset-x-0 top-8 select-none text-center"
      >
        <span
          className="text-[22vw] font-black uppercase leading-none tracking-tighter text-transparent sm:text-[18vw]"
          style={{ WebkitTextStroke: "1.5px rgba(47,133,90,0.10)" }}
        >
          Nigeria
        </span>
      </motion.div>

      {/* Soft drifting blobs */}
      <motion.div aria-hidden className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
        animate={{ y: [0, 26, 0], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="pointer-events-none absolute -right-24 top-44 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        animate={{ y: [0, -24, 0], scale: [1.06, 1, 1.06] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />

      {/* ── Perspective floor: receding grid that keeps rolling toward you ── */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[46vh] overflow-hidden" style={{ perspective: 700 }}>
        <motion.div
          className="absolute inset-x-[-40%] bottom-[-58%] h-[130%]"
          style={{
            rotateX: 62,
            transformOrigin: "50% 0%",
            backgroundImage:
              "linear-gradient(rgba(47,133,90,0.13) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(47,133,90,0.13) 1.5px, transparent 1.5px)",
            backgroundSize: "72px 72px",
          }}
          animate={{ backgroundPositionY: ["0px", "72px"] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-transparent" />

        {/* People & traffic moving across the floor — every pass gets a new phrase */}
        <Mover Icon={Truck} top="38%" dur={30} delay={0} size={26} dir={1} words={ROAD_WORDS} />
        <Mover Icon={Car} top="56%" dur={22} delay={4} size={22} dir={-1} words={ROAD_WORDS} />
        <Mover Icon={Bike} top="70%" dur={34} delay={9} size={20} dir={1} words={ROAD_WORDS} />
        <Mover Icon={Car} top="84%" dur={19} delay={2} size={26} dir={-1} words={ROAD_WORDS} />
      </div>

      {/* Planes flying above the traffic, carrying city-to-city routes */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[8%] h-[30%]">
        <Mover Icon={Plane} plane top="12%" dur={36} delay={1} size={26} dir={1} words={SKY_ROUTES} />
        <Mover Icon={Plane} plane top="58%" dur={46} delay={12} size={20} dir={-1} words={SKY_ROUTES} />
      </div>

      {/* ── Main scene ── */}
      <motion.div
        style={{ y: sceneY, scale: sceneScale, opacity: sceneOpacity, rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-24 text-center sm:px-6"
      >
        <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-white/90 px-4 py-1.5 text-xs font-semibold text-brand-dark shadow-sm backdrop-blur">
          <MapPin className="h-3.5 w-3.5 text-brand" /> Nigeria&apos;s city &amp; rental data platform
        </motion.span>

        {/* Kinetic headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.02] tracking-tight text-foreground sm:text-7xl">
          {["Find the", "Best Place", "to Live in Nigeria"].map((line, li) => (
            <span key={li} className="block overflow-hidden py-0.5">
              <motion.span
                className={`inline-block ${li === 1 ? "bg-gradient-to-r from-brand via-brand-dark to-brand bg-clip-text text-transparent" : ""}`}
                initial={{ y: "110%", rotate: 3 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ delay: 0.15 + li * 0.14, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500">
          Compare cost of living, safety, power supply, schools and real rents across{" "}
          <strong className="text-foreground">1,048 cities &amp; towns</strong> — then rent directly from the landlord, with your
          money protected until you move in.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.5 }}
          className="mx-auto mt-9 max-w-2xl" style={{ transform: "translateZ(60px)" }}>
          <CitySearchBar />
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
            Try &ldquo;Enugu&rdquo;, &ldquo;Lagos&rdquo; or a ZIP like &ldquo;100001&rdquo; · <Mic className="h-3 w-3 text-brand" /> or talk to the assistant, bottom-right
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/apartments" className="group flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark">
            Browse apartments <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link href="/rankings" className="rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-600 transition hover:border-brand hover:text-brand">
            City rankings
          </Link>
          <Link href="/where-should-i-move" className="group flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-light/60 px-6 py-3 text-sm font-bold text-brand-dark transition hover:border-brand hover:bg-brand-light">
            <SlidersHorizontal className="h-4 w-4" /> Where should I move?
          </Link>
        </motion.div>

        {/* ── Floating 3D cards around the headline — a new random mix every refresh ── */}
        {deck && (
        <motion.div aria-hidden style={{ x: midX, y: midY, transformStyle: "preserve-3d" }} className="pointer-events-none absolute inset-0 hidden lg:block">
          {/* Listing card — left */}
          <motion.div
            className="absolute -left-10 top-24 w-52 rounded-2xl border border-zinc-100 bg-white p-4 shadow-2xl shadow-brand/10"
            style={{ rotateY: 18, rotateX: 6, transform: "translateZ(90px)" }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{ opacity: { delay: 1.3, duration: 0.6 }, y: { delay: 1.3, duration: 5.5, repeat: Infinity, ease: "easeInOut" } }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://picsum.photos/seed/bpng-hero-${deck.cardA.seed}/400/200`} alt="" className="h-20 w-full rounded-xl object-cover" />
            <p className="mt-2.5 text-left text-[10px] font-black uppercase tracking-widest text-brand">{deck.cardA.tag}</p>
            <p className="text-left text-sm font-extrabold text-foreground">{deck.cardA.line}</p>
            <p className="mt-1 flex items-center gap-1 text-left text-[10px] font-semibold text-zinc-400">
              <ShieldCheck className="h-3 w-3 text-brand" /> {deck.cardA.sub}
            </p>
          </motion.div>

          {/* Stat chip — top right */}
          <motion.div
            className="absolute right-4 top-14 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-xl"
            style={{ rotateY: -16, rotateX: 4, transform: "translateZ(70px)" }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: [0, 12, 0] }}
            transition={{ opacity: { delay: 1.45, duration: 0.6 }, y: { delay: 1.45, duration: 6.5, repeat: Infinity, ease: "easeInOut" } }}
          >
            <p className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Zap className="h-3.5 w-3.5 text-accent" /> {deck.chip.t}</p>
            <p className="mt-0.5 text-left text-[10px] font-semibold text-zinc-400">{deck.chip.d}</p>
          </motion.div>

          {/* Listing card — right */}
          <motion.div
            className="absolute -right-8 bottom-16 w-48 rounded-2xl border border-zinc-100 bg-white p-4 shadow-2xl shadow-brand/10"
            style={{ rotateY: -20, rotateX: -5, transform: "translateZ(110px)" }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: [0, -14, 0] }}
            transition={{ opacity: { delay: 1.6, duration: 0.6 }, y: { delay: 1.6, duration: 7, repeat: Infinity, ease: "easeInOut" } }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://picsum.photos/seed/bpng-hero-${deck.cardB.seed}/400/200`} alt="" className="h-16 w-full rounded-xl object-cover" />
            <p className="mt-2.5 text-left text-[10px] font-black uppercase tracking-widest text-brand">{deck.cardB.tag}</p>
            <p className="text-left text-sm font-extrabold text-foreground">{deck.cardB.line}</p>
          </motion.div>

          {/* Moved-in chip — bottom left */}
          <motion.div
            className="absolute bottom-24 left-6 flex items-center gap-2 rounded-full border border-zinc-100 bg-white px-4 py-2 shadow-xl"
            style={{ rotateY: 14, transform: "translateZ(50px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ opacity: { delay: 1.75, duration: 0.6 }, y: { delay: 1.75, duration: 6, repeat: Infinity, ease: "easeInOut" } }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-brand"><Home className="h-3.5 w-3.5" /></span>
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">{deck.mover.name}</p>
              <p className="text-[10px] font-semibold text-zinc-400">{deck.mover.route}</p>
            </div>
          </motion.div>
        </motion.div>
        )}

        {/* Near-layer floating dots */}
        <motion.div aria-hidden style={{ x: nearX, y: nearY }} className="pointer-events-none absolute inset-0 hidden lg:block">
          <span className="absolute left-24 top-1/2 h-3 w-3 rounded-full bg-accent/50 blur-[1px]" />
          <span className="absolute right-36 top-1/3 h-2 w-2 rounded-full bg-brand/50 blur-[1px]" />
          <span className="absolute bottom-1/4 right-1/4 h-2.5 w-2.5 rounded-full bg-brand/30 blur-[1px]" />
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div aria-hidden className="absolute bottom-5 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}>
        <div className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-brand/30 p-1.5">
          <div className="h-2 w-1 rounded-full bg-brand" />
        </div>
      </motion.div>
    </section>
  );
}
