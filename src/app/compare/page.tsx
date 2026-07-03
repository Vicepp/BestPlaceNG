import Link from "next/link";
import { cities } from "@/data/cities";
import { getCostOfLivingProfile } from "@/data/costOfLiving";
import { getCrimeProfile } from "@/data/crime";
import { citySections } from "@/data/citySections";

const YEAR = new Date().getFullYear();

/** Curated popular comparisons shown on the landing view. */
const CURATED: { title: string; pairs: [string, string][] }[] = [
  {
    title: "Compare Major Business Hubs",
    pairs: [
      ["lagos-lagos", "abuja-fct"],
      ["port-harcourt-rivers", "lagos-lagos"],
      ["kano-kano", "kaduna-kaduna"],
      ["ibadan-oyo", "lagos-lagos"],
      ["abuja-fct", "port-harcourt-rivers"],
    ],
  },
  {
    title: "Compare Best Cities For Affordability",
    pairs: [
      ["ibadan-oyo", "abeokuta-ogun"],
      ["ilorin-kwara", "oshogbo-osun"],
      ["kano-kano", "sokoto-sokoto"],
      ["enugu-enugu", "owerri-imo"],
      ["benin-city-edo", "asaba-delta"],
    ],
  },
];

const COMPARISON_TOPICS = [
  "Population", "Cost of Living", "Average Rent", "Crime & Safety",
  "Climate", "Schools", "Local Economy", "Housing",
];

function cityLabel(slug: string): string {
  const c = cities.find((x) => x.slug === slug);
  return c ? `${c.name}, ${c.stateName}` : slug;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const cityA = cities.find((c) => c.slug === a);
  const cityB = cities.find((c) => c.slug === b);
  const comparing = Boolean(cityA && cityB && cityA.slug !== cityB.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {!comparing ? (
        <LandingView defaultA={a} defaultB={b} />
      ) : (
        <ComparisonView cityA={cityA!} cityB={cityB!} />
      )}
    </div>
  );
}

/* ─────────────────────────── Landing ─────────────────────────── */

function LandingView({ defaultA, defaultB }: { defaultA?: string; defaultB?: string }) {
  return (
    <div>
      <div className="rounded-2xl border border-zinc-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-extrabold text-foreground">{YEAR} Compare Cities</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500">
          Perform an overall comparison between two Nigerian cities over a dozen categories — cost of living, rent, safety, climate, schools and more.
        </p>

        <form action="/compare" className="mx-auto mt-6 flex max-w-md flex-col gap-4">
          <div className="text-left">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Enter 1st City:</label>
            <CitySelect name="a" defaultValue={defaultA} />
          </div>
          <div className="text-left">
            <label className="mb-1 block text-xs font-semibold text-zinc-500">Enter 2nd City:</label>
            <CitySelect name="b" defaultValue={defaultB} />
          </div>
          <button type="submit" className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark">
            Compare Cities
          </button>
        </form>

        <div className="mx-auto mt-8 max-w-lg">
          <p className="text-xs font-semibold text-zinc-400">The most popular comparisons are:</p>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5 text-left sm:grid-cols-2">
            {COMPARISON_TOPICS.map((t) => (
              <p key={t} className="flex items-center gap-2 text-sm text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Curated comparisons */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {CURATED.map((group) => (
          <div key={group.title} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-foreground">{group.title}</h2>
            <div className="mt-3 space-y-2">
              {group.pairs.map(([pa, pb]) => (
                <Link
                  key={`${pa}-${pb}`}
                  href={`/compare?a=${pa}&b=${pb}`}
                  className="block text-sm font-medium text-brand underline-offset-2 hover:underline"
                >
                  {cityLabel(pa)} vs {cityLabel(pb)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CitySelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      required
      className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
    >
      <option value="" disabled>Enter City Or Town</option>
      {cities.filter((c) => c.tier === "major").map((c) => (
        <option key={c.slug} value={c.slug}>{c.name}, {c.stateName}</option>
      ))}
    </select>
  );
}

/* ─────────────────────── Comparison view ─────────────────────── */

type CityType = (typeof cities)[number];

async function ComparisonView({ cityA, cityB }: { cityA: CityType; cityB: CityType }) {
  const [colA, colB, crimeA, crimeB] = await Promise.all([
    getCostOfLivingProfile(cityA),
    getCostOfLivingProfile(cityB),
    getCrimeProfile(cityA),
    getCrimeProfile(cityB),
  ]);

  // ── Dynamic highlights, generated from real data (never static strings) ──
  const highlights: { q: string; a: string }[] = [];

  const popRatio = cityA.population / cityB.population;
  highlights.push({
    q: `Is ${cityA.name} bigger or smaller than ${cityB.name}?`,
    a: popRatio > 1.15
      ? `${cityA.name} is significantly larger — about ${popRatio.toFixed(1)}× the population of ${cityB.name} (${cityA.population.toLocaleString()} vs ${cityB.population.toLocaleString()}).`
      : popRatio < 0.87
      ? `${cityB.name} is significantly larger — about ${(1 / popRatio).toFixed(1)}× the population of ${cityA.name} (${cityB.population.toLocaleString()} vs ${cityA.population.toLocaleString()}).`
      : `They're similar in size — ${cityA.name} has ${cityA.population.toLocaleString()} people and ${cityB.name} has ${cityB.population.toLocaleString()}.`,
  });

  if (colA && colB) {
    const diff = ((colA.twoBedroomRent - colB.twoBedroomRent) / colB.twoBedroomRent) * 100;
    highlights.push({
      q: `Are housing costs cheaper in ${cityA.name} or ${cityB.name}?`,
      a: Math.abs(diff) < 5
        ? `Rent is roughly the same — a 2-bedroom flat runs about ₦${colA.twoBedroomRent.toLocaleString()}/yr in ${cityA.name} and ₦${colB.twoBedroomRent.toLocaleString()}/yr in ${cityB.name}.`
        : diff > 0
        ? `${cityB.name} housing is about ${Math.abs(diff).toFixed(0)}% cheaper — a 2-bedroom flat averages ₦${colB.twoBedroomRent.toLocaleString()}/yr vs ₦${colA.twoBedroomRent.toLocaleString()}/yr in ${cityA.name}.`
        : `${cityA.name} housing is about ${Math.abs(diff).toFixed(0)}% cheaper — a 2-bedroom flat averages ₦${colA.twoBedroomRent.toLocaleString()}/yr vs ₦${colB.twoBedroomRent.toLocaleString()}/yr in ${cityB.name}.`,
    });
  }

  if (crimeA && crimeB) {
    const safer = crimeA.violentCrimeIndex < crimeB.violentCrimeIndex ? cityA : cityB;
    const other = safer.slug === cityA.slug ? cityB : cityA;
    const saferIdx = safer.slug === cityA.slug ? crimeA.violentCrimeIndex : crimeB.violentCrimeIndex;
    const otherIdx = safer.slug === cityA.slug ? crimeB.violentCrimeIndex : crimeA.violentCrimeIndex;
    highlights.push({
      q: `Which city is safer, ${cityA.name} or ${cityB.name}?`,
      a: Math.abs(saferIdx - otherIdx) < 4
        ? `Both rate similarly on our violent crime index (${crimeA.violentCrimeIndex} vs ${crimeB.violentCrimeIndex}, lower is safer).`
        : `${safer.name} rates safer — its violent crime index is ${saferIdx} vs ${otherIdx} for ${other.name} (lower is safer).`,
    });
  }

  if (cityA.climate && cityB.climate) {
    const hotter = cityA.climate.tempHighC >= cityB.climate.tempHighC ? cityA : cityB;
    const cooler = hotter.slug === cityA.slug ? cityB : cityA;
    highlights.push({
      q: `Which city is hotter?`,
      a: Math.abs(cityA.climate.tempHighC - cityB.climate.tempHighC) < 2
        ? `Very similar — typical highs are ${cityA.climate.tempHighC}°C in ${cityA.name} and ${cityB.climate.tempHighC}°C in ${cityB.name}.`
        : `${hotter.name} runs hotter (highs around ${hotter.climate!.tempHighC}°C) while ${cooler.name} stays milder (around ${cooler.climate!.tempHighC}°C).`,
    });
  }

  // ── Table rows: [label, valueA, valueB, valueNigeria] ──
  const rows: [string, string, string, string][] = [
    ["Population", cityA.population.toLocaleString(), cityB.population.toLocaleString(), "223,800,000"],
    ["Cost of Living Index", String(cityA.costOfLivingIndex ?? "—"), String(cityB.costOfLivingIndex ?? "—"), "100"],
    ["Safety Index", String(cityA.safetyIndex ?? "—"), String(cityB.safetyIndex ?? "—"), "100"],
    ["School Rating", cityA.schoolRating ? `${cityA.schoolRating}/10` : "—", cityB.schoolRating ? `${cityB.schoolRating}/10` : "—", "—"],
    ["Avg High Temp", cityA.climate ? `${cityA.climate.tempHighC}°C` : "—", cityB.climate ? `${cityB.climate.tempHighC}°C` : "—", "—"],
  ];
  if (colA && colB) {
    rows.push(
      ["2-Bed Rent (₦/yr)", `₦${colA.twoBedroomRent.toLocaleString()}`, `₦${colB.twoBedroomRent.toLocaleString()}`, "₦1,500,000"],
      ["Median Home Cost", `₦${colA.medianHomeCost.toLocaleString()}`, `₦${colB.medianHomeCost.toLocaleString()}`, "₦28,000,000"],
    );
  }
  if (crimeA && crimeB) {
    rows.push(["Violent Crime Index", String(crimeA.violentCrimeIndex), String(crimeB.violentCrimeIndex), "44"]);
  }

  const learnSections = citySections.filter((s) =>
    ["overview", "cost-of-living", "jobs", "crime", "climate", "religion", "politics-voting", "housing-stats"].includes(s.slug)
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Main column */}
      <div className="space-y-6 lg:col-span-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-foreground">
            {YEAR} Compare Cities Overview:<br className="sm:hidden" /> {cityA.name}, {cityA.stateName} vs {cityB.name}, {cityB.stateName}
          </h1>
          <Link href="/compare" className="mt-1 inline-block text-xs font-semibold text-brand underline-offset-2 hover:underline">
            Change Cities
          </Link>
        </div>

        {/* Highlights */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-foreground">Highlights</h2>
          <div className="mt-4 space-y-4">
            {highlights.map((h) => (
              <div key={h.q}>
                <p className="text-sm font-semibold text-foreground">{h.q}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">— {h.a}</p>
              </div>
            ))}
            {cityA.description && (
              <div>
                <p className="text-sm font-semibold text-foreground">Things to know about {cityA.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{cityA.description}</p>
              </div>
            )}
            {cityB.description && (
              <div>
                <p className="text-sm font-semibold text-foreground">Things to know about {cityB.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{cityB.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Side-by-side table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3 font-medium"></th>
                <th className="px-5 py-3 font-semibold text-brand-dark">{cityA.name}, {cityA.stateName}</th>
                <th className="px-5 py-3 font-semibold text-brand-dark">{cityB.name}, {cityB.stateName}</th>
                <th className="px-5 py-3 font-medium">Nigeria</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, va, vb, vn], i) => (
                <tr key={label} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                  <td className="px-5 py-3 font-medium text-zinc-500">{label}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">{va}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">{vb}</td>
                  <td className="px-5 py-3 text-zinc-500">{vn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3">
          <Link href={`/city/${cityA.slug}/cost-of-living`} className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dark">
            {cityA.name} Cost of Living →
          </Link>
          <Link href={`/city/${cityB.slug}/cost-of-living`} className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-dark">
            {cityB.name} Cost of Living →
          </Link>
        </div>
      </div>

      {/* Sidebar: Learn More boxes */}
      <div className="space-y-4">
        {[cityA, cityB].map((c) => (
          <div key={c.slug} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">
              Learn More About {c.name}, {c.stateName}
            </h3>
            <div className="mt-2 space-y-1">
              {learnSections.map((s) => (
                <Link
                  key={s.slug}
                  href={s.slug === "overview" ? `/city/${c.slug}` : `/city/${c.slug}/${s.slug}`}
                  className="block text-sm font-medium text-brand underline-offset-2 hover:underline"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
