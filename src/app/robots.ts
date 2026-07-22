import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

/** Paths with no SEO value or that shouldn't be crawled: private dashboards,
 * auth flows, API routes, and the /search utility page (query-string driven,
 * always redirects or shows a disambiguation page — indexing it wastes crawl
 * budget and risks duplicate-content signals). */
const DISALLOWED = [
  "/dashboard", "/admin", "/api", "/login", "/signup",
  "/become-tenant", "/create-property", "/edit-property", "/search",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      // Search engines and social link-preview crawlers: full access. These are
      // verified by the crawler operators themselves (IP/reverse-DNS, not just
      // the User-Agent string), so naming them here doesn't help an impersonator.
      { userAgent: ["Googlebot", "Bingbot", "facebookexternalhit", "WhatsApp", "Twitterbot", "LinkedInBot", "Slackbot"], allow: "/", disallow: DISALLOWED },
      // AI-training crawlers: these operators (OpenAI, Anthropic, Common Crawl,
      // Google's Bard/Gemini trainer) do honor a disallow for their own agent
      // string, separate from their search-indexing bot — this opts our
      // content out of model training without touching Google Search indexing.
      { userAgent: ["GPTBot", "ChatGPT-User", "CCBot", "Google-Extended", "ClaudeBot", "anthropic-ai", "Bytespider", "PerplexityBot"], disallow: "/" },
      // Everyone else (default posture for unnamed/unknown bots and generic scrapers).
      { userAgent: "*", allow: "/", disallow: DISALLOWED },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
