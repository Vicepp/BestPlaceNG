"use client";

import { useEffect, useState } from "react";
import { townsForCity } from "@/data/lagosTowns";

/** City header subtitle. When the visitor arrived by searching a town
 * (?town=Alakara), the town's own name leads the line so they always see the
 * place they searched; otherwise the default subtitle shows. */
export default function CitySubtitle({ citySlug, cityName, fallback }: {
  citySlug: string; cityName: string; fallback: string;
}) {
  const [town, setTown] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("town");
    if (!t) return;
    const match = townsForCity(citySlug).find((x) => x.town.toLowerCase() === t.toLowerCase());
    // "Mushin" town inside Mushin city is the city itself — no badge needed.
    if (match && match.town.toLowerCase() !== cityName.toLowerCase()) setTown(match.town);
  }, [citySlug, cityName]);

  if (town) {
    return (
      <p className="mt-1 text-sm text-zinc-500">
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">{town}</span>{" "}
        · a town in {cityName} — everything on this page covers it
      </p>
    );
  }
  return <p className="mt-1 text-sm text-zinc-500">{fallback}</p>;
}
