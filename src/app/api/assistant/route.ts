import { NextRequest, NextResponse } from "next/server";
import { cities, searchCities, type CityData } from "@/data/cities";
import { getApartmentsLive } from "@/data/apartments";
import { getDirectoryListingsLive } from "@/data/directoryListings";
import { citySections } from "@/data/citySections";

export const runtime = "nodejs";

const VALID_SLUGS = new Set(cities.map((c) => c.slug));
const VALID_SECTIONS = citySections.map((s) => s.slug);
const VALID_SECTION_SET = new Set(VALID_SECTIONS);

function cityLabel(c: CityData | undefined, fallbackSlug: string) {
  return c ? `${c.name}, ${c.stateName}` : fallbackSlug;
}

const SYSTEM_PROMPT = `You are the BestPlaceNG assistant, built into a website that helps people find the best place to live in Nigeria, browse real apartment/property listings, and find jobs, schools, hospitals, pharmacies, hotels, events, markets, shopping malls and police stations by city.

Before answering, think carefully about what the user actually needs and reason about tradeoffs honestly (e.g. a cheap city might also be less safe). Do not just pattern-match keywords.

Hard rules:
- Only use the data provided to you below (city stats AND the listings inventory). Never invent a city, statistic, listing, or fact not present in that data.
- The listings inventory (apartments, jobs, schools, hospitals, etc.) is the live, current, complete set of everything posted on the site right now - nothing more exists beyond what's listed. If a city has no listing in a category, that means there genuinely isn't one yet, not that you lack information.
- When the user asks about a specific category in a specific city (e.g. "is there a job in X", "find an apartment in Y", "any hospitals in Z"):
  1. Check the listings data for that EXACT city first. If there's a match, mention it specifically by name.
  2. If there is NO matching listing for that exact city, say so plainly and honestly (e.g. "There are no job listings in X yet"). Then check other cities in the SAME STATE for that category. If you find one there, recommend it as the nearest alternative (e.g. "...but Y, also in [state], has one listed.").
  3. If nothing exists anywhere in the provided data for that category, say so honestly instead of guessing or making something up.
- Never recommend or link to anything outside this website.
- If the user's question has nothing to do with finding a place to live, housing, jobs, or local services in Nigeria, say so briefly and steer them back to what you can help with.
- If you don't have enough data to answer confidently, say that plainly instead of guessing.

When you recommend a city, also say which section of that city's page is most relevant to what they asked, using one of these exact section slugs: ${VALID_SECTIONS.join(", ")}. For example use "jobs" if they asked about work, "apartments" for rentals, "crime" for safety questions, "school-ratings" for schools, "health" for hospitals/pharmacies, "cost-of-living" for budget questions. Default to "overview" if no specific section fits better.

Respond with ONLY a JSON object, no other text, no markdown fences, shaped exactly like this:
{"reply": "a short, friendly 2-4 sentence answer", "recommendations": [{"slug": "city-slug", "section": "jobs"}]}

recommendations should be 0 to 5 entries (slugs only from the data provided), ordered best-first. Use an empty array if no specific city/section fits (e.g. off-topic questions).`;

function buildCityContext(query: string): string {
  const majors = cities.filter((c) => c.tier === "major");
  const majorLines = majors
    .map((c) => {
      const climate = c.climate ? `high ${c.climate.tempHighC}C/low ${c.climate.tempLowC}C, rains ${c.climate.rainySeasonMonths}` : "n/a";
      return `${c.slug} | ${c.name}, ${c.stateName} | pop ${c.population.toLocaleString()} | cost-of-living ${c.costOfLivingIndex ?? "n/a"} (100=avg) | safety ${c.safetyIndex ?? "n/a"} (100=avg, higher=safer) | schools ${c.schoolRating ?? "n/a"}/10 | climate: ${climate} | ${c.description ?? ""}`;
    })
    .join("\n");

  const matched = searchCities(query)
    .filter((c) => c.tier === "lga")
    .slice(0, 8);
  const matchedLines = matched
    .map((c) => `${c.slug} | ${c.name}, ${c.stateName} | pop ${c.population.toLocaleString()} | smaller LGA-level entry, no detailed stats yet`)
    .join("\n");

  return `MAJOR CITIES (full profiles, 49 total):\n${majorLines}${matchedLines ? `\n\nOTHER PLACES NAMED IN THE USER'S MESSAGE:\n${matchedLines}` : ""}`;
}

async function buildListingsContext(): Promise<string> {
  const [apartments, directoryListings] = await Promise.all([getApartmentsLive(), getDirectoryListingsLive()]);

  const aptLines = apartments
    .map((a) => {
      const city = cities.find((c) => c.slug === a.citySlug);
      return `${a.citySlug} (${cityLabel(city, a.citySlug)}) | ${a.type} for ${a.purpose} | "${a.title}" in ${a.area} | ₦${a.priceNaira.toLocaleString()}${a.pricePeriod ? `/${a.pricePeriod}` : ""} | ${a.bedrooms}bd/${a.bathrooms}ba`;
    })
    .join("\n");

  const dirLines = directoryListings
    .map((d) => {
      const city = cities.find((c) => c.slug === d.citySlug);
      return `${d.citySlug} (${cityLabel(city, d.citySlug)}) | category: ${d.category} | "${d.name}"${d.subtitle ? ` (${d.subtitle})` : ""}${d.address ? ` in ${d.address}` : ""}${d.meta ? ` | ${d.meta}` : ""}`;
    })
    .join("\n");

  return `APARTMENT/PROPERTY LISTINGS - the complete live inventory, ${apartments.length} total (categories: Apartment, House, Duplex, Land, Self-Contain, Shop/Office; purpose: Rent or Sale):\n${aptLines || "(none posted yet anywhere on the site)"}\n\nDIRECTORY LISTINGS - the complete live inventory, ${directoryListings.length} total (categories: job, school, hospital, pharmacy, hotel, event, market, shopping-mall, police-station):\n${dirLines || "(none posted yet anywhere on the site)"}`;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Recommendation {
  slug: string;
  section?: string;
}

async function callOpenRouter(model: string, messages: ChatMessage[]): Promise<string | undefined> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bestplaceng.local",
      "X-Title": "BestPlaceNG Assistant",
    },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 600 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`OpenRouter (${model}) HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function callQwenDirect(messages: ChatMessage[]): Promise<string | undefined> {
  const res = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "qwen-plus", messages, temperature: 0.4, max_tokens: 600 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Qwen direct HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

function parseAssistantJson(raw: string): { reply: string; recommendations: Recommendation[] } | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const obj = JSON.parse(cleaned);
    if (typeof obj.reply !== "string") return null;
    const recommendations: Recommendation[] = Array.isArray(obj.recommendations)
      ? obj.recommendations
          .filter((r: unknown): r is { slug: unknown; section?: unknown } => typeof r === "object" && r !== null && "slug" in r)
          .filter((r: { slug: unknown }) => typeof r.slug === "string" && VALID_SLUGS.has(r.slug))
          .map((r: { slug: string; section?: unknown }) => ({
            slug: r.slug,
            section: typeof r.section === "string" && VALID_SECTION_SET.has(r.section) ? r.section : undefined,
          }))
      : [];
    return { reply: obj.reply, recommendations };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let message: unknown;
  let history: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const body = await req.json();
    message = body?.message;
    // Conversation history: array of prior {role, content} pairs so the AI remembers context
    if (Array.isArray(body?.history)) {
      history = body.history
        .filter((h: unknown): h is { role: string; content: string } =>
          typeof h === "object" && h !== null && "role" in h && "content" in h
        )
        .slice(-20) // cap at 20 prior turns to keep prompt size sane
        .map((h: { role: string; content: string }) => ({ role: h.role === "user" ? "user" as const : "assistant" as const, content: String(h.content) }));
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "message too long" }, { status: 400 });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: buildCityContext(message) },
    { role: "system", content: await buildListingsContext() },
    // Inject conversation history so the AI remembers what was already discussed
    ...history,
    { role: "user", content: message },
  ];

  // Auto-switching fallback chain: OpenRouter (Qwen) -> Qwen direct -> OpenRouter (alternate model).
  // Each entry is tried in order; the first one that returns a parseable response wins.
  const providers: { name: string; call: () => Promise<string | undefined> }[] = [
    { name: "openrouter:qwen-2.5-72b", call: () => callOpenRouter("qwen/qwen-2.5-72b-instruct", messages) },
    { name: "qwen-direct:qwen-plus", call: () => callQwenDirect(messages) },
    { name: "openrouter:gpt-4o-mini", call: () => callOpenRouter("openai/gpt-4o-mini", messages) },
  ];

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const raw = await provider.call();
      if (!raw) {
        errors.push(`${provider.name}: empty response`);
        continue;
      }
      const parsed = parseAssistantJson(raw);
      if (parsed) {
        return NextResponse.json({ ...parsed, provider: provider.name });
      }
      errors.push(`${provider.name}: unparseable response`);
    } catch (e) {
      errors.push(`${provider.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.error("All assistant providers failed:", errors.join(" | "));
  return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 502 });
}
