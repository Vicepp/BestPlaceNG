# BestPlaceNG

Find the best place to live in Nigeria — compare cities by cost of living,
safety, climate, schools and more, then browse apartments to rent. Inspired
by BestPlaces.net, built for the Nigerian market.

## Status: Phase 1

This is the first build phase: landing page, Nigeria map, city search (by
name, state, or ZIP code) with same-name-different-state disambiguation,
city overview pages with a BestPlaces-style sidebar covering cost of living,
crime, climate, jobs, schools, economy, housing stats and more, a sample
apartments section, and a floating AI assistant (chat + voice via the
browser's built-in Speech Recognition) that recommends cities and links
only to internal city pages.

City data (population, state, LGA, ZIP) covers ~49 major Nigerian cities
and state capitals as a curated starting dataset — see
`src/data/cities.ts`. Several sidebar sections (health, religion, politics,
commute time, etc.) show a "coming soon" placeholder pending verified data.

**Not yet built (Phase 2):** landlord/tenant accounts, real property
listings (current apartment listings are sample data), and a wired-up AI
backend for the assistant (it currently uses local keyword matching against
the city dataset, no external API key required).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Phase 2 setup (when ready)

Copy `.env.local.example` to `.env.local` and fill in your Firebase project
keys. `src/lib/firebase.ts` is scaffolded but not wired into any UI yet.

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion (animations/transitions)
- `@svg-maps/nigeria` (interactive state map)
- Firebase (Phase 2 — auth, listings, reviews)

## Deploy

Build with `npm run build`. Deploys cleanly to Vercel or any Node hosting
platform that supports Next.js.
