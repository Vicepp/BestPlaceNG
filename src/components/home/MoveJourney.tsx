"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Search, CalendarCheck, ShieldCheck, KeyRound, Truck } from "lucide-react";

const STOPS = [
  { icon: Search, t: "Compare cities", d: "Real data: rents, safety, power hours, schools — side by side." },
  { icon: CalendarCheck, t: "Tour & talk", d: "Message landlords directly and book tours on real availability." },
  { icon: ShieldCheck, t: "Pay protected", d: "Rent sits in escrow — released only after you confirm move-in." },
  { icon: KeyRound, t: "Move in", d: "Collect your keys. The truck below is you, by the way." },
];

/** Scroll-driven relocation journey: as the section scrolls through the
 * viewport, a moving truck drives the road from "Compare" to "Move in",
 * lighting up each stop as it passes. */
export default function MoveJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const truckX = useTransform(p, [0, 1], ["0%", "100%"]);
  const roadScale = useTransform(p, [0, 1], [0, 1]);

  return (
    <section className="overflow-hidden bg-zinc-50/70 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }} className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">From &ldquo;where?&rdquo; to moved-in</h2>
          <p className="mt-3 text-zinc-500">Keep scrolling — the truck knows the way.</p>
        </motion.div>

        <div ref={ref} className="relative">
          {/* The road */}
          <div className="absolute left-0 right-0 top-7 hidden h-1.5 rounded-full bg-zinc-200 md:block" />
          <motion.div className="absolute left-0 right-0 top-7 hidden h-1.5 origin-left rounded-full bg-gradient-to-r from-brand to-accent md:block"
            style={{ scaleX: roadScale }} />

          {/* The moving truck */}
          <motion.div className="absolute top-0 z-10 hidden md:block" style={{ left: truckX }}>
            <motion.div className="-ml-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-white shadow-xl shadow-brand/20"
              animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}>
              <Truck className="h-7 w-7 text-brand" />
            </motion.div>
          </motion.div>

          {/* Stops */}
          <div className="grid grid-cols-1 gap-6 pt-0 md:grid-cols-4 md:pt-24">
            {STOPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.t}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.12 }}
                  whileHover={{ y: -6 }}
                  className="relative rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                  <span className="absolute -top-[4.7rem] left-1/2 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-brand shadow md:block" />
                  <span className="absolute right-5 top-4 text-3xl font-extrabold text-zinc-100">0{i + 1}</span>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand"><Icon className="h-5 w-5" /></div>
                  <h3 className="font-bold text-foreground">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{s.d}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
