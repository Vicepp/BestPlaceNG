"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, RotateCcw, Share2, Check, Info } from "lucide-react";
import { METRICS, type MetricKey, type PersonalizeCity } from "@/data/personalize";

const DEFAULT_WEIGHTS: Record<MetricKey, number> = {
  cost: 70, safety: 70, schools: 50, climate: 40, power: 60, internet: 40, commute: 40, growth: 40,
};

function encodeWeights(w: Record<MetricKey, number>): string {
  return METRICS.map((m) => w[m.key]).join(",");
}
function decodeWeights(s: string | null): Record<MetricKey, number> | null {
  if (!s) return null;
  const parts = s.split(",").map(Number);
  if (parts.length !== METRICS.length || parts.some((n) => Number.isNaN(n))) return null;
  const out = {} as Record<MetricKey, number>;
  METRICS.forEach((m, i) => (out[m.key] = Math.max(0, Math.min(100, parts[i]))));
  return out;
}

const SHOW_OPTIONS = [10, 25, 50, 100, 0] as const; // 0 = All

/** Client-side weighted city ranking: every metric is min-max normalized to
 * 0-10 across the dataset, then combined by the user's importance sliders. */
export default function PersonalizeExplorer({ cities }: { cities: PersonalizeCity[] }) {
  const [weights, setWeights] = useState<Record<MetricKey, number>>(DEFAULT_WEIGHTS);
  const [query, setQuery] = useState("");
  const [show, setShow] = useState<(typeof SHOW_OPTIONS)[number]>(50);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fromUrl = decodeWeights(new URLSearchParams(window.location.search).get("w"));
    if (fromUrl) setWeights(fromUrl);
  }, []);

  // Normalize every metric 0-10 across the whole dataset once.
  const ranges = useMemo(() => {
    const r = {} as Record<MetricKey, { min: number; max: number }>;
    for (const m of METRICS) {
      const vals = cities.map((c) => c.metrics[m.key]);
      r[m.key] = { min: Math.min(...vals), max: Math.max(...vals) };
    }
    return r;
  }, [cities]);

  function normalized(city: PersonalizeCity, key: MetricKey): number {
    const { min, max } = ranges[key];
    if (max === min) return 5;
    const pct = (city.metrics[key] - min) / (max - min);
    const norm = METRICS.find((m) => m.key === key)!.invert ? 1 - pct : pct;
    return norm * 10;
  }

  const scored = useMemo(() => {
    const totalWeight = METRICS.reduce((s, m) => s + weights[m.key], 0) || 1;
    return cities
      .map((c) => {
        const perMetric = Object.fromEntries(METRICS.map((m) => [m.key, normalized(c, m.key)])) as Record<MetricKey, number>;
        const score = (METRICS.reduce((s, m) => s + weights[m.key] * perMetric[m.key], 0) / totalWeight) * 10;
        return { city: c, perMetric, score };
      })
      .sort((a, b) => b.score - a.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, weights, ranges]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? scored.filter((r) => `${r.city.name} ${r.city.stateName}`.toLowerCase().includes(q)) : scored;
    return show === 0 ? base : base.slice(0, show);
  }, [scored, query, show]);

  function reset() {
    setWeights(DEFAULT_WEIGHTS);
    window.history.replaceState(null, "", window.location.pathname);
  }
  function share() {
    const url = `${window.location.origin}${window.location.pathname}?w=${encodeWeights(weights)}`;
    window.history.replaceState(null, "", `?w=${encodeWeights(weights)}`);
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      {/* Sliders */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Weights: drag to set importance (0–100). We normalize each metric across all {cities.length.toLocaleString()} places and compute a weighted score.
          </p>
          <div className="flex shrink-0 gap-2">
            <button onClick={reset} className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:border-brand hover:text-brand">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button onClick={share} className="flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />} {copied ? "Copied!" : "Share settings"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.key} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3.5">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="flex items-center gap-1 text-sm font-bold text-foreground" title={m.hint}>
                  {m.label} {m.invert && <span className="text-[10px] font-semibold text-zinc-400">(lower is better)</span>}
                  <Info className="h-3 w-3 text-zinc-300" />
                </p>
                <span className="text-sm font-black text-brand">{weights[m.key]}</span>
              </div>
              <input
                type="range" min={0} max={100} value={weights[m.key]}
                onChange={(e) => setWeights((prev) => ({ ...prev, [m.key]: Number(e.target.value) }))}
                className="w-full accent-brand"
                aria-label={`${m.label} importance`}
              />
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Importance</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="City, state…"
              className="w-full rounded-full border border-zinc-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-500">Show</label>
            <select value={show} onChange={(e) => setShow(Number(e.target.value) as (typeof SHOW_OPTIONS)[number])}
              className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-brand">
              {SHOW_OPTIONS.map((n) => <option key={n} value={n}>{n === 0 ? "All" : `Top ${n}`}</option>)}
            </select>
          </div>
          <span className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-bold text-brand-dark">{cities.length.toLocaleString()} places</span>
        </div>
      </div>

      {/* Results table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Place</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Score</th>
              {METRICS.map((m) => <th key={m.key} className="px-3 py-3 text-center font-medium" title={m.hint}>{m.label.split(" ")[0]}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.city.slug} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/city/${r.city.slug}`} className="font-semibold text-foreground hover:text-brand">{r.city.name}</Link>
                  <p className="text-xs text-zinc-400">Pop. {r.city.population.toLocaleString()}{r.city.estimated ? " · estimated" : ""}</p>
                </td>
                <td className="px-4 py-3 text-zinc-500">{r.city.stateName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${r.score}%` }} />
                    </div>
                    <span className="shrink-0 text-xs font-bold text-foreground">{r.score.toFixed(1)}/100</span>
                  </div>
                </td>
                {METRICS.map((m) => (
                  <td key={m.key} className="px-3 py-3 text-center text-zinc-600">{r.perMetric[m.key].toFixed(1)}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4 + METRICS.length} className="px-4 py-10 text-center text-sm text-zinc-400">No places match &ldquo;{query}&rdquo;.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-400">
        Tip: hover any metric header for what it measures. Every metric is normalized 0–10 across all {cities.length.toLocaleString()} places before weighting, so a slider at 0 removes a metric&apos;s influence entirely.
        Data: cost of living &amp; safety indices, school ratings, climate, grid power hours, internet penetration, commute times and population growth — the same figures behind every city page and the{" "}
        <Link href="/rankings" className="font-semibold text-brand hover:underline">Rankings</Link> page.
      </p>
    </div>
  );
}
