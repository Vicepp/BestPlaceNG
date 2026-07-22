import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { getPersonalizeCities } from "@/data/personalize";
import PersonalizeExplorer from "@/components/PersonalizeExplorer";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Where Should I Move? | BestPlaceNG",
  description: "Tune what matters to you — cost, safety, schools, climate, power, internet, commute and growth — and we'll score and rank every Nigerian city and town in real time.",
};

export default async function WhereShouldIMovePage() {
  const cities = await getPersonalizeCities();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand">
        <Compass className="h-3.5 w-3.5" /> Personalized ranking
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-foreground sm:text-4xl">Where Should I Move?</h1>
      <p className="mt-2 max-w-2xl text-zinc-500">
        Tune what matters to you. We&apos;ll score and rank cities and towns from the BestPlaceNG dataset in real time —
        built from the same cost of living, safety, schools, climate, power, internet, commute and growth
        figures used across every city page.
      </p>

      <div className="mt-6">
        <PersonalizeExplorer cities={cities} />
      </div>
    </div>
  );
}
