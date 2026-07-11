"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, X, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setFirestoreDoc } from "@/lib/firestoreWrite";
import { cities } from "@/data/cities";

const MAX_LOCATIONS = 5;

/** Cities the user is interested in living in — used to personalise
 * recommendations and (later) alerts for new listings there. */
export default function IntentLocationsTab() {
  const { user, profile } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelected(profile?.intentLocations ?? []);
  }, [profile]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return cities
      .filter((c) => (c.name.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q)) && !selected.includes(c.slug))
      .sort((a, b) => b.population - a.population)
      .slice(0, 8);
  }, [query, selected]);

  function add(slug: string) {
    if (selected.length >= MAX_LOCATIONS) return;
    setSelected((prev) => [...prev, slug]);
    setQuery("");
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    await setFirestoreDoc("users", user.uid, { intentLocations: selected });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const label = (slug: string) => {
    const c = cities.find((x) => x.slug === slug);
    return c ? `${c.name}, ${c.stateName}` : slug;
  };

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-foreground">Intent Locations</h2>
      <p className="text-sm text-zinc-400">
        Where are you looking to live or invest? Pick up to {MAX_LOCATIONS} cities — we&apos;ll use them to tailor
        recommendations across the site.
      </p>

      {/* Selected chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selected.length === 0 && <p className="text-xs text-zinc-400">No locations picked yet.</p>}
        {selected.map((slug) => (
          <span key={slug} className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark">
            <MapPin className="h-3 w-3" /> {label(slug)}
            <button onClick={() => setSelected((prev) => prev.filter((s) => s !== slug))} aria-label={`Remove ${label(slug)}`}
              className="text-brand-dark/60 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Search + add */}
      {selected.length < MAX_LOCATIONS && (
        <div className="relative mt-4 max-w-sm">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a city or state…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          {matches.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-xl">
              {matches.map((c) => (
                <button key={c.slug} onClick={() => add(c.slug)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-brand-light">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" /> {c.name}, {c.stateName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save locations"}
        </button>
        {saved && <span className="text-xs font-semibold text-green-600">Saved!</span>}
      </div>
    </div>
  );
}
