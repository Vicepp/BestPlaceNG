import { NextRequest, NextResponse } from "next/server";
import { cities, searchCities, type CityData } from "@/data/cities";
import { getApartmentsLive } from "@/data/apartments";
import { getDirectoryListingsLive } from "@/data/directoryListings";
import { citySections } from "@/data/citySections";
import { getInfraConfig } from "@/data/infrastructure";
import { getAllReviewsLive } from "@/data/reviews";
import { getFirestoreCollection } from "@/lib/firestoreData";
import type { ResearchSnapshot } from "@/data/cityResearch";
import jobsConfig from "@/data/jobs-config.json";
import stateInsights from "@/data/state-insights.json";

export const runtime = "nodejs";

const VALID_SLUGS = new Set(cities.map((c) => c.slug));
const VALID_SECTIONS = citySections.map((s) => s.slug);
const VALID_SECTION_SET = new Set(VALID_SECTIONS);

function cityLabel(c: CityData | undefined, fallbackSlug: string) {
  return c ? `${c.name}, ${c.stateName}` : fallbackSlug;
}

const SYSTEM_PROMPT = `You are the BestPlaceNG assistant, built into a website that helps people find the best place to live in Nigeria, browse real apartment/property listings, and find jobs, schools, hospitals, pharmacies, hotels, events, markets, shopping malls and police stations by city.

Before answering, think carefully about what the user actually needs and reason about tradeoffs honestly (e.g. a cheap city might also be less safe). Do not just pattern-match keywords.

MOST IMPORTANT: Actually ANSWER the user's question directly using the specific numbers in the data below. If they ask "what is the highest paying job in Uyo", state the actual sector and salary. If they ask "cost of living in Ibadan", give the actual index and what it means. Do NOT reply with a vague "here is a place worth a look" — that is a failure. Lead with the concrete answer, then point them to the relevant city section. Use Nigerian context and plain language (naira, "annual rent", etc.), never American framing.

Hard rules:
- Only use the data provided to you below (city stats, jobs/economy figures, state voting & religion data, INFRASTRUCTURE data, AND the listings inventory). Never invent a city, statistic, listing, or fact not present in that data.
- For jobs/salary questions, use the JOBS & ECONOMY data. For voting/politics, use the STATE VOTING data. For religion, use the STATE RELIGION data. City-level stats for smaller towns fall back to their state's reference city — say so when you do.
- INFRASTRUCTURE data covers: electricity/power supply (each state's DisCo, average daily grid hours per city, NERC tariff bands, generator dependence) — use it for "light"/NEPA/power questions and recommend the "electricity" section; internet (broadband % per state, speeds, data cost, providers incl. Starlink) → "internet" section; commute times (one-way minutes per city vs national average, transport mode shares) → "commute-time"; transport fares & fuel prices (danfo/BRT/keke/okada/rail fares, petrol/diesel ₦/litre, intercity road/rail/air) → "transportation"; road condition (regional 0-100 scores, network stats, flagship projects) → "road-condition"; macro-economy (GDP, growth, inflation trend, VAT, income tax, minimum wage, key industries per state) → "economy"; literacy per state, WAEC trend & tertiary counts → "education-stats"; demographics (median age, household size, languages per region, urban share) → "people-stats". Cities without a city-specific figure use their tier default or state/region figure — say it's an estimate when you use one.
- RESEARCH UPDATES are dated, sourced, on-the-ground snapshots researched for specific cities/states (rent in named areas, actual power hours, security trend, prices). When one exists for a city the user asks about, PREFER its specifics over the generalised estimates, cite the "as of" date, and note things may have changed since. Older cities' figures without an update use the standard estimates.
- RESIDENT REVIEWS are real opinions users posted on this site's city pages. Use them to answer "what do people say about X" and to add lived-experience colour next to the statistics ("one reviewer says…", "residents rate its cost of living 4.2/5"). They are subjective opinions, not verified facts — never present a review claim as a statistic, and if reviews conflict with the data, present both. Quote at most a short phrase, attribute it to "a reviewer", and mention the topic it was posted under. If a city has no reviews yet, say so and invite the user to read/leave one on the city page (the review box is at the bottom of every section).
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

function buildInsightsContext(): string {
  const jc = jobsConfig;
  const sectorLines = Object.entries(jc.sectorSalariesMonthly)
    .sort((a, b) => b[1] - a[1])
    .map(([name, val]) => `${name}: ₦${val.toLocaleString()}/mo (national avg)`)
    .join("; ");

  const si = stateInsights as Record<string, { elections?: { year: number; party: string; wide: boolean }[]; religion?: { christian: number; muslim: number; other: number } }>;
  const stateLines = Object.entries(si)
    .filter(([k]) => k !== "_source")
    .map(([slug, d]) => {
      const votes = d.elections?.map((e) => `${e.year}:${e.party}`).join(",") ?? "n/a";
      const rel = d.religion ? `${d.religion.christian}%C/${d.religion.muslim}%M/${d.religion.other}%other` : "n/a";
      return `${slug} | presidential winners ${votes} | religion ${rel}`;
    })
    .join("\n");

  return `JOBS & ECONOMY (national, ${jc.asOf}): unemployment ${jc.national.unemploymentRate}%, youth unemployment ${jc.national.youthUnemploymentRate}%, minimum wage ₦${jc.national.minimumWageMonthly.toLocaleString()}/mo, median income ₦${jc.national.medianMonthlyIncome.toLocaleString()}/mo. Sector monthly salaries (scale up ~10-20% for high-cost cities like Lagos/Abuja, down for cheaper ones): ${sectorLines}.

STATE VOTING (presidential winners per election) & RELIGION (by state slug — a city inherits its state's figures):
${stateLines}`;
}

/** Compact summary of the infrastructure config (economy, education, people,
 * commute, internet, electricity, transport, roads) for the AI. Reads the LIVE
 * Firestore config with static fallback — so edits made in the database are
 * reflected in the assistant's answers within the cache TTL. */
async function buildInfrastructureContext(): Promise<string> {
  const c = await getInfraConfig();
  const inflLatest = c.economy.inflationTrend[c.economy.inflationTrend.length - 1];
  const stateInd = Object.entries(c.economy.stateKeyIndustries).map(([s, inds]) => `${s}: ${inds.join(", ")}`).join(" | ");
  const literacy = Object.entries(c.education.stateLiteracy).map(([s, v]) => `${s}:${v}%`).join(" ");
  const regionProfiles = Object.entries(c.people.regionProfiles).map(([r, p]) => `${r}: household ${p.householdSize}, languages ${p.languages.join("/")}`).join(" | ");
  const commuteCities = Object.entries(c.commute.cityOneWayMinutes).map(([s, m]) => `${s}:${m}min`).join(" ");
  const modes = c.commute.modes.map((m) => `${m.name} ${m.sharePercent}%`).join(", ");
  const stateBb = Object.entries(c.internet.stateBroadbandPercent).map(([s, v]) => `${s}:${v}%`).join(" ");
  const regionBb = Object.entries(c.internet.regionBroadbandPercent).map(([r, v]) => `${r}:${v}%`).join(", ");
  const providers = c.internet.providers.map((p) => p.name).join(", ");
  const bands = c.electricity.bands.map((b) => `Band ${b.band}=${b.hoursPerDay}@₦${b.tariffPerKWh}/kWh`).join(", ");
  const discos = Object.entries(c.electricity.discoByState).map(([s, d]) => `${s}:${d}`).join(" | ");
  const gridHours = Object.entries(c.electricity.cityAvgGridHours).map(([s, h]) => `${s}:${h}h`).join(" ");
  const cityFares = c.transportation.modes.map((m) => `${m.name}: ${m.typicalFare}`).join(" | ");
  const intercity = c.transportation.intercity.map((m) => `${m.name}: ${m.typicalFare}`).join(" | ");
  const roadRegions = Object.entries(c.roads.regionCondition).map(([r, rc]) => `${r}:${rc.score}/100`).join(", ");

  return `INFRASTRUCTURE & CIVIC DATA (asOf ${c.asOf}; city figures are estimates where noted; states use their slug):

ECONOMY (national): GDP ₦${c.economy.gdpTrillionNaira}trn (2024 rebased), growth ${c.economy.gdpGrowthPercent}% (${c.economy.gdpGrowthYear}), inflation ${inflLatest?.rate}% (${inflLatest?.year} avg; trend ${c.economy.inflationTrend.map((t) => `${t.year}:${t.rate}%`).join(" ")}), VAT ${c.economy.vatPercent}%, ${c.economy.incomeTaxNote} Key industries by state — ${stateInd}. Other states: use their region — ${Object.entries(c.economy.regionKeyIndustries).map(([r, i]) => `${r}: ${i.join(", ")}`).join(" | ")}.

EDUCATION STATS: national adult literacy ${c.education.nationalLiteracyPercent}%. Per-state literacy: ${literacy}. Tertiary (national): ${c.education.universities} universities, ${c.education.polytechnics} polytechnics, ${c.education.collegesOfEducation} colleges of education. ~${c.education.outOfSchoolChildrenMillions}M children out of school.

PEOPLE: median age ${c.people.medianAgeYears}yrs, life expectancy ${c.people.lifeExpectancyYears}yrs, avg household ${c.people.avgHouseholdSize}, urban share ${c.people.urbanSharePercent}%, fertility ${c.people.fertilityRate}. By region — ${regionProfiles}.

COMMUTE (one-way): national urban avg ${c.commute.nationalAvgOneWayMinutes}min. City-specific: ${commuteCities}. Other cities: ~${c.commute.tierDefaultMinutes.major}min (major) / ~${c.commute.tierDefaultMinutes.lga}min (small town), estimates. Mode shares: ${modes}.

INTERNET: ${c.internet.internetSubscriptionsMillions}M subscriptions, national broadband ${c.internet.broadbandPenetrationPercent}%, avg mobile ${c.internet.avgMobileDownloadMbps}Mbps, ~₦${c.internet.typicalDataCostPerGBNaira}/GB. State broadband: ${stateBb}. Regional fallback: ${regionBb}. Providers: ${providers}.

ELECTRICITY: grid ${c.electricity.gridInstalledMW}MW installed but ~${c.electricity.gridTypicalDeliveredMW}MW delivered; ~${c.electricity.generatorHouseholdsPercent}% of homes use generator backup. Tariff bands: ${bands}. DisCo per state: ${discos}. Avg daily grid hours per city (estimates): ${gridHours}; other cities ~${c.electricity.tierDefaultGridHours.major}h (major) / ~${c.electricity.tierDefaultGridHours.lga}h (small town).

TRANSPORT: petrol ~₦${c.transportation.petrolPerLitreNaira}/L, diesel ~₦${c.transportation.dieselPerLitreNaira}/L. In-city fares: ${cityFares}. Intercity: ${intercity}. City notes: ${Object.entries(c.transportation.cityHighlights).map(([s, h]) => `${s}: ${h}`).join(" | ")}.

ROADS: network ${c.roads.totalNetworkKm.toLocaleString()}km (~${c.roads.pavedSharePercent}% paved), federal ${c.roads.federalNetworkKm.toLocaleString()}km (~${c.roads.federalNeedingRehabPercent}% needing rehab). Regional condition scores: ${roadRegions}. Flagship projects: ${c.roads.flagshipProjects.join("; ")}.`;
}

/** What residents actually say: every on-site review, grouped per city with
 * avg rating and the most-helpful recent comments (truncated). Capped hard so
 * a growing review base can't blow up the prompt. */
async function buildReviewsContext(): Promise<string> {
  const all = await getAllReviewsLive();
  if (all.length === 0) {
    return "RESIDENT REVIEWS: none posted yet anywhere on the site.";
  }

  const byCity = new Map<string, typeof all>();
  for (const r of all) {
    if (!byCity.has(r.citySlug)) byCity.set(r.citySlug, []);
    byCity.get(r.citySlug)!.push(r);
  }

  const MAX_COMMENTS_PER_CITY = 5;
  const MAX_TOTAL_COMMENTS = 120;
  let used = 0;

  // Cities with the most reviews first — the richest signal gets kept if we hit the cap.
  const cityBlocks = [...byCity.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([slug, revs]) => {
      const city = cities.find((c) => c.slug === slug);
      const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
      const picked = [...revs]
        .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0) || new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, MAX_COMMENTS_PER_CITY)
        .filter(() => used++ < MAX_TOTAL_COMMENTS);
      const lines = picked
        .map((r) => `  - [${r.section}] ${r.rating}/5${(r.likes ?? 0) > 0 ? ` (${r.likes} found helpful)` : ""}: "${r.comment.length > 160 ? r.comment.slice(0, 157) + "…" : r.comment}"`)
        .join("\n");
      return `${slug} (${cityLabel(city, slug)}) | ${revs.length} review${revs.length === 1 ? "" : "s"}, avg ${avg.toFixed(1)}/5:\n${lines}`;
    });

  return `RESIDENT REVIEWS (real user reviews posted on this site's city pages; [section] = the topic it was posted under; subjective opinions, ${all.length} total):\n${cityBlocks.join("\n")}`;
}

/** Latest researched snapshot per city/state (append-only history in Firestore;
 * only the newest per slug is sent to the model, capped for prompt safety). */
async function buildResearchContext(): Promise<string> {
  const [cityDocs, stateDocs] = await Promise.all([
    getFirestoreCollection<ResearchSnapshot>("cityResearch"),
    getFirestoreCollection<ResearchSnapshot>("stateResearch"),
  ]);
  const all = [...(cityDocs ?? []), ...(stateDocs ?? [])];
  if (all.length === 0) return "RESEARCH UPDATES: none yet.";

  // newest per slug
  const latest = new Map<string, ResearchSnapshot>();
  for (const s of all) {
    const prev = latest.get(s.slug);
    if (!prev || (s.createdAt ?? "") > (prev.createdAt ?? "")) latest.set(s.slug, s);
  }
  const lines = [...latest.values()]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 60)
    .map((s) => {
      const hl = (s.highlights ?? []).slice(0, 5).join("; ");
      return `${s.slug} (${s.kind}, as of ${s.asOf}): ${s.headline}${hl ? ` — ${hl}` : ""}`;
    });
  return `RESEARCH UPDATES (dated, sourced on-the-ground snapshots — prefer these specifics over generalised estimates for the places they cover):\n${lines.join("\n")}`;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Recommendation {
  slug: string;
  section?: string;
}

/** Google Gemini (Generative Language API). Converts our OpenAI-style messages
 * into Gemini's format: all system messages become systemInstruction, and the
 * user/assistant turns (including the conversation history) become contents,
 * so the model actually remembers the chat. */
async function callGemini(model: string, apiKey: string, messages: ChatMessage[]): Promise<string | undefined> {
  const systemText = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 800, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!res.ok) throw new Error(`Gemini (${model}) HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") || undefined;
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

  const [listingsCtx, infraCtx, reviewsCtx, researchCtx] = await Promise.all([
    buildListingsContext(),
    buildInfrastructureContext(),
    buildReviewsContext(),
    buildResearchContext(),
  ]);
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: buildCityContext(message) },
    { role: "system", content: buildInsightsContext() },
    { role: "system", content: infraCtx },
    { role: "system", content: researchCtx },
    { role: "system", content: reviewsCtx },
    { role: "system", content: listingsCtx },
    // Inject conversation history so the AI remembers what was already discussed
    ...history,
    { role: "user", content: message },
  ];

  // Gemini is primary (rotated across all provided keys), then OpenRouter/Qwen
  // as automatic fallbacks. First provider to return a parseable answer wins.
  const geminiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((k): k is string => Boolean(k));

  const providers: { name: string; call: () => Promise<string | undefined> }[] = [
    ...geminiKeys.flatMap((key, i) => [
      { name: `gemini-2.5-flash#${i + 1}`, call: () => callGemini("gemini-2.5-flash", key, messages) },
      { name: `gemini-2.0-flash#${i + 1}`, call: () => callGemini("gemini-2.0-flash", key, messages) },
    ]),
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
