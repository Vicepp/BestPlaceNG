import Link from "next/link";
import { cities } from "@/data/cities";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const cityA = cities.find((c) => c.slug === a);
  const cityB = cities.find((c) => c.slug === b);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-foreground">Compare Cities</h1>
      <p className="mt-2 text-zinc-500">Pick two cities to compare side by side.</p>

      <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" action="/compare">
        <CitySelect name="a" defaultValue={a} />
        <CitySelect name="b" defaultValue={b} />
        <button type="submit" className="sm:col-span-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Compare
        </button>
      </form>

      {cityA && cityB && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-100">
          <Row label="" valueA={cityA.name} valueB={cityB.name} header />
          <Row label="State" valueA={cityA.stateName} valueB={cityB.stateName} />
          <Row label="Population" valueA={cityA.population.toLocaleString()} valueB={cityB.population.toLocaleString()} />
          <Row label="Cost of Living Index" valueA={cityA.costOfLivingIndex ?? "—"} valueB={cityB.costOfLivingIndex ?? "—"} />
          <Row label="Safety Index" valueA={cityA.safetyIndex ?? "—"} valueB={cityB.safetyIndex ?? "—"} />
          <Row label="School Rating" valueA={cityA.schoolRating ?? "—"} valueB={cityB.schoolRating ?? "—"} />
          <Row label="Avg High Temp" valueA={cityA.climate ? `${cityA.climate.tempHighC}°C` : "—"} valueB={cityB.climate ? `${cityB.climate.tempHighC}°C` : "—"} />
          <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4">
            <Link href={`/city/${cityA.slug}`} className="text-center text-sm font-semibold text-brand">View {cityA.name} &rarr;</Link>
            <Link href={`/city/${cityB.slug}`} className="text-center text-sm font-semibold text-brand">View {cityB.name} &rarr;</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CitySelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
    >
      <option value="" disabled>
        Select a city...
      </option>
      {cities
        .filter((c) => c.tier === "major")
        .map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}, {c.stateName}
          </option>
        ))}
    </select>
  );
}

function Row({
  label,
  valueA,
  valueB,
  header,
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
  header?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-4 border-b border-zinc-50 px-5 py-3 last:border-b-0 ${header ? "bg-brand-light" : "bg-white"}`}>
      <div className={header ? "text-center font-bold text-brand-dark" : "text-sm text-foreground"}>
        {label && <span className="mr-2 text-xs text-zinc-400">{label}</span>}
        {valueA}
      </div>
      <div className={header ? "text-center font-bold text-brand-dark" : "text-sm text-foreground"}>
        {label && <span className="mr-2 text-xs text-zinc-400">{label}</span>}
        {valueB}
      </div>
    </div>
  );
}
