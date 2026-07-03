import { Vote, Landmark, Info } from "lucide-react";
import type { CityData } from "@/data/cities";
import {
  getStateInsight,
  tallyWins,
  PARTY_NAMES,
  PARTY_COLORS,
  PARTY_BAR_COLORS,
  INSIGHTS_SOURCE,
  type PartyCode,
} from "@/data/insights";
import ComingSoon from "@/components/ComingSoon";

export default async function PoliticsPanel({ city }: { city: CityData }) {
  const insight = await getStateInsight(city.stateSlug);
  if (!insight || insight.elections.length === 0) {
    return <ComingSoon topic="Politics & voting" />;
  }

  const elections = [...insight.elections].sort((a, b) => a.year - b.year);
  const latest = elections[elections.length - 1];
  const wins = tallyWins(elections);
  const leadingParty = wins[0];
  const distinctParties = wins.length;
  const stateLabel = city.stateName === "Federal Capital Territory" ? "the FCT" : `${city.stateName} State`;
  const top3 = insight.top3 ?? [];
  const maxWins = Math.max(...wins.map((w) => w.wins), 1);

  // Plain-language read on the state's leaning — no cryptic codes.
  const leaning =
    distinctParties === 1
      ? `${stateLabel} has been a firm stronghold — the ${PARTY_NAMES[leadingParty.party]} won the presidential vote here in all ${elections.length} of the last elections.`
      : distinctParties >= 3
      ? `${stateLabel} is a genuine swing area — it has backed ${distinctParties} different parties across the last ${elections.length} presidential elections, so no single party can take it for granted.`
      : `${stateLabel} has shifted between parties recently, most recently backing the ${PARTY_NAMES[latest.party]} in ${latest.year}.`;

  return (
    <div className="space-y-6">
      {/* How voting works in Nigeria — general knowledge, not US framing */}
      <div className="rounded-2xl border border-brand/20 bg-brand-light p-5 text-sm text-brand-dark">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <p className="font-semibold">How voting works in Nigeria</p>
        </div>
        <p className="mt-2 leading-relaxed">
          Nigerians vote directly for the President every four years, organised by INEC (the Independent National Electoral
          Commission). On the same cycle, each state elects a Governor who runs the state government. This page shows which
          party won the presidential vote in {stateLabel} in each election, the leading parties in the most recent vote, and
          which party currently controls the state government — a practical guide to the political leaning of the area you&apos;re
          considering.
        </p>
      </div>

      {/* Summary + who governs */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Political Leaning of {stateLabel}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{leaning}</p>
        {insight.governor && insight.governor !== "N/A" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-50 p-4">
            <Landmark className="h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-foreground">State Government</p>
              <p className="text-sm text-zinc-600">
                {stateLabel} is currently governed by the{" "}
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PARTY_COLORS[insight.governor]}`}>
                  {PARTY_NAMES[insight.governor]}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 parties in the last presidential election */}
      {top3.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Top 3 Parties — {latest.year} Presidential Vote</h3>
          <p className="mt-1 text-xs text-zinc-400">Finishing order in {stateLabel} (1st = won the state).</p>
          <div className="mt-4 space-y-2">
            {top3.map((party: PartyCode, i) => (
              <div key={party} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                  {i + 1}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PARTY_COLORS[party]}`}>
                  {PARTY_NAMES[party]}
                </span>
                {i === 0 && <span className="text-xs font-semibold text-green-600">Won {stateLabel}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical winners — timeline + simple wins-per-party bar chart */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Vote className="h-4 w-4 text-brand" />
          <h3 className="text-base font-bold text-foreground">Presidential Voting History</h3>
        </div>

        {/* Winner timeline */}
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-2 font-medium">Election</th>
                <th className="px-4 py-2 font-medium">Party that won {stateLabel}</th>
                <th className="px-4 py-2 font-medium">How decisive</th>
              </tr>
            </thead>
            <tbody>
              {[...elections].reverse().map((e, i) => (
                <tr key={e.year} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-4 py-3 font-medium text-foreground">{e.year}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PARTY_COLORS[e.party]}`}>
                      {PARTY_NAMES[e.party]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{e.wide ? "Comfortable win" : "Close contest"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Wins-per-party bar chart (derived, not fabricated) */}
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold text-zinc-500">
            Presidential elections won in {stateLabel} ({elections[0].year}–{latest.year})
          </p>
          <div className="space-y-2">
            {wins.map((w) => (
              <div key={w.party} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-semibold text-zinc-500">{w.party}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="flex h-full items-center justify-end rounded-full px-2"
                    style={{ width: `${(w.wins / maxWins) * 100}%`, backgroundColor: PARTY_BAR_COLORS[w.party] }}
                  >
                    <span className="text-xs font-bold text-white">{w.wins}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-400">
          {city.tier !== "major" && `Presidential results are declared per state, so ${city.name} shares ${stateLabel}'s figures. `}
          Source: {INSIGHTS_SOURCE.split("Religion:")[0].replace("Elections:", "").trim()}
        </p>
      </div>
    </div>
  );
}
