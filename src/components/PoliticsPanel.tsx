import { Vote } from "lucide-react";
import type { CityData } from "@/data/cities";
import { getStateInsight, buildVoteWord, PARTY_NAMES, PARTY_COLORS, INSIGHTS_SOURCE } from "@/data/insights";
import ComingSoon from "@/components/ComingSoon";

export default async function PoliticsPanel({ city }: { city: CityData }) {
  const insight = await getStateInsight(city.stateSlug);
  if (!insight || insight.elections.length === 0) {
    return <ComingSoon topic="Politics & voting" />;
  }

  const voteWord = buildVoteWord(insight.elections);
  const latest = insight.elections[insight.elections.length - 1];
  const parties = [...new Set(insight.elections.map((e) => e.party))];
  const swingState = parties.length >= 3;
  const stateLabel = city.stateName === "Federal Capital Territory" ? "the FCT" : `${city.stateName} State`;

  return (
    <div className="space-y-6">
      {/* VoteWord */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">VoteWord™ for {stateLabel}</h3>
        <p className="mt-1 text-xs text-zinc-400">
          {insight.elections.length} presidential elections ({insight.elections[0].year}–{latest.year}), visualised in one word.
        </p>
        <p className="mt-4 text-center text-5xl font-extrabold tracking-widest text-brand-dark">{voteWord}</p>
        <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600">
          <p className="font-semibold text-foreground">How it works</p>
          <p className="mt-1">
            Each letter is one presidential election: <strong>A</strong> if APC won {stateLabel}, <strong>P</strong> for PDP,{" "}
            <strong>L</strong> for Labour Party, <strong>K</strong> for NNPP. UPPERCASE means the winning margin was wide
            (over 10%); lowercase means it was close.
          </p>
          <p className="mt-2">
            {swingState
              ? `${stateLabel} has voted for ${parties.length} different parties across these elections — a genuine swing state.`
              : parties.length === 2
              ? `${stateLabel} has switched between ${PARTY_NAMES[parties[0]]} and ${PARTY_NAMES[parties[1]]} in recent elections.`
              : `${stateLabel} has voted ${PARTY_NAMES[parties[0]]} in every recent presidential election — a party stronghold.`}
          </p>
        </div>
      </div>

      {/* Election results table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-6 pt-6">
          <Vote className="h-4 w-4 text-brand" />
          <h3 className="text-base font-bold text-foreground">Presidential Results in {stateLabel}</h3>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-2 font-medium">Election</th>
              <th className="px-6 py-2 font-medium">Winning Party (statewide)</th>
              <th className="px-6 py-2 font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {[...insight.elections].reverse().map((e, i) => (
              <tr key={e.year} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className="px-6 py-3 font-medium text-foreground">{e.year}</td>
                <td className="px-6 py-3">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PARTY_COLORS[e.party]}`}>
                    {e.party} — {PARTY_NAMES[e.party]}
                  </span>
                </td>
                <td className="px-6 py-3 text-zinc-500">{e.wide ? "Wide (>10%)" : "Narrow"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-6 py-4 text-xs text-zinc-400">
          {city.tier !== "major" && `Presidential results are declared per state, so ${city.name} shares ${stateLabel}'s result. `}
          Source: {INSIGHTS_SOURCE.split("Religion:")[0].trim()}
        </p>
      </div>
    </div>
  );
}
