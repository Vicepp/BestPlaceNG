import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory sliding-window rate limiter for cost-sensitive API routes, run as
 * Next.js Proxy (the file/export MUST be named proxy.ts/proxy() — the old
 * "middleware.ts" convention is deprecated in Next 16 and its compat shim
 * does not reliably preserve module-level state across requests).
 *
 * Scoped ONLY to /api/assistant (pay-per-call LLM requests) and /api/payments
 * (verification against external payment providers) — deliberately NEVER
 * applied to /city, /learn or other crawlable content pages, so it can't
 * throttle Googlebot/Bingbot or break search indexing.
 *
 * Proxy defaults to the Node.js runtime in Next 16, so this module's state
 * persists for the life of one server process — but on serverless hosting
 * that's still per-instance, not shared across regions/instances. Treat it
 * as a first line of defense against bulk abuse and cost spikes, not a hard
 * guarantee. If traffic grows enough that cross-instance accuracy matters,
 * swap the Map below for Upstash Redis (`@upstash/ratelimit`) behind the same
 * checkLimit() shape.
 */
const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  "/api/assistant": 20,
  "/api/payments": 15,
};
const MAX_TRACKED_KEYS = 5000; // opportunistic cleanup trigger, bounds memory

const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function limitKeyFor(pathname: string): string | null {
  if (pathname.startsWith("/api/assistant")) return "/api/assistant";
  if (pathname.startsWith("/api/payments")) return "/api/payments";
  return null;
}

function pruneExpired(now: number) {
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}

export function proxy(req: NextRequest) {
  const routeKey = limitKeyFor(req.nextUrl.pathname);
  if (!routeKey) return NextResponse.next();

  const now = Date.now();
  if (hits.size > MAX_TRACKED_KEYS) pruneExpired(now);

  const key = `${routeKey}:${clientIp(req)}`;
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count += 1;
  if (entry.count > LIMITS[routeKey]) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { ok: false, error: "Too many requests — please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/assistant/:path*", "/api/payments/:path*"],
};
