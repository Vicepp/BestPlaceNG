"use client";

import { useState } from "react";

interface TrendChartProps {
  title: string;
  unit?: string;
  series: { label: string; value: number; sublabel?: string }[];
  color?: string;
  /** index (0-based) to visually highlight, e.g. the current month */
  highlightIndex?: number;
}

/** Lightweight SVG bar chart with hover tooltips - no charting library dependency. */
export default function TrendChart({ title, unit, series, color = "var(--brand)", highlightIndex }: TrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...series.map((s) => s.value), 1);
  const width = 600;
  const height = 220;
  const barGap = 24;
  const barWidth = (width - barGap * (series.length + 1)) / series.length;
  const chartHeight = 150;
  const active = hoverIdx ?? highlightIndex ?? null;

  return (
    <div className="relative">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={title}>
        {series.map((s, i) => {
          const barHeight = Math.max(4, (s.value / max) * chartHeight);
          const x = barGap + i * (barWidth + barGap);
          const y = chartHeight - barHeight + 20;
          const isActive = active === i;
          return (
            <g key={s.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={color}
                opacity={active !== null && !isActive ? 0.45 : 1}
              />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="#14241d">
                {s.value.toLocaleString()}
                {unit ?? ""}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 40}
                textAnchor="middle"
                fontSize="11"
                fill={highlightIndex === i ? "var(--brand)" : "#71717a"}
                fontWeight={highlightIndex === i ? 700 : 400}
              >
                {s.label}
                {highlightIndex === i ? " •" : ""}
              </text>
              {s.sublabel && (
                <text x={x + barWidth / 2} y={chartHeight + 55} textAnchor="middle" fontSize="10" fill="#a1a1aa">
                  {s.sublabel}
                </text>
              )}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer"
              />
            </g>
          );
        })}
      </svg>
      {hoverIdx !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{ left: `${((barGap + hoverIdx * (barWidth + barGap) + barWidth / 2) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {series[hoverIdx].label.replace("\n", " ")}: {series[hoverIdx].value.toLocaleString()}
          {unit ?? ""}
        </div>
      )}
    </div>
  );
}
