"use client";

import { useState } from "react";
import nigeria from "@svg-maps/nigeria";
import { getCitiesByState } from "@/data/cities";
import { getStateBySlug } from "@/data/states";
import Link from "next/link";

interface MapLocation {
  id: string;
  name: string;
  path: string;
}

// The @svg-maps/nigeria package spells Nasarawa State's id "nassarawa" (double s),
// while our state/city data uses the standard "nasarawa" spelling. Normalize here
// so clicking that state on the map actually resolves to its cities.
const STATE_ID_ALIASES: Record<string, string> = {
  nassarawa: "nasarawa",
};
function normalizeStateId(id: string) {
  return STATE_ID_ALIASES[id] ?? id;
}

export default function NigeriaMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const locations = (nigeria as { locations: MapLocation[] }).locations;

  const activeSlug = hovered ? normalizeStateId(hovered) : selected ? normalizeStateId(selected) : null;
  const activeState = activeSlug ? getStateBySlug(activeSlug) : null;
  const activeCitiesAll = activeSlug ? getCitiesByState(activeSlug) : [];
  const activeCities = activeCitiesAll.slice(0, 8);
  const activeMoreCount = activeCitiesAll.length - activeCities.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <svg
          viewBox={nigeria.viewBox}
          className="h-auto w-full"
          role="img"
          aria-label="Map of Nigeria by state"
        >
          {locations.map((loc) => (
            <path
              key={loc.id}
              d={loc.path}
              className={`nigeria-map-state ${selected === loc.id ? "active" : ""}`}
              onMouseEnter={() => setHovered(loc.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(loc.id)}
            >
              <title>{loc.name}</title>
            </path>
          ))}
        </svg>
      </div>

      <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        {!activeState && (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-500">
            <p className="text-sm">
              Hover or click a state to see its cities, then jump straight to
              the city overview.
            </p>
          </div>
        )}
        {activeState && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {activeState.region}
            </p>
            <h3 className="mt-1 text-2xl font-bold text-foreground">
              {activeState.name}
            </h3>
            <p className="text-sm text-zinc-500">
              Capital: {activeState.capital}
            </p>
            <div className="mt-4 space-y-2">
              {activeCities.length === 0 && (
                <p className="text-sm text-zinc-500">
                  No cities in our database for this state yet.
                </p>
              )}
              {activeCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/city/${c.slug}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-brand hover:bg-brand-light"
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-zinc-400">
                    {c.population.toLocaleString()} people
                  </span>
                </Link>
              ))}
              {activeMoreCount > 0 && (
                <Link
                  href={`/search?q=${encodeURIComponent(activeState.name)}`}
                  className="block rounded-lg border border-dashed border-zinc-200 px-4 py-2.5 text-center text-xs text-zinc-400 hover:border-brand hover:text-brand"
                >
                  +{activeMoreCount} more in {activeState.name}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
