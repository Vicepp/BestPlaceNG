"use client";

import { useState } from "react";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Series {
  label: string;
  color: string;
  values: number[]; // 12 values, Jan-Dec
}

export default function ClimateLineChart({
  title,
  unit,
  series,
  min,
  max,
  currentMonth,
}: {
  title: string;
  unit?: string;
  series: Series[];
  min?: number;
  max?: number;
  /** 1-12, highlights that month's column if provided */
  currentMonth?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 640;
  const height = 220;
  const padX = 36;
  const padTop = 16;
  const padBottom = 28;
  const chartH = height - padTop - padBottom;

  const allValues = series.flatMap((s) => s.values);
  const dataMin = min ?? Math.min(...allValues);
  const dataMax = max ?? Math.max(...allValues);
  const range = dataMax - dataMin || 1;

  function xFor(i: number) {
    return padX + (i / 11) * (width - padX * 2);
  }
  function yFor(v: number) {
    return padTop + chartH - ((v - dataMin) / range) * chartH;
  }

  const active = hoverIdx ?? (currentMonth ? currentMonth - 1 : null);

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="flex gap-3">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={title}>
        {active !== null && (
          <line x1={xFor(active)} y1={padTop} x2={xFor(active)} y2={padTop + chartH} stroke="#e4e4e7" strokeWidth="1.5" />
        )}
        {series.map((s) => {
          const points = s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
          return (
            <g key={s.label}>
              <polyline points={points} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r={active === i ? 4.5 : 2.5}
                  fill={s.color}
                  stroke={active === i ? "white" : "none"}
                  strokeWidth="1.5"
                />
              ))}
            </g>
          );
        })}
        {/* invisible hover targets, one per month, spanning full chart height */}
        {MONTH_LABELS.map((_, i) => (
          <rect
            key={i}
            x={xFor(i) - (width - padX * 2) / 24}
            y={padTop}
            width={(width - padX * 2) / 12}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            className="cursor-pointer"
          />
        ))}
        {MONTH_LABELS.map((m, i) => (
          <text
            key={m}
            x={xFor(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill={currentMonth === i + 1 ? "var(--brand)" : "#a1a1aa"}
            fontWeight={currentMonth === i + 1 ? 700 : 400}
          >
            {m}
            {currentMonth === i + 1 ? " •" : ""}
          </text>
        ))}
      </svg>
      {hoverIdx !== null && (
        <div
          className="pointer-events-none absolute top-6 rounded-lg bg-foreground px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: `${(xFor(hoverIdx) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="mb-1 font-semibold">{MONTH_LABELS[hoverIdx]}</p>
          {series.map((s) => (
            <p key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}: {s.values[hoverIdx]}
              {unit}
            </p>
          ))}
        </div>
      )}
      {unit && <p className="mt-1 text-right text-xs text-zinc-400">{unit}</p>}
    </div>
  );
}
