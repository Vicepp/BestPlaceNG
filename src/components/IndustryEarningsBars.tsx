"use client";

import { useState } from "react";

interface Sector {
  name: string;
  annual: number;
}

/** Horizontal hover-bar chart of annual earnings by sector (BestPlaces "Hover Bars" style).
 *  The top-third earners are highlighted green, the rest brand-blue; hovering shows the figure. */
export default function IndustryEarningsBars({ sectors }: { sectors: Sector[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...sectors.map((s) => s.annual), 1);
  const topThreshold = [...sectors].sort((a, b) => b.annual - a.annual)[Math.floor(sectors.length / 3)]?.annual ?? 0;

  return (
    <div className="space-y-1.5">
      {sectors.map((s, i) => {
        const pct = Math.max(6, (s.annual / max) * 100);
        const isTop = s.annual >= topThreshold;
        const active = hover === i;
        return (
          <div
            key={s.name}
            className="flex items-center gap-2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="w-36 shrink-0 truncate text-right text-xs text-zinc-500">{s.name}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-zinc-100">
              <div
                className={`h-full rounded transition-all ${isTop ? "bg-green-500" : "bg-blue-500"} ${active ? "opacity-100" : "opacity-85"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`w-24 shrink-0 text-xs font-semibold ${active ? "text-foreground" : "text-zinc-400"}`}>
              ₦{s.annual.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
