"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function CitySearchBar({
  size = "lg",
  placeholder = "Search by city, state, or ZIP code...",
}: {
  size?: "lg" | "sm";
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full items-center gap-2 rounded-full border border-zinc-200 bg-white p-1.5 shadow-lg ${
        size === "lg" ? "h-16" : "h-12"
      }`}
    >
      <Search className="ml-3 h-5 w-5 shrink-0 text-zinc-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="text"
        placeholder={placeholder}
        className="h-full flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-zinc-400"
      />
      <button
        type="submit"
        className={`shrink-0 rounded-full bg-brand px-6 font-semibold text-white transition hover:bg-brand-dark ${
          size === "lg" ? "h-12" : "h-9 text-sm"
        }`}
      >
        Go
      </button>
    </form>
  );
}
