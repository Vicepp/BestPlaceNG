import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-100 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Explore</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/search" className="hover:text-brand">Find a City</Link></li>
              <li><Link href="/compare" className="hover:text-brand">Compare Cities</Link></li>
              <li><Link href="/rankings" className="hover:text-brand">Rankings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Housing</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/apartments" className="hover:text-brand">Apartments for Rent</Link></li>
              <li><Link href="/list-property" className="hover:text-brand">List a Property</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Data</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/rankings?metric=cost-of-living" className="hover:text-brand">Cost of Living</Link></li>
              <li><Link href="/rankings?metric=safety" className="hover:text-brand">Crime &amp; Safety</Link></li>
              <li><Link href="/rankings?metric=schools" className="hover:text-brand">School Ratings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Account</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/login" className="hover:text-brand">Login</Link></li>
              <li><Link href="/signup" className="hover:text-brand">Create Account</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-100 pt-6 text-xs text-zinc-400">
          <p>
            BestPlaceNG &copy; {new Date().getFullYear()}. City statistics are
            curated estimates intended for general guidance and are updated
            over time as verified data becomes available.
          </p>
        </div>
      </div>
    </footer>
  );
}
