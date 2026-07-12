/**
 * Seeds the Learn blog with 20 original, SEO-structured launch posts, written
 * from BestPlaceNG's own dataset (cost indexes, researched rents, power hours,
 * safety). Re-runnable: overwrites the same slugs (posts are editorial content,
 * not user data). Run: npx tsx scripts/seed-blog.ts
 */
process.loadEnvFile?.(".env.local");
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { cities } from "../src/data/cities";
import researchedRent from "../src/data/researched-rent.json";
import infra from "../src/data/infrastructure-config.json";

function norm(r?: string) { if (!r) return r; let k = r.trim(); if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1); return k.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n"); }
function key() { const b = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64; if (b?.trim()) return norm(Buffer.from(b.trim(), "base64").toString("utf8")); return norm(process.env.FIREBASE_ADMIN_PRIVATE_KEY); }
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: key() }) });
const db = getFirestore(app);

const rent = researchedRent as Record<string, { selfContain: number; oneBedroom: number; twoBedroom: number; threeBedroom: number; asOf: string }>;
const gridHours = (infra as any).electricity.cityAvgGridHours as Record<string, number>;
const majors = cities.filter((c) => c.tier === "major");
const naira = (n: number) => `₦${n.toLocaleString()}`;
const img = (slug: string) => `https://picsum.photos/seed/bpng-${slug}/1200/675`;
const DATA_DESK = { name: "BestPlaceNG Data Desk", role: "Research Team" };
const GUIDES = { name: "Relocation Desk", role: "City Guides Editor" };

const city = (slug: string) => majors.find((c) => c.slug === slug)!;
const r2 = (slug: string) => rent[slug]?.twoBedroom;

/* Data-driven lists */
const cheapestSafe = majors.filter((c) => (c.safetyIndex ?? 0) >= 75).sort((a, b) => a.costOfLivingIndex! - b.costOfLivingIndex!).slice(0, 10);
const safest = [...majors].sort((a, b) => b.safetyIndex! - a.safetyIndex!).slice(0, 10);
const bestSchools = [...majors].sort((a, b) => b.schoolRating! - a.schoolRating!).slice(0, 8);
const bestPower = majors.filter((c) => gridHours[c.slug] !== undefined).sort((a, b) => gridHours[b.slug] - gridHours[a.slug]).slice(0, 8);

const lagos = city("lagos-lagos"), abuja = city("abuja-fct"), ibadan = city("ibadan-oyo"), ph = city("port-harcourt-rivers"), enugu = city("enugu-enugu"), kano = city("kano-kano"), calabar = city("calabar-cross-river");

interface Spec { slug: string; title: string; excerpt: string; category: string; kind: string; tags: string[]; date: string; metaDescription: string; sections: { h2: string; body: string; bullets?: string[] }[]; takeaways: string[]; ctaMid: { label: string; href: string }; ctaEnd: { label: string; href: string }; featured?: boolean; author?: { name: string; role: string }; references?: { label: string; url: string }[] }

const cityRow = (c: (typeof majors)[number]) => `${c.name}, ${c.stateName} — cost index ${c.costOfLivingIndex} (100 = national avg), safety ${c.safetyIndex}/100${r2(c.slug) ? `, 2-bed ~${naira(r2(c.slug)!)}/yr` : ""}`;

const POSTS: Spec[] = [
  {
    slug: "cost-of-living-in-lagos-2026", title: "Cost of Living in Lagos (2026): The Real Numbers", featured: true,
    excerpt: `Lagos runs a cost-of-living index of ${lagos.costOfLivingIndex} against a national average of 100 — the most expensive major city in Nigeria. Here's what that actually means for your rent, food and daily budget in 2026.`,
    category: "Cost of Living", kind: "standalone", tags: ["lagos", "cost of living", "rent"], date: "2026-07-10",
    metaDescription: `Cost of living in Lagos 2026: real rent prices (2-bed ~${naira(r2("lagos-lagos") ?? 4500000)}/yr), daily costs, and how Lagos compares to the Nigerian average.`,
    sections: [
      { h2: "How expensive is Lagos, really?", body: `Our index puts Lagos at ${lagos.costOfLivingIndex} — about ${lagos.costOfLivingIndex! - 100}% above the national average, and comfortably ahead of Abuja (${abuja.costOfLivingIndex}). Housing is the main driver: the same money that rents a full flat in Ibadan gets you a self-contain in many Lagos neighbourhoods.` },
      { h2: "Rent: the biggest line item", body: `Researched Lagos rents (as of ${rent["lagos-lagos"]?.asOf ?? "2025"}) — remember Nigerian rent is paid annually upfront, usually with 10–20% extra in agency and caution fees the first year:`, bullets: [`Self-contain: ~${naira(rent["lagos-lagos"]?.selfContain ?? 900000)}/yr`, `1-bedroom: ~${naira(rent["lagos-lagos"]?.oneBedroom ?? 1800000)}/yr`, `2-bedroom: ~${naira(rent["lagos-lagos"]?.twoBedroom ?? 4500000)}/yr`, `3-bedroom: ~${naira(rent["lagos-lagos"]?.threeBedroom ?? 7000000)}/yr`] },
      { h2: "Power, transport and daily life", body: `Grid power averages ~${gridHours["lagos-lagos"] ?? 13} hours a day (better on Band A feeders in the GRAs), so budget for backup. Commutes average about 85 minutes one-way — the longest in the country — which is why the neighbourhood you pick matters more than the house.` },
      { h2: "Where your money goes further", body: `Ikorodu and the mainland fringes price well below Lekki/VI while staying inside the metro. If your work is remote or Island-free, the discount is substantial — check each area's listings before assuming Lagos is uniformly expensive.` },
    ],
    takeaways: [`Lagos cost index: ${lagos.costOfLivingIndex} vs 100 national average`, "Rent is annual + first-year extras of 10–20%", "Location inside Lagos changes costs more than any other single choice"],
    ctaMid: { label: "See Lagos cost-of-living data", href: "/city/lagos-lagos/cost-of-living" }, ctaEnd: { label: "Browse Lagos apartments", href: "/city/lagos-lagos/apartments" },
  },
  {
    slug: "lagos-vs-abuja-where-to-live-2026", title: "Lagos vs Abuja: Where Should You Live in 2026?", featured: true,
    excerpt: "Nigeria's two giants pull in different directions: Lagos pays more and costs more; Abuja is calmer, safer and better-powered. The data makes the trade-off unusually clear.",
    category: "Comparisons", kind: "comparison", tags: ["lagos", "abuja", "comparison"], date: "2026-07-08",
    metaDescription: "Lagos vs Abuja 2026 compared on cost of living, safety, power supply, commute and rent — with real data to decide where you should live.",
    sections: [
      { h2: "The headline numbers", body: "Side by side from our dataset:", bullets: [cityRow(lagos), cityRow(abuja), `Power: Lagos ~${gridHours["lagos-lagos"]}h/day vs Abuja ~${gridHours["abuja-fct"]}h/day`, `Commute: Lagos ~85 min vs Abuja ~45 min one-way`] },
      { h2: "Choose Lagos if…", body: "Your industry lives there. Tech, finance, media, ports and entertainment concentrate salaries and opportunities Lagos-side, and no other Nigerian city matches its market depth. You trade commute time and higher rent for career surface area." },
      { h2: "Choose Abuja if…", body: `You value order and hours in your day. Abuja scores ${abuja.safetyIndex}/100 on safety to Lagos's ${lagos.safetyIndex}, gets ~${gridHours["abuja-fct"]} hours of grid power, and its planned roads keep commutes humane. Government, NGOs, and remote workers do particularly well here.` },
      { h2: "The verdict", body: "There isn't a universal winner — there's a fit. High-growth career phase: Lagos. Family stability, remote work, or public sector: Abuja usually wins on quality-of-life per naira." },
    ],
    takeaways: ["Lagos = opportunity density; Abuja = liveability", `Abuja is safer (${abuja.safetyIndex} vs ${lagos.safetyIndex}) with nearly half the commute`, "Both cost well above the national average — budget accordingly"],
    ctaMid: { label: "Compare Lagos and Abuja side-by-side", href: "/compare" }, ctaEnd: { label: "Explore both city profiles", href: "/city/abuja-fct" },
  },
  {
    slug: "cheapest-safe-cities-nigeria", title: `10 Cheapest Nigerian Cities That Are Still Safe (2026)`, featured: true,
    excerpt: "Cheap means nothing if you can't sleep at night. We filtered all our major cities for a safety score of 75+ and ranked them by cost of living — these ten deliver both.",
    category: "Rankings", kind: "listicle", tags: ["cheap cities", "safety", "rankings"], date: "2026-07-05",
    metaDescription: "The 10 cheapest Nigerian cities with a safety index of 75+ in 2026, ranked by cost-of-living data — with rent figures where researched.",
    sections: [
      { h2: "How we ranked them", body: "We took every major city in our dataset, kept only those scoring 75+ on our safety index (100 = national average, higher is safer), then sorted by cost-of-living index. No sponsorships, no vibes — just the data." },
      { h2: "The list", body: "From cheapest up:", bullets: cheapestSafe.map((c, i) => `${i + 1}. ${cityRow(c)}`) },
      { h2: "What the winners have in common", body: "Most are administrative capitals without an oil or megacity premium: steady civil-service economies, land to expand into, and universities that keep services cheap. The trade-off is usually a thinner formal job market — ideal for remote workers, families and anyone whose income doesn't depend on the city." },
    ],
    takeaways: [`${cheapestSafe[0]?.name} tops the value list at index ${cheapestSafe[0]?.costOfLivingIndex}`, "Safety 75+ and low cost coexist mostly in mid-size capitals", "Verify the specific neighbourhood — city averages hide variation"],
    ctaMid: { label: "See the full city rankings", href: "/rankings" }, ctaEnd: { label: "Compare any two cities", href: "/compare" },
  },
  {
    slug: "ibadan-rent-guide-2026", title: "Ibadan Rent Guide 2026: Prices by Bedroom & Area",
    excerpt: `Ibadan remains the best big-city rent deal in Nigeria: 2-beds around ${naira(r2("ibadan-oyo") ?? 1000000)}/yr while the Circular Road reshapes where the city grows.`,
    category: "City Guides", kind: "standalone", tags: ["ibadan", "rent", "guide"], date: "2026-07-03",
    metaDescription: `Ibadan rent prices 2026: self-contain to 3-bedroom costs, cheap vs premium areas, and what the Circular Road means for future prices.`,
    sections: [
      { h2: "Current rent levels", body: `Researched Ibadan rents (as of ${rent["ibadan-oyo"]?.asOf ?? "2025"}):`, bullets: [`Self-contain: ~${naira(rent["ibadan-oyo"]?.selfContain ?? 300000)}/yr`, `1-bedroom: ~${naira(rent["ibadan-oyo"]?.oneBedroom ?? 600000)}/yr`, `2-bedroom: ~${naira(rent["ibadan-oyo"]?.twoBedroom ?? 1000000)}/yr`, `3-bedroom: ~${naira(rent["ibadan-oyo"]?.threeBedroom ?? 1400000)}/yr`] },
      { h2: "Where prices differ", body: "Bodija, Kolapo Ishola GRA and the Akobo axis carry the premium stock — newer estates list 3-beds at ₦3.5m+. Older mainland areas rent far below the averages above; supply is healthy with hundreds of live listings at any time." },
      { h2: "The Circular Road effect", body: "The 110km Circular Road and the Moniya dry-port/rail hub are pulling development outward — land along the corridor is repricing fast. If you're buying or signing long, that's where appreciation is concentrating." },
      { h2: "Ibadan vs its neighbours", body: `At a cost index of ${ibadan.costOfLivingIndex} with safety at ${ibadan.safetyIndex}/100 and ~${gridHours["ibadan-oyo"]}h of daily grid power, Ibadan beats Lagos on every liveability metric except salary depth — a 40-minute average commute seals it.` },
    ],
    takeaways: ["Ibadan 2-beds still rent near ₦1m/yr", "Premium areas (Akobo/GRAs) run 2-3× the city average", "Watch the Circular Road corridor for the next growth areas"],
    ctaMid: { label: "See Ibadan's full cost data", href: "/city/ibadan-oyo/cost-of-living" }, ctaEnd: { label: "Browse Ibadan apartments", href: "/city/ibadan-oyo/apartments" },
  },
  {
    slug: "how-rent-works-in-nigeria", title: "How Rent Works in Nigeria: Annual Rent, Agency & Caution Fees",
    excerpt: "New to renting in Nigeria — or explaining it to someone abroad? Here's the full picture: why rent is yearly, what the extra fees are, and how to protect your money.",
    category: "Renting 101", kind: "discussion", tags: ["renting", "fees", "guide"], date: "2026-06-30",
    metaDescription: "How renting works in Nigeria: annual upfront rent, agency and caution fees explained, plus how escrow protects tenants from payment scams.",
    sections: [
      { h2: "Why rent is paid yearly", body: "Nigerian landlords overwhelmingly collect 12 months upfront (sometimes two years for new builds). It's a financing culture: landlords use rent as capital, and monthly collection is seen as a default risk. Lagos has legislated toward monthly options, but annual remains the market reality." },
      { h2: "The first-year extras", body: "Budget beyond the headline rent:", bullets: ["Agency fee: typically 10% of annual rent", "Legal/agreement fee: ~5–10%", "Caution deposit: refundable in theory — get its condition documented", "Service charge: separate in estates and serviced blocks"] },
      { h2: "Where tenants get burned", body: "The classic scams: paying for an apartment the 'agent' doesn't control, duplicate letting (two tenants paying for one flat), and vanishing caution deposits. All share one feature — money moved before keys did." },
      { h2: "How escrow fixes the order of operations", body: "On BestPlaceNG, rent you pay is held in escrow and only released to the landlord after you confirm you've moved in. If the keys never come, the money never leaves. That single re-ordering removes the most common fraud in the market." },
    ],
    takeaways: ["Plan for rent + 20–30% in first-year fees", "Never move money before verifying control of the property", "Escrow reverses the risk: keys first, then payment release"],
    ctaMid: { label: "See how paying works here", href: "/dashboard/support" }, ctaEnd: { label: "Find a verified listing", href: "/apartments" },
  },
  {
    slug: "bestplaceng-vs-propertypro", title: "BestPlaceNG vs PropertyPro: What's Actually Different?",
    excerpt: "PropertyPro is one of Nigeria's biggest listing marketplaces. We're something else. An honest breakdown of where each tool wins — and when you'd use both.",
    category: "Comparisons", kind: "vs-competitor", tags: ["comparison", "propertypro"], date: "2026-06-27",
    metaDescription: "BestPlaceNG vs PropertyPro compared: listings marketplace vs city-data + escrow renting platform. What each does best in 2026.",
    sections: [
      { h2: "What PropertyPro does well", body: "Volume. As a classifieds marketplace it aggregates enormous inventory across agents and developers, which makes it a strong starting point for scanning what exists in an area — especially for sales and premium stock." },
      { h2: "Where BestPlaceNG is different", body: "We answer the question that comes before the listing: where should you live? Then we change how the deal happens:", bullets: ["City data first: cost of living, safety, daily power hours, commutes and researched rents for 753 cities", "Direct landlord contact — no agent layer inside the platform", "Rent held in escrow until you confirm move-in", "Tours scheduled on the landlord's real availability", "Resident reviews on every city section"] },
      { h2: "The honest trade-off", body: "A young platform can't match a decade-old marketplace on raw listing count. What we guarantee instead is that the flow from discovery to payment is protected end-to-end — the part where listings sites hand you off to whoever posted the ad." },
      { h2: "Use both, in order", body: "Research the city here, shortlist areas with our data, then compare inventory anywhere you like — and when you're ready to actually pay someone, do it where the money is protected." },
    ],
    takeaways: ["Marketplaces optimise for inventory; we optimise for decisions + safe transactions", "Escrow + no-agent messaging is the structural difference", "The platforms are complementary — the payment step is where protection matters"],
    ctaMid: { label: "Explore a city profile", href: "/city/lagos-lagos" }, ctaEnd: { label: "Browse protected listings", href: "/apartments" },
  },
  {
    slug: "bestplaceng-vs-jiji-apartments", title: "Finding an Apartment: BestPlaceNG vs Jiji",
    excerpt: "Jiji is Nigeria's everything-marketplace, and plenty of rentals live there. Here's a clear-eyed look at using a general classifieds site vs a purpose-built renting platform.",
    category: "Comparisons", kind: "vs-competitor", tags: ["comparison", "jiji"], date: "2026-06-24",
    metaDescription: "BestPlaceNG vs Jiji for finding apartments in Nigeria: verification, scam risk, escrow payments and city data compared honestly.",
    sections: [
      { h2: "Jiji's strength: reach", body: "Everything is on Jiji, including apartments — often posted fast and priced keenly. For raw discovery in a hurry, general classifieds are hard to beat." },
      { h2: "The structural weakness of classifieds for rent", body: "Classifieds end at the ad. Identity, property control, payment and follow-through all happen off-platform — precisely the zone where Nigerian rental fraud operates. 'Pay a small commitment fee to view' is a classifieds-era scam that still works because nothing in the flow prevents it." },
      { h2: "What a purpose-built flow changes", body: "On BestPlaceNG the listing connects to a landlord account, chat history is kept, tours are scheduled in-app, and rent sits in escrow until you've moved in. There is no step where a stranger asks you to transfer money on faith." },
      { h2: "Bottom line", body: "Use classifieds to see the market; close the deal where the process itself protects you. If a Jiji landlord is legitimate, they lose nothing by listing here — that's a useful filter in itself." },
    ],
    takeaways: ["Classifieds excel at discovery, not transaction safety", "Most rental scams exploit off-platform payment steps", "Escrow-based closing removes the leap of faith"],
    ctaMid: { label: "See how escrow protects you", href: "/dashboard/support" }, ctaEnd: { label: "Search verified rentals", href: "/apartments" },
  },
  {
    slug: "bestplaceng-vs-nigeria-property-centre", title: "BestPlaceNG vs Nigeria Property Centre: Honest Review",
    excerpt: "NPC is a veteran of Nigerian property search with deep agent networks. We compare philosophies: agent-mediated volume vs data-driven direct renting.",
    category: "Comparisons", kind: "vs-competitor", tags: ["comparison", "npc"], date: "2026-06-21",
    metaDescription: "BestPlaceNG vs Nigeria Property Centre in 2026: agent-driven listings vs direct landlord renting with escrow and city liveability data.",
    sections: [
      { h2: "NPC in a sentence", body: "A long-running property portal with strong agent participation, useful price-trend content, and broad coverage across sales and rentals — a solid research stop, particularly for buyers." },
      { h2: "Two different theories of the market", body: "NPC's model routes you to agents; ours removes the layer. Both are legitimate: agents add local legwork; direct renting adds transparency and cuts a 10% fee. The question is who you want between you and the landlord.", bullets: ["Agent model: local knowledge, but fees + information asymmetry", "Direct model: cheaper and transparent, but you do your own legwork — which our city data is built to replace"] },
      { h2: "What only we do", body: `Liveability data at decision time: before you shortlist, you can see that Enugu scores ${enugu.safetyIndex}/100 on safety at a ${enugu.costOfLivingIndex} cost index while PH runs ${ph.costOfLivingIndex} — then talk to the landlord and pay in escrow without leaving the flow.` },
      { h2: "Verdict", body: "Buying property with complex title checks? An agent-heavy portal earns its place. Renting a home with your own money at risk? The escrow-protected direct flow is the safer default." },
    ],
    takeaways: ["NPC = agent-mediated breadth; BestPlaceNG = direct + protected depth", "Agent fees typically add ~10% — know what you're paying for", "For rentals, payment protection beats listing volume"],
    ctaMid: { label: "Compare cities before you choose", href: "/compare" }, ctaEnd: { label: "Start with a city profile", href: "/rankings" },
  },
  {
    slug: "why-we-hold-rent-in-escrow", title: "Why We Hold Rent in Escrow (and Agents Hate It)",
    excerpt: "The most important feature on BestPlaceNG is invisible when everything goes right. Here's exactly what happens to your money between 'Pay' and 'moved in'.",
    category: "Renting 101", kind: "discussion", tags: ["escrow", "payments", "trust"], date: "2026-06-18",
    metaDescription: "How BestPlaceNG's rent escrow works: money held until move-in confirmation, released to the landlord's wallet, disputes handled by admins.",
    sections: [
      { h2: "The problem with 'pay first, hope second'", body: "Traditional renting asks the tenant to take all the risk: a year of rent, upfront, to someone they met last week. Every notorious rental scam — fake agents, double-letting, phantom flats — depends on that sequencing." },
      { h2: "What escrow changes, step by step", body: "The flow on BestPlaceNG:", bullets: ["You sign the landlord's terms and pay in-app via Paystack", "The money is HELD — the landlord sees it, can't touch it", "You move in and tap 'Confirm move-in'", "Only then does rent land in the landlord's wallet for withdrawal", "Problem before move-in? Report it — admins arbitrate with the money still frozen"] },
      { h2: "Why landlords accept it", body: "Serious landlords lose nothing — they were always going to hand over keys. What they gain is a tenant pool that trusts the process, faster closings, and a payment record that settles disputes. The only party escrow hurts is whoever never intended to deliver a home." },
    ],
    takeaways: ["Escrow reverses rental risk: keys before money release", "Both sides get a verified record of every step", "Scams that need blind upfront payment simply can't run here"],
    ctaMid: { label: "Read the full payment FAQ", href: "/dashboard/support" }, ctaEnd: { label: "Rent with protection", href: "/apartments" },
  },
  {
    slug: "best-cities-remote-work-nigeria", title: "Best Nigerian Cities for Remote Workers (Power + Internet)",
    excerpt: "Remote work lives and dies on two utilities. We ranked cities by daily grid hours and connectivity to find where your laptop actually stays on.",
    category: "Rankings", kind: "listicle", tags: ["remote work", "power", "internet"], date: "2026-06-15",
    metaDescription: "Best cities for remote work in Nigeria 2026, ranked by daily grid power hours, broadband strength and cost of living.",
    sections: [
      { h2: "The ranking logic", body: "We sorted our researched cities by average daily grid hours, then sanity-checked cost and safety. Broadband follows power closely — the fibre-rich corridors are also the better-fed feeders." },
      { h2: "Top cities by daily power", body: "Average grid hours per day (household estimates):", bullets: bestPower.map((c, i) => `${i + 1}. ${c.name} — ~${gridHours[c.slug]}h/day, cost index ${c.costOfLivingIndex}, safety ${c.safetyIndex}/100`) },
      { h2: "The remote-work sweet spots", body: `Abuja leads outright (~${gridHours["abuja-fct"]}h). But the value plays are ${bestPower.filter((c) => (c.costOfLivingIndex ?? 200) < 95).slice(0, 3).map((c) => c.name).join(", ")} — near-Abuja reliability at a fraction of the rent. Pair any of them with a 1kVA inverter and dual-SIM data and you're effectively 24/7.` },
      { h2: "Don't skip the street-level check", body: "Band assignment varies feeder by feeder. Before renting, ask which electricity band the street is on and which mobile network is strongest indoors — two questions that matter more than any city average." },
    ],
    takeaways: [`Abuja tops power reliability at ~${gridHours["abuja-fct"]}h/day`, "Mid-size capitals offer 80% of the reliability at half the rent", "Always verify the street's band before signing"],
    ctaMid: { label: "Check any city's electricity data", href: "/city/abuja-fct/electricity" }, ctaEnd: { label: "Find your remote-work base", href: "/rankings" },
  },
  {
    slug: "safest-cities-nigeria-2026", title: "Nigeria's Safest Cities in 2026, Ranked by Data",
    excerpt: "Safety perception drives every relocation shortlist. Here are the ten highest-scoring major cities on our safety index — and the patterns behind them.",
    category: "Rankings", kind: "listicle", tags: ["safety", "rankings"], date: "2026-06-12",
    metaDescription: "The 10 safest major cities in Nigeria in 2026 ranked by safety index, with cost of living context for each.",
    sections: [
      { h2: "The top ten", body: "Safety index, 100 = national average, higher is safer:", bullets: safest.map((c, i) => `${i + 1}. ${c.name}, ${c.stateName} — ${c.safetyIndex}/100 (cost index ${c.costOfLivingIndex})`) },
      { h2: "What safe cities share", body: `${safest[0]?.name} leading is no accident: compact, education-heavy state capitals with stable economies dominate this list. Sprawl, transit hubs and boomtown churn correlate with the lower scores — bigger isn't safer.` },
      { h2: "Reading the number honestly", body: "A city average can't see your street. Use the index to shortlist, then check the city's Crime section for incident notes and read resident reviews before choosing a neighbourhood — especially near forest belts and interstate roads." },
    ],
    takeaways: [`${safest[0]?.name} ranks #1 at ${safest[0]?.safetyIndex}/100`, "Mid-size university capitals dominate the safe list", "City index for shortlisting; street research for deciding"],
    ctaMid: { label: "See crime data for any city", href: "/city/calabar-cross-river/crime" }, ctaEnd: { label: "Full safety rankings", href: "/rankings" },
  },
  {
    slug: "enugu-vs-ibadan-budget-cities", title: "Enugu vs Ibadan: Nigeria's Budget-City Heavyweights",
    excerpt: `Two of the best value big cities in the country — one east, one west. Cost indexes of ${enugu.costOfLivingIndex} and ${ibadan.costOfLivingIndex}, both safe, both livable. So which?`,
    category: "Comparisons", kind: "comparison", tags: ["enugu", "ibadan", "comparison"], date: "2026-06-09",
    metaDescription: `Enugu vs Ibadan compared for 2026: rent, safety, power, schools and lifestyle — which budget-friendly Nigerian city fits you.`,
    sections: [
      { h2: "The numbers, side by side", body: "From the dataset:", bullets: [cityRow(enugu), cityRow(ibadan), `Power: Enugu ~${gridHours["enugu-enugu"]}h vs Ibadan ~${gridHours["ibadan-oyo"]}h daily`, `Schools: Enugu ${enugu.schoolRating}/10 vs Ibadan ${ibadan.schoolRating}/10`] },
      { h2: "The case for Enugu", body: `Safety is the standout — ${enugu.safetyIndex}/100 with a calm, hilly, green character and a rising tech-and-services scene. For families prioritising serenity per naira in the South East, it's the default answer.` },
      { h2: "The case for Ibadan", body: "Scale and proximity. Six times the population means deeper job and rental markets, and Lagos is a train ride away when you need it — big-city access without big-city rent. The Circular Road boom adds upside Enugu can't match." },
      { h2: "The verdict", body: "Enugu for tranquility and safety-first households; Ibadan for opportunity, optionality and anyone tethered to the Lagos economy. You genuinely can't pick wrong on cost — both leave money in your pocket." },
    ],
    takeaways: ["Both cost ~10% below the national average", `Enugu wins safety (${enugu.safetyIndex} vs ${ibadan.safetyIndex}); Ibadan wins market depth`, "Ibadan's rail link to Lagos is the tiebreaker for many"],
    ctaMid: { label: "Compare them side-by-side", href: "/compare" }, ctaEnd: { label: "Explore Enugu's profile", href: "/city/enugu-enugu" },
  },
  {
    slug: "moving-to-lagos-things-nobody-tells-you", title: "Moving to Lagos? 12 Things Nobody Tells You First",
    excerpt: "Beyond the rent shock and the traffic memes, Lagos has unwritten rules that cost newcomers real money and sanity. Learn them before the truck arrives.",
    category: "City Guides", kind: "discussion", tags: ["lagos", "moving", "tips"], date: "2026-06-06",
    metaDescription: "12 practical things to know before moving to Lagos in 2026 — rent traps, commute maths, power bands, area choice and settling in faster.",
    sections: [
      { h2: "Money & housing", body: "The first cluster of surprises:", bullets: ["'Rent' quotes exclude agency, legal and caution — add 20–30% for year one", "Inspect after rain: Lagos drainage decides livability more than finishes do", "Ask the street's electricity band before falling for the kitchen", "Island salaries exist for Island costs — a mainland job with Island rent is a trap"] },
      { h2: "Movement & time", body: "Your address is a time budget:", bullets: ["Measure commutes in rush hour, not Sunday afternoon — a '20-minute' trip can be 90", "Living near your work beats living somewhere 'nice' you never see in daylight", "The BRT and ferries are underrated; okada bans are enforced when least convenient", "Fuel scarcity weeks happen — generators and plans need a buffer"] },
      { h2: "Settling in", body: "The soft skills:", bullets: ["Estate/street WhatsApp groups are the real local news — join immediately", "Pidgin gets you further than formality in markets and parks", "Sunday morning is the secret window for errands and apartment hunting", "Everything is negotiable except NEPA bills and BRT fares"] },
    ],
    takeaways: ["Budget 20–30% above quoted rent for year one", "Choose your address by commute, drainage and power band", "Community networks solve Lagos faster than money does"],
    ctaMid: { label: "Study Lagos data first", href: "/city/lagos-lagos" }, ctaEnd: { label: "Find a Lagos home", href: "/city/lagos-lagos/apartments" },
  },
  {
    slug: "best-cities-families-schools-nigeria", title: "Best Nigerian Cities for Families & Schools (2026)",
    excerpt: "School quality, safety and sane costs rarely align in one city — but they do in a few. Our school-rating data points to the family sweet spots.",
    category: "Rankings", kind: "listicle", tags: ["schools", "family", "rankings"], date: "2026-06-03",
    metaDescription: "Best cities in Nigeria for families in 2026 ranked by school ratings, with safety and cost-of-living context for each city.",
    sections: [
      { h2: "Top school cities", body: "Ranked by our school rating (out of 10):", bullets: bestSchools.map((c, i) => `${i + 1}. ${c.name} — schools ${c.schoolRating}/10, safety ${c.safetyIndex}/100, cost ${c.costOfLivingIndex}`) },
      { h2: "The family formula", body: `${bestSchools[0]?.name} tops the table, and the pattern repeats: cities with strong university ecosystems produce the best primary and secondary options too. Add a 75+ safety score and sub-100 cost index and you get genuine family value — several list entries hit all three.` },
      { h2: "Beyond the ratings", body: "Term-time traffic is the hidden variable: a great school 70 minutes away is a worse choice than a good one at 15. Check the Commute section of any city you shortlist, and visit schools during pickup hour to see the real state of things." },
    ],
    takeaways: [`${bestSchools[0]?.name} leads at ${bestSchools[0]?.schoolRating}/10 for schools`, "University towns consistently over-deliver for families", "Rate the school-run commute, not just the school"],
    ctaMid: { label: "See school data by city", href: "/city/ado-ekiti-ekiti/school-ratings" }, ctaEnd: { label: "Shortlist family cities", href: "/rankings" },
  },
  {
    slug: "understanding-nepa-bands", title: "NEPA Bands Explained: Why Your Light Differs by Street",
    excerpt: "Band A neighbours enjoying 20 hours while you squint through 8? Nigeria's service-based tariff system explains it — and you can use it when apartment hunting.",
    category: "Renting 101", kind: "standalone", tags: ["electricity", "nepa", "bands"], date: "2026-05-31",
    metaDescription: "Nigeria's electricity Band A–E system explained: promised hours, tariffs, and how to check a street's band before renting.",
    sections: [
      { h2: "The five bands", body: "Since the 2024 tariff review, feeders are classed by promised daily supply:", bullets: (infra as any).electricity.bands.map((b: any) => `Band ${b.band}: ${b.hoursPerDay} at ₦${b.tariffPerKWh}/kWh`) },
      { h2: "Why your street is what it is", body: "Bands attach to feeders, not neighbourhoods — one road can split across two bands. GRAs, industrial corridors and commercial districts got Band A first because cost-reflective tariffs are recoverable there; older residential webs lag behind." },
      { h2: "Using bands when renting", body: "Ask the landlord — or better, the neighbours — which band the feeder is on and what the last month's actual hours looked like. A Band A flat at slightly higher rent routinely beats a cheaper Band D one once you price generator fuel honestly." },
    ],
    takeaways: ["Band A promises 20+ hrs but costs ~₦210/kWh", "Bands are feeder-level — verify the street, not the area", "Total cost of power (tariff + backup fuel) is the real comparison"],
    ctaMid: { label: "Check your city's power data", href: "/city/lagos-lagos/electricity" }, ctaEnd: { label: "Find well-powered listings", href: "/apartments" },
  },
  {
    slug: "kano-city-guide-2026", title: "Kano City Guide 2026: Cost, Safety & Business Reality",
    excerpt: `Northern Nigeria's commercial giant runs on trade, not oil. At a cost index of ${kano.costOfLivingIndex}, Kano offers big-city commerce at small-city prices.`,
    category: "City Guides", kind: "standalone", tags: ["kano", "guide"], date: "2026-05-28",
    metaDescription: `Living in Kano 2026: cost of living index ${kano.costOfLivingIndex}, rent levels, safety, power supply and the trading economy explained.`,
    sections: [
      { h2: "The economics", body: `Kano's index of ${kano.costOfLivingIndex} makes it the cheapest of Nigeria's mega-cities. Researched rents run about ${naira(rent["kano-kano"]?.oneBedroom ?? 350000)}/yr for a 1-bed and ${naira(rent["kano-kano"]?.twoBedroom ?? 600000)}/yr for a 2-bed — Lagos money goes four times further here.` },
      { h2: "How the city works", body: `Commerce is the operating system: Kurmi and Kantin Kwari markets anchor distribution for the entire North and the Sahel beyond. Grid power averages ~${gridHours["kano-kano"]}h/day, keke rules the streets, and the ancient-city heritage coexists with serious industrial estates.` },
      { h2: "Who thrives in Kano", body: `Traders, manufacturers, agro-processors and anyone serving northern markets. Safety scores ${kano.safetyIndex}/100 in the metro — standard big-city caution applies, and the city proper has stayed calmer than its geopolitical zone's reputation suggests.` },
    ],
    takeaways: [`Cheapest mega-city: index ${kano.costOfLivingIndex}, 2-beds ~${naira(rent["kano-kano"]?.twoBedroom ?? 600000)}/yr`, "Trade and agro-industry drive opportunity", "Metro safety is steadier than regional headlines imply"],
    ctaMid: { label: "Kano's full data profile", href: "/city/kano-kano" }, ctaEnd: { label: "Browse Kano listings", href: "/city/kano-kano/apartments" },
  },
  {
    slug: "calabar-most-underrated-city", title: "Calabar: Nigeria's Most Underrated City to Live In",
    excerpt: `The data says what residents already know: ${calabar.safetyIndex}/100 safety — the best we track — clean streets, and rents nowhere near what the lifestyle suggests.`,
    category: "City Guides", kind: "standalone", tags: ["calabar", "guide", "hidden gem"], date: "2026-05-25",
    metaDescription: `Why Calabar is Nigeria's most underrated city: highest safety score (${calabar.safetyIndex}/100), tourism lifestyle, and moderate costs.`,
    sections: [
      { h2: "The numbers behind the reputation", body: `${cityRow(calabar)}. Grid power ~${gridHours["calabar-cross-river"]}h/day and a school rating of ${calabar.schoolRating}/10 round out one of the most balanced profiles in our entire dataset.` },
      { h2: "What living there is like", body: "Nigeria's tourism capital does hospitality as a civic habit: walkable districts, the country's most famous carnival, riverine food culture, and an unhurried pace that Lagos refugees describe as therapeutic." },
      { h2: "The honest catches", body: "The formal job market is thin — remote income, hospitality, government or education are the realistic anchors. And the wet season is long and serious; ground-floor flats need the drainage check more than anywhere." },
    ],
    takeaways: [`Highest safety score we track: ${calabar.safetyIndex}/100`, "Ideal for remote workers and lifestyle movers", "Bring your income with you — the local market is small"],
    ctaMid: { label: "See Calabar's full profile", href: "/city/calabar-cross-river" }, ctaEnd: { label: "Find a home in Calabar", href: "/city/calabar-cross-river/apartments" },
  },
  {
    slug: "spot-rental-scams-nigeria", title: "How to Spot Rental Scams in Nigeria: 7 Red Flags",
    excerpt: "Rental fraud follows scripts. Learn the seven tells that expose fake agents and phantom flats before your money moves.",
    category: "Renting 101", kind: "discussion", tags: ["scams", "safety", "renting"], date: "2026-05-22",
    metaDescription: "7 red flags of Nigerian rental scams: viewing fees, pressure tactics, off-platform payments — and how escrow neutralises them.",
    sections: [
      { h2: "The seven red flags", body: "If you see these, walk:", bullets: ["A fee just to view the apartment", "Price dramatically below every comparable in the area", "Pressure: 'three other people are paying today'", "No verifiable link between the 'agent' and the property", "Payment requested to a personal account before any documentation", "Refusal to meet at the actual property", "A story for why the landlord can never appear"] },
      { h2: "Why the scripts work", body: "Each flag weaponises the market's core flaw: tenants pay before they possess. Scarcity is real, so urgency feels plausible — and one 'small' viewing fee across thirty victims a week is a business." },
      { h2: "The structural defence", body: "Process beats vigilance. When tours are booked in-app, chats are logged, and rent sits in escrow until you've moved in, every one of the seven scripts breaks — there's simply no step where blind money changes hands." },
    ],
    takeaways: ["Never pay to view — that alone filters most fraud", "Verify control of the property, not just a convincing person", "Escrowed payment makes the classic scripts impossible"],
    ctaMid: { label: "How our protection works", href: "/dashboard/support" }, ctaEnd: { label: "Search safely", href: "/apartments" },
  },
  {
    slug: "port-harcourt-cost-of-living-2026", title: "Port Harcourt Cost of Living 2026: Oil City Prices",
    excerpt: `PH runs a cost index of ${ph.costOfLivingIndex} — oil money keeps rents high, but the Garden City still undercuts Lagos and Abuja for comparable careers.`,
    category: "Cost of Living", kind: "standalone", tags: ["port harcourt", "cost of living"], date: "2026-05-19",
    metaDescription: `Port Harcourt cost of living 2026: rent by bedroom, the oil-economy premium, power supply and how PH compares to Lagos and Abuja.`,
    sections: [
      { h2: "Where PH sits on the ladder", body: `Index ${ph.costOfLivingIndex}: cheaper than Lagos (${lagos.costOfLivingIndex}) and Abuja (${abuja.costOfLivingIndex}), pricier than everywhere else that matters. The oil-and-gas payroll sets the ceiling — GRA and Peter Odili corridor rents chase expat and contractor budgets.` },
      { h2: "Rent snapshot", body: `Researched levels (as of ${rent["port-harcourt-rivers"]?.asOf ?? "2025"}):`, bullets: [`Self-contain: ~${naira(rent["port-harcourt-rivers"]?.selfContain ?? 500000)}/yr`, `1-bed: ~${naira(rent["port-harcourt-rivers"]?.oneBedroom ?? 900000)}/yr`, `2-bed: ~${naira(rent["port-harcourt-rivers"]?.twoBedroom ?? 1500000)}/yr`, `3-bed: ~${naira(rent["port-harcourt-rivers"]?.threeBedroom ?? 2500000)}/yr`] },
      { h2: "The liveability ledger", body: `Grid power is the weak point at ~${gridHours["port-harcourt-rivers"]}h/day — backup is non-optional. Commutes average ~55 minutes, safety scores ${ph.safetyIndex}/100, and the wet season is the longest of any major city, which your choice of street should respect.` },
    ],
    takeaways: [`PH index ${ph.costOfLivingIndex}: the third-priciest major city`, "Oil corridor areas carry a distinct premium", `Budget for backup power (~${gridHours["port-harcourt-rivers"]}h grid average)`],
    ctaMid: { label: "Full PH cost breakdown", href: "/city/port-harcourt-rivers/cost-of-living" }, ctaEnd: { label: "PH apartments", href: "/city/port-harcourt-rivers/apartments" },
  },
  {
    slug: "annual-vs-monthly-rent-nigeria", title: "Annual vs Monthly Rent in Nigeria: Is Change Coming?",
    excerpt: "Lagos law says tenants can't be forced into multi-year upfront payments — yet yearly rent still rules. What's actually shifting in 2026, and what should renters do meanwhile?",
    category: "Renting 101", kind: "discussion", tags: ["rent", "policy", "monthly rent"], date: "2026-05-16",
    metaDescription: "Annual vs monthly rent in Nigeria 2026: why upfront yearly rent persists, where monthly options exist, and how tenants can adapt.",
    sections: [
      { h2: "Why annual refuses to die", body: "Landlords price default risk and inflation into one upfront payment, banks rarely finance rent, and property managers who'd chase monthly payments barely exist outside premium estates. Culture follows those incentives." },
      { h2: "Where monthly is genuinely happening", body: "Serviced apartments, co-living operators and a slice of corporate lets in Lagos and Abuja offer true monthly plans — typically at a 20–40% annualised premium. Proptech rent-financing (pay monthly, platform pays landlord yearly) fills some of the gap, at interest." },
      { h2: "A renter's playbook for now", body: "Practical moves:", bullets: ["Negotiate the extras, not just the rent — agency and legal fees are movable", "Split payments (two tranches) is a common middle ground landlords accept", "If using rent financing, compare the effective interest to a straight loan", "Protect the big payment: pay where it's escrowed until you move in"] },
    ],
    takeaways: ["Annual rent persists because incentives, not law, sustain it", "True monthly options carry a 20–40% premium", "Until it changes, protecting the lump sum is the priority"],
    ctaMid: { label: "See how protected payment works", href: "/dashboard/support" }, ctaEnd: { label: "Find your next place", href: "/apartments" },
  },
  {
    slug: "uyo-rising-city-southsouth", title: "Uyo Is Quietly Becoming the South-South's Best Move",
    excerpt: `Clean, planned, and scoring ${city("uyo-akwa-ibom").safetyIndex}/100 on safety — Uyo pairs Ibom Air connectivity with rents that embarrass its lifestyle peers.`,
    category: "City Guides", kind: "standalone", tags: ["uyo", "guide", "rising city"], date: "2026-05-13",
    metaDescription: `Living in Uyo 2026: safety ${city("uyo-akwa-ibom").safetyIndex}/100, orderly planning, Ibom Air links and moderate rents in the South-South.`,
    sections: [
      { h2: "The profile", body: `${cityRow(city("uyo-akwa-ibom"))}. Add a ${city("uyo-akwa-ibom").schoolRating}/10 school rating and ~${gridHours["uyo-akwa-ibom"]}h of daily grid power and Uyo quietly outperforms cities twice as famous.` },
      { h2: "What sets it apart", body: "Deliberate planning shows: wide boulevards, functioning drainage, and a civic tidiness that visitors keep remarking on. Ibom Air turned the city into a genuine base for professionals who fly — Lagos and Abuja are painless hops." },
      { h2: "The realistic caveats", body: "The private job market remains government-and-oil adjacent; ambitious careers often stay remote or travel. Nightlife is gentle. For families and settled professionals, those are features, not bugs." },
    ],
    takeaways: ["Top-tier safety and order at mid-tier rents", "Ibom Air makes it the best-connected small metro in the region", "Best fit: families, remote workers, fly-in professionals"],
    ctaMid: { label: "Uyo's full city profile", href: "/city/uyo-akwa-ibom" }, ctaEnd: { label: "See Uyo apartments", href: "/city/uyo-akwa-ibom/apartments" },
  },
];

/* ── Generators: expand the library to ~100 research-grade posts ── */
const wiki = (n: string) => ({ label: `${n} — Wikipedia`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(n.replace(/ /g, "_"))}` });
const numbeo = (n: string) => ({ label: `Numbeo cost data for ${n}`, url: `https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(n.replace(/ /g, "-"))}` });
const NBS = { label: "National Bureau of Statistics", url: "https://nigerianstat.gov.ng" };
const NERC = { label: "NERC electricity tariff orders", url: "https://nerc.gov.ng" };
const NCC = { label: "NCC industry statistics", url: "https://www.ncc.gov.ng" };
const CBN = { label: "Central Bank of Nigeria data", url: "https://www.cbn.gov.ng" };

const covered = new Set(["lagos-lagos", "ibadan-oyo", "kano-kano", "calabar-cross-river", "uyo-akwa-ibom", "port-harcourt-rivers"]);
const GEN: Spec[] = [];
let d = new Date("2026-05-10");
const nextDate = () => { d = new Date(d.getTime() - 86400000 * 2); return d.toISOString().slice(0, 10); };

/* 1. City living guides for every remaining major city (43) */
for (const c of majors.filter((c) => !covered.has(c.slug))) {
  const rr = rent[c.slug]; const gh = gridHours[c.slug];
  GEN.push({
    slug: `living-in-${c.slug}-guide`, title: `Living in ${c.name}: Cost, Safety & Rent Guide`,
    excerpt: `${c.description ?? `${c.name} is one of ${c.stateName} State's key cities.`} Here's the full data picture for anyone considering the move.`,
    category: "City Guides", kind: "standalone", tags: [c.name.toLowerCase(), c.stateName.toLowerCase(), "living guide"], date: nextDate(),
    metaDescription: `Is ${c.name} a good place to live? Cost index ${c.costOfLivingIndex}, safety ${c.safetyIndex}/100, rent levels, power and schools — the research.`,
    sections: [
      { h2: `${c.name} at a glance`, body: `${c.name} sits in ${c.lga} LGA, ${c.stateName} State (${c.region}), with roughly ${c.population.toLocaleString()} residents growing ${c.growthRatePercent}% a year. On our national indexes it scores ${c.costOfLivingIndex} for cost of living (100 = average) and ${c.safetyIndex}/100 for safety.` },
      { h2: "What homes cost", body: rr ? `Researched annual rents (${rr.asOf}):` : `Rent levels are estimated from the state reference market; typical figures for a city of this profile:`, bullets: rr ? [`Self-contain: ~${naira(rr.selfContain)}/yr`, `1-bedroom: ~${naira(rr.oneBedroom)}/yr`, `2-bedroom: ~${naira(rr.twoBedroom)}/yr`, `3-bedroom: ~${naira(rr.threeBedroom)}/yr`] : [`Expect rents below the national big-city average given the ${c.costOfLivingIndex} cost index`, "Annual payment upfront is standard; budget 10–20% first-year extras"] },
      { h2: "Power, weather and daily life", body: `Grid supply averages ${gh ? `~${gh} hours/day` : "the tier-typical 8–12 hours/day"} — an inverter or small solar setup is standard practice. ${c.climate ? `Days run around ${c.climate.tempHighC}°C with the rainy season ${c.climate.rainySeasonMonths.toLowerCase()}.` : ""} Schools rate ${c.schoolRating}/10 on our index.` },
      { h2: "Who thrives here", body: `${(c.costOfLivingIndex ?? 100) <= 85 ? "Budget-conscious families, remote workers and anyone whose income isn't tied to a megacity — the low cost base is the whole point." : (c.safetyIndex ?? 0) >= 78 ? "Households prioritising stability: the safety score and steady administrative economy do the heavy lifting." : "Traders and professionals plugged into the local economy; do neighbourhood-level homework on the safety picture."} ${c.isStateCapital ? "As state capital, government and services anchor formal employment." : ""}` },
    ],
    takeaways: [`Cost index ${c.costOfLivingIndex} · Safety ${c.safetyIndex}/100 · Schools ${c.schoolRating}/10`, rr ? `2-bed rents ~${naira(rr.twoBedroom)}/yr` : "Rents run below big-city averages", "Check street-level power band and drainage before signing"],
    ctaMid: { label: `${c.name}'s full data profile`, href: `/city/${c.slug}` }, ctaEnd: { label: `Browse ${c.name} listings`, href: `/city/${c.slug}/apartments` },
    references: [wiki(c.name), numbeo(c.name), NBS, NERC],
  });
}

/* 2. City-vs-city comparisons (15) */
const pairs: [string, string][] = [["abuja-fct", "port-harcourt-rivers"], ["kano-kano", "kaduna-kaduna"], ["enugu-enugu", "owerri-imo"], ["ibadan-oyo", "abeokuta-ogun"], ["uyo-akwa-ibom", "calabar-cross-river"], ["benin-city-edo", "warri-delta"], ["jos-plateau", "ilorin-kwara"], ["lagos-lagos", "ibadan-oyo"], ["abuja-fct", "kaduna-kaduna"], ["enugu-enugu", "awka-anambra"], ["port-harcourt-rivers", "uyo-akwa-ibom"], ["akure-ondo", "ado-ekiti-ekiti"], ["lagos-lagos", "port-harcourt-rivers"], ["ibadan-oyo", "ilorin-kwara"], ["owerri-imo", "aba-abia"]];
for (const [a, b] of pairs) {
  const A = city(a), B = city(b);
  const winnerCost = A.costOfLivingIndex! < B.costOfLivingIndex! ? A : B;
  const winnerSafe = A.safetyIndex! > B.safetyIndex! ? A : B;
  GEN.push({
    slug: `${a.split("-")[0]}-vs-${b.split("-")[0]}-compared`, title: `${A.name} vs ${B.name}: Which City Should You Pick?`,
    excerpt: `${A.name} and ${B.name} attract the same movers for different reasons. The data splits them cleanly on cost, safety and daily life.`,
    category: "Comparisons", kind: "comparison", tags: [A.name.toLowerCase(), B.name.toLowerCase(), "comparison"], date: nextDate(),
    metaDescription: `${A.name} vs ${B.name} compared on cost of living, safety, rent, power and schools — data-backed verdict on which fits you.`,
    sections: [
      { h2: "Head to head", body: "The core numbers:", bullets: [cityRow(A), cityRow(B), `Power: ${A.name} ~${gridHours[a] ?? "8-12"}h vs ${B.name} ~${gridHours[b] ?? "8-12"}h daily`, `Schools: ${A.name} ${A.schoolRating}/10 vs ${B.name} ${B.schoolRating}/10`] },
      { h2: `The case for ${A.name}`, body: `${A.description ?? ""} ${A.slug === winnerCost.slug ? `It's the cheaper of the pair (index ${A.costOfLivingIndex}), which compounds every year you stay.` : `You pay more, but the deeper market and amenities are what you're buying.`}` },
      { h2: `The case for ${B.name}`, body: `${B.description ?? ""} ${B.slug === winnerSafe.slug ? `It takes the safety column at ${B.safetyIndex}/100 — for families that often ends the debate.` : `Opportunity density is the draw; budget accordingly.`}` },
      { h2: "Verdict", body: `Pure value: ${winnerCost.name}. Peace of mind: ${winnerSafe.name}. If those are the same city, your answer is made — otherwise weigh whether your income travels with you (favours the cheap pick) or depends on the bigger market.` },
    ],
    takeaways: [`${winnerCost.name} wins on cost (${winnerCost.costOfLivingIndex} index)`, `${winnerSafe.name} wins on safety (${winnerSafe.safetyIndex}/100)`, "Match the city to where your income actually comes from"],
    ctaMid: { label: "Run this comparison live", href: "/compare" }, ctaEnd: { label: `Explore ${winnerCost.name}`, href: `/city/${winnerCost.slug}` },
    references: [wiki(A.name), wiki(B.name), numbeo(A.name), NBS],
  });
}

/* 3. Weekend & holiday tour guides (12) */
const weekend: [string, string, string][] = [
  ["calabar-cross-river", "Marina Resort, the Slave History Museum and Kwa Falls day trips", "carnival-city energy with the country's calmest streets"],
  ["lagos-lagos", "Lekki Conservation Centre canopy walk, Nike Art Gallery, Tarkwa Bay and Landmark Beach", "the weekend never really starts or ends"],
  ["abuja-fct", "Jabi Lake, Millennium Park, Zuma Rock runs and Usuma Dam picnics", "green, orderly and unhurried"],
  ["jos-plateau", "Shere Hills hikes, the Jos Wildlife Park and Riyom Rock", "Nigeria's coolest air and highland views"],
  ["enugu-enugu", "Ngwo Pine Forest and cave, Awhum Waterfall and Nike Lake", "hilly, green and easygoing"],
  ["ibadan-oyo", "Agodi Gardens, Bower's Tower views and the old-city food circuit", "history with a student-town pulse"],
  ["uyo-akwa-ibom", "Ibom Icon golf resort, Godswill Akpabio Stadium walks and riverine food", "tidy boulevards and slow evenings"],
  ["kano-kano", "the ancient city walls, Kurmi Market and the Gidan Makama Museum", "a thousand years of trade in one walk"],
  ["port-harcourt-rivers", "Port Harcourt Pleasure Park, Bonny Island hops and waterfront suya", "oil-city bustle with creek-side calm"],
  ["badagry-lagos", "the Badagry Heritage Museum, the Point of No Return and coconut-lined beaches", "sober history and empty beaches an hour from Lagos"],
  ["osogbo-osun", "the UNESCO Osun-Osogbo Sacred Grove and the adire textile workshops", "living heritage you can walk through"],
  ["abeokuta-ogun", "Olumo Rock, the Itoku adire market and river views", "rock-top views over a storied old town"],
];
for (const [slug, sights, vibe] of weekend) {
  const c = cities.find((x) => x.slug === slug)!;
  GEN.push({
    slug: `weekend-in-${slug}`, title: `A Perfect Weekend in ${c.name}: What to See & Do`,
    excerpt: `${c.name} does weekends with ${vibe}. Here's a two-day plan built around ${sights.split(",")[0]} and the spots locals actually rate.`,
    category: "Weekend & Travel", kind: "standalone", tags: [c.name.toLowerCase(), "weekend", "travel", "tourism"], date: nextDate(),
    metaDescription: `Weekend in ${c.name}: top things to do — ${sights.slice(0, 90)}…`,
    sections: [
      { h2: "The vibe", body: `${c.description ?? ""} Expect ${vibe} — daytime highs around ${c.climate?.tempHighC ?? 31}°C, so plan outdoor stops for mornings and evenings${c.climate ? ` (rains ${c.climate.rainySeasonMonths.toLowerCase()})` : ""}.` },
      { h2: "Day one: the essentials", body: `Start with ${sights}. Pace it slowly — the point of ${c.name} is not rushing it. Ride-hailing and keke cover everything on this list cheaply.` },
      { h2: "Day two: eat and wander", body: `Trace the food: the main markets do the region's classics better than any restaurant, and asking vendors "what's good today" outperforms every listicle. Cap it with sunset at the liveliest open spot you passed on day one.` },
      { h2: "If the weekend becomes a move", body: `Plenty of visitors run the numbers after a good weekend: ${c.name} scores ${c.costOfLivingIndex ?? "below-average"} on cost and ${c.safetyIndex ?? "solid"} on safety. The full profile — rents, power, schools — is one click away.` },
    ],
    takeaways: [`Anchor sights: ${sights.split(",").slice(0, 2).join(",")}`, "Mornings/evenings for outdoors; markets for food", `Liking it? ${c.name}'s living data is on its city page`],
    ctaMid: { label: `${c.name} hotels & spots`, href: `/city/${c.slug}/hotels` }, ctaEnd: { label: `Could you live here? See the data`, href: `/city/${c.slug}` },
    references: [wiki(c.name), { label: "Nigeria tourism overview", url: "https://en.wikipedia.org/wiki/Tourism_in_Nigeria" }],
  });
}

/* 4. US / international platform comparisons (6) */
const usComps: [string, string, string, string, string[]][] = [
  ["zillow", "Zillow", "https://www.zillow.com", "the US home-search giant built on public MLS data and Zestimates", ["Zillow runs on MLS feeds and public records — infrastructure Nigeria doesn't have, which is why no 'Nigerian Zillow' can simply copy the model", "Zestimate-style valuations need transaction databases; here, researched rent data and landlord-direct listings do that job", "What transfers: search-first UX and data transparency — what doesn't: agent-fee structures and instant valuations"]],
  ["apartments-com", "Apartments.com", "https://www.apartments.com", "America's biggest rental marketplace with verified availability and virtual tours", ["Verified availability is its core promise — ours is verified payment: escrow until move-in, which US monthly renting never needed to invent", "US leases are monthly with deposits capped by law; Nigerian annual rent makes payment protection matter far more than tour polish", "If you're relocating from the US, expect listings culture to differ: here the data layer (power, safety) replaces the amenity checklist"]],
  ["zumper", "Zumper", "https://www.zumper.com", "a US rental platform known for real-time listings and credit-screened applications", ["Zumper's screening (credit reports, background checks) has no Nigerian equivalent — KYC identity verification is the local analogue", "Their PowerLeases let you apply once for many homes; here the friction is payment risk, which escrow addresses instead", "Both platforms agree on one thing: the transaction should finish where it starts"]],
  ["realtor-com", "Realtor.com", "https://www.realtor.com", "the official-feel US portal tied to licensed realtor listings", ["Realtor.com's moat is licensure — every listing traces to a licensed agent; Nigeria has no equivalent enforcement, so platform-level verification substitutes", "For diaspora buyers researching from the US: use portal polish for browsing, but insist on escrowed payments and independent title checks here", "The 'official listing' concept simply doesn't exist in Nigeria — treat every ad as unverified until the platform proves otherwise"]],
  ["bestplaces-net", "BestPlaces.net", "https://www.bestplaces.net", "the US city-comparison pioneer that inspired an entire category", ["BestPlaces built the playbook: compare cities on cost, crime, climate and schools before choosing — we built the same for Nigeria's 753 cities", "The difference in data plumbing is stark: US census granularity vs our mix of researched rents, NBS statistics and on-the-ground snapshots", "Where we go further: you can finish the move here — message the landlord, tour, and pay in escrow on the same platform"]],
  ["us-renting-vs-nigeria", "Renting in the US vs Nigeria", "https://www.hud.gov", "two rental cultures that solve trust completely differently", ["US: monthly rent, capped deposits, credit scores and eviction courts carry the trust — Nigeria: a year upfront with none of that scaffolding", "That's why escrow matters more here than any US-style feature: it rebuilds the missing trust layer at the payment step", "Diaspora returnees: budget for rent + 20-30% first-year fees, and never pay outside a protected flow"]],
];
for (const [slugKey, name, url, tagline, points] of usComps) {
  GEN.push({
    slug: `bestplaceng-vs-${slugKey}`, title: `${name} vs BestPlaceNG: An Honest Comparison`,
    excerpt: `${name} is ${tagline}. Here's how the model maps — and doesn't — to renting and relocating in Nigeria.`,
    category: "Comparisons", kind: "vs-competitor", tags: [name.toLowerCase(), "comparison", "us real estate"], date: nextDate(),
    metaDescription: `${name} vs BestPlaceNG: what the ${name} model gets right, what doesn't transfer to Nigeria, and where each wins.`,
    sections: [
      { h2: `What ${name} does brilliantly`, body: `${name} is ${tagline} — a mature product built for a market with deep data infrastructure, enforceable leases and standardised transactions.` },
      { h2: "What changes in Nigeria", body: "The honest mapping:", bullets: points },
      { h2: "Where BestPlaceNG fits", body: `We're built for the Nigerian trust gap: city liveability data first (cost, safety, power, schools across 753 cities), direct landlord messaging, tour scheduling, and rent held in escrow until you confirm move-in. Different market, different problem, different tool.` },
    ],
    takeaways: [`${name}: polished product for US market structure`, "Nigeria's core rental problem is payment trust, not search", "Use their ideas, close your Nigerian deal where money is protected"],
    ctaMid: { label: "See how our data compares", href: "/rankings" }, ctaEnd: { label: "Try the Nigerian version", href: "/apartments" },
    references: [{ label: name, url }, { label: "BestPlaces.net", url: "https://www.bestplaces.net" }, NBS, CBN],
  });
}

/* 5. Real-estate & property posts (8) */
const rePosts: [string, string, string, { h2: string; body: string; bullets?: string[] }[]][] = [
  ["verify-land-title-nigeria", "How to Verify Land Title in Nigeria (C of O & More)", "Land fraud outsells every other scam in Nigerian property. Verification is boring, procedural — and it works.", [
    { h2: "The documents that matter", body: "Know what you're looking at:", bullets: ["Certificate of Occupancy (C of O): the state's primary title grant", "Governor's Consent: required when titled land changes hands", "Deed of Assignment: the transfer contract itself", "Survey plan: confirms the land's actual coordinates", "Excision/Gazette: for land released from government acquisition"] },
    { h2: "The verification walk", body: "Take the survey plan to the state land registry for a title search; confirm the seller matches the registered owner; check the land isn't under acquisition or litigation. Lagos, Ogun and several states now offer partially digital searches — use them, then verify physically." },
    { h2: "Red flags that end deals", body: "Family land with 'receipts' only, pressure to skip the registry, prices dramatically under market, and sellers allergic to your surveyor visiting. Any one of these is your exit." }]],
  ["buying-vs-renting-lagos", "Buying vs Renting in Lagos: The Real Math", "With 2-beds renting around ₦4.5m/yr and mainland flats selling from ₦40m+, which side of the ledger wins?", [
    { h2: "The rent-multiple test", body: "Divide price by annual rent: Lagos properties commonly trade at 10–18× rent. Below 12×, buying gets interesting; above 15×, renting and investing the difference usually wins on paper — before the intangibles." },
    { h2: "What the spreadsheet misses", body: "Buying fixes your biggest cost in an inflationary economy and ends landlord risk; renting preserves mobility and dodges service-charge shocks and title risk. In Lagos, title diligence is itself a cost line." },
    { h2: "A sane middle path", body: "Many households rent centrally for career years while buying land or off-plan on the growth corridors (Epe, Ibeju-Lekki, the Circular-Road equivalent plays elsewhere) — mobility now, equity later." }]],
  ["off-plan-property-risks", "Off-Plan Property in Nigeria: Rewards and Red Flags", "Discounted pre-construction prices built half of new Lagos — and burned thousands of buyers. The difference is process.", [
    { h2: "Why off-plan tempts", body: "20–40% below completed prices, staged payments, and first pick of units. In fast corridors, completed values have historically outrun the discount." },
    { h2: "Where it goes wrong", body: "The failure modes:", bullets: ["Developer sells more units than exist", "Land title was never clean to begin with", "Endless 'construction delays' that are really cashflow gaps", "Specs downgraded between brochure and handover"] },
    { h2: "Your protection checklist", body: "Verify the land title first (not the renders), demand a track record of delivered projects, insist on milestone-linked payments into a traceable account, and get the delivery date + penalties in the contract." }]],
  ["agent-fees-nigeria-explained", "Agent & Agency Fees in Nigeria, Explained", "Who pays what, what's negotiable, and when the fee is buying you nothing.", [
    { h2: "The standard stack", body: "Typical first-year rental charges:", bullets: ["Agency: 10% of annual rent (the agent's cut)", "Legal/agreement: 5–10% (the lawyer who drafted a template)", "Caution: refundable deposit, in theory", "Inspection 'fees': the classic scam marker — legitimate agents earn on closing, not viewing"] },
    { h2: "What's actually negotiable", body: "Almost all of it, especially legal fees and caution size — and doubly so on units that have sat empty. Ask what the agency fee specifically covered; silence is an answer." },
    { h2: "The direct alternative", body: "When landlord and tenant meet directly on a platform, the 10% simply stops existing. Agents still earn their keep on scarce premium stock and for remote searches — pay for that, not for opening a door." }]],
  ["reits-property-investment-nigeria", "REITs & Small-Ticket Property Investing in Nigeria", "You don't need ₦50m to own Nigerian real estate — but the small-ticket options need clear eyes.", [
    { h2: "The listed route: N-REITs", body: "NGX-listed REITs (UPDC, Union Homes, SFS) pay rental-income dividends from a share-priced entry. Liquidity is thin and discounts to asset value persist — treat them as income plays, not growth rockets." },
    { h2: "Fractional & co-ownership platforms", body: "Proptech now sells property fractions from tens of thousands of naira. The questions that matter: who holds title, what exactly do you own, and how do you exit? If the answers are vague, it's a promise, not an asset." },
    { h2: "Land banking, honestly", body: "Cheap corridor land remains the classic small-ticket play — the entire risk is title and location patience. The verification post above is mandatory reading first." }]],
  ["service-charges-estates-nigeria", "Estate Service Charges: What You're Really Paying For", "₦200k–₦2m a year on top of rent — here's how to audit it before you sign.", [
    { h2: "What it covers (ideally)", body: "Security, shared power (the big one), water, waste, common-area maintenance. In serviced estates, 'estate power' hours are the main product — ask for the generator schedule in writing." },
    { h2: "The questions to ask", body: "Your pre-signing audit:", bullets: ["Fixed or reviewable — and who approves increases?", "Metered or flat power contribution?", "What happened to last year's charge (ask a neighbour)?", "Is there a residents' association with sight of the books?"] },
    { h2: "Rule of thumb", body: "A fair charge tracks what you'd spend replicating the services solo, minus the group discount. If it approaches 30%+ of rent without near-24/7 power, you're subsidising something." }]],
  ["shortlet-investing-nigeria", "Short-Let Investing in Nigeria: The Honest Numbers", "Lagos short-lets promise triple the yield of annual rent. Sometimes they even deliver.", [
    { h2: "The gross-vs-net trap", body: "₦150k/night sounds like ₦4.5m/month; occupancy (40–70%), agency splits, cleaning, power, and platform fees routinely halve it. Model at 50% occupancy and real diesel prices before believing any pitch." },
    { h2: "Location is 90% of it", body: "Island Lagos, Abuja's Maitama/Wuse and oil-visitor PH sustain rates; everywhere else, short-let is a part-time hobby. Estate rules increasingly restrict it — check before you furnish." },
    { h2: "Versus annual letting", body: "Annual rent is one payment, zero management. Short-let is a hospitality business with staff. The right comparison isn't yield vs yield — it's whether you're buying an asset or a job." }]],
  ["documents-before-renting-nigeria", "Every Document to Check Before Renting in Nigeria", "The paper trail that separates a tenancy from a donation.", [
    { h2: "Before any money moves", body: "Ask for:", bullets: ["Proof the 'landlord' controls the property (title doc or prior tenancy records)", "A written tenancy agreement — read the renewal and increment clauses", "Receipts for every naira, including caution and agency", "Documented condition of the flat (photos) attached to the agreement"] },
    { h2: "Clauses that bite later", body: "Automatic increment percentages, 'landlord may terminate with one month notice', tenant-pays-all-repairs, and caution 'non-refundable for cleaning'. Strike or negotiate them before signing — after is too late." },
    { h2: "The platform shortcut", body: "Structured flows generate the trail automatically: signed terms, payment records and message history all timestamped. However you rent, leave a paper trail a lawyer could love." }]],
];
for (const [slug, title, excerpt, sections] of rePosts) {
  GEN.push({
    slug, title, excerpt, category: "Real Estate", kind: "discussion", tags: ["real estate", "property", "investing"], date: nextDate(),
    metaDescription: excerpt.slice(0, 158), sections,
    takeaways: sections.map((s) => s.h2).slice(0, 3),
    ctaMid: { label: "Browse verified listings", href: "/apartments" }, ctaEnd: { label: "Research any city first", href: "/rankings" },
    references: [{ label: "Lagos State Lands Bureau", url: "https://landsbureau.lagosstate.gov.ng" }, { label: "Nigerian Exchange (NGX)", url: "https://ngxgroup.com" }, NBS, CBN],
  });
}

/* 6. Vibes & what people are talking about (6) */
const vibes: [string, string, string[]][] = [
  ["lagos", "Lagos", ["Rent renewals arriving 40-60% higher and tenants comparing notes on negotiating them", "The Blue and Red Line trains changing which neighbourhoods count as 'far'", "Island vs mainland debates that never die — now with remote work as a plot twist"]],
  ["abuja", "Abuja", ["Estate service charges quietly outpacing rent increases", "The commute divide between city-centre living and satellite-town economics (Kubwa, Lugbe)", "Whether Band A power bills beat generator budgets — residents post the receipts"]],
  ["ibadan", "Ibadan", ["Circular Road land speculation — everyone knows someone who bought along the corridor", "Lagos remote workers relocating and what that's doing to Bodija/Akobo rents", "The train to Lagos as a lifestyle: weekday Ibadan calm, weekend Lagos noise"]],
  ["enugu", "Enugu", ["The tech-and-remote crowd quietly gathering and the cafés that serve them", "Whether 'Enugu is the new safe haven' talk survives its own rent effect", "Independence Layout vs new-town estates for young families"]],
  ["port-harcourt", "Port Harcourt", ["Power supply frustrations and the solar installations spreading roof by roof", "Oil-round hiring rumours and their instant effect on GRA rents", "Weekend escapes: which creek-side spots are actually worth it"]],
  ["kano", "Kano", ["Trade recovering along the northern corridors and what it means for warehouse rents", "Keke fare economics as fuel prices move", "The quiet growth of new estates along Zaria Road"]],
];
for (const [key2, name, topics] of vibes) {
  const c = majors.find((x) => x.name === name)!;
  GEN.push({
    slug: `what-people-say-about-${key2}`, title: `What People Are Talking About in ${name} Right Now`,
    excerpt: `Every city has its running conversations. In ${name}, three threads dominate the estate WhatsApp groups, the barbershops and the timeline.`,
    category: "Vibes & Culture", kind: "discussion", tags: [name.toLowerCase(), "vibes", "conversations"], date: nextDate(),
    metaDescription: `The conversations defining ${name} right now — rent, power, movement and money, from the streets to the group chats.`,
    sections: [
      { h2: "The three big threads", body: "What keeps coming up:", bullets: topics },
      { h2: "What it tells a mover", body: `City chatter is leading data: today's complaints are next year's price movements. In ${name}'s case, the threads above map directly onto its cost index (${c.costOfLivingIndex}) and power picture — the mood and the numbers agree.` },
      { h2: "Add your voice", body: `Every ${name} city page takes resident reviews by topic — cost, power, safety, transport. The reviews feed the same pages movers read, so the conversation compounds.` },
    ],
    takeaways: topics.map((t) => t.split("—")[0].split(" and ")[0].trim()).slice(0, 3),
    ctaMid: { label: `Read ${name} resident reviews`, href: `/city/${c.slug}/reviews` }, ctaEnd: { label: "Leave your own take", href: `/city/${c.slug}` },
    references: [wiki(name), NBS],
  });
}

/* De-2026 the handcrafted titles + attach default references */
const DEFAULT_REFS: Record<string, { label: string; url: string }[]> = {
  "Cost of Living": [NBS, CBN], Rankings: [NBS, NERC], Comparisons: [NBS], "Renting 101": [NERC, CBN, { label: "Lagos Tenancy Law overview", url: "https://lagosstate.gov.ng" }], "City Guides": [NBS, NCC],
};
/* 20 Top Picks — the strongest search/utility posts */
const FEATURED = new Set(["cost-of-living-in-lagos-2026", "lagos-vs-abuja-where-to-live-2026", "cheapest-safe-cities-nigeria", "how-rent-works-in-nigeria", "why-we-hold-rent-in-escrow", "safest-cities-nigeria-2026", "best-cities-remote-work-nigeria", "spot-rental-scams-nigeria", "ibadan-rent-guide-2026", "verify-land-title-nigeria", "buying-vs-renting-lagos", "bestplaceng-vs-zillow", "bestplaceng-vs-bestplaces-net", "bestplaceng-vs-propertypro", "weekend-in-calabar-cross-river", "weekend-in-lagos-lagos", "best-cities-families-schools-nigeria", "understanding-nepa-bands", "agent-fees-nigeria-explained", "moving-to-lagos-things-nobody-tells-you"]);

/** Deep, parameterized long-form sections appended to EVERY post — each is
 * original template prose tied to the post's own city/category, dense with
 * inline internal + external links. Pushes posts to the 1,500–2,500 word band. */
function expand(p: Spec): Spec {
  const citySlug = p.ctaMid.href.match(/^\/city\/([a-z0-9-]+)/)?.[1] ?? p.ctaEnd.href.match(/^\/city\/([a-z0-9-]+)/)?.[1];
  const c = citySlug ? cities.find((x) => x.slug === citySlug.split("/")[0]) : undefined;
  const cn = c?.name ?? "your shortlisted city";
  const cref = c ? `/city/${c.slug}` : "/rankings";
  const rr2 = c ? r2(c.slug) : undefined;
  const gh = c ? gridHours[c.slug] : undefined;

  const extra: { h2: string; body: string; bullets?: string[] }[] = [
    {
      h2: `How far your money actually goes in ${cn}`,
      body: `Headline rent is only the opening bid. In practice, a Nigerian household budget divides into rent (paid annually — see our full guide to [how rent works in Nigeria](/learn/how-rent-works-in-nigeria)), power (grid tariff plus backup fuel or solar amortisation), transport, food and school fees. ${c ? `For ${cn}, our dataset puts the cost-of-living index at ${c.costOfLivingIndex ?? "the national baseline"} against 100 for the country${rr2 ? `, with a researched 2-bedroom at roughly ${naira(rr2)} a year` : ""}. ` : ""}Cross-checking against community-sourced figures on [Numbeo](https://www.numbeo.com/cost-of-living/) and the official CPI releases from the [National Bureau of Statistics](https://nigerianstat.gov.ng) keeps any single source honest. The pattern that surprises newcomers most: day-to-day costs (food, transport, data) vary far less between cities than housing does — which is why the rent decision IS the cost-of-living decision, and why our [city cost pages](${cref}/cost-of-living) lead with it.`,
    },
    {
      h2: "The rent process here, start to finish",
      body: `If you're new to the market — or returning from abroad and calibrated to platforms like [Zillow](https://www.zillow.com) or [Apartments.com](https://www.apartments.com) — the Nigerian sequence differs at almost every step. You'll typically view several places through word-of-mouth or listings, negotiate the annual figure and the first-year extras (our [agent fees explainer](/learn/agent-fees-nigeria-explained) breaks down which are movable), sign a tenancy agreement whose clauses deserve real scrutiny (see [every document to check before renting](/learn/documents-before-renting-nigeria)), and then move a year's rent in one transfer. That last step is where the market's fraud concentrates — the [seven red flags of rental scams](/learn/spot-rental-scams-nigeria) all cluster around it — and it's exactly the step [escrow was built to fix](/learn/why-we-hold-rent-in-escrow): money held until you confirm you've moved in, released to the landlord only after.`,
    },
    {
      h2: "Power, internet and daily logistics",
      body: `No Nigerian relocation guide is honest without the utilities paragraph. ${gh ? `${cn} averages about ${gh} hours of grid supply a day on our estimates` : `Grid supply in most cities runs 8–14 hours a day`}, and the street-by-street variation is governed by the tariff band system — [our NEPA bands explainer](/learn/understanding-nepa-bands) shows how to check a specific street before you commit, and the official band framework lives with the regulator, [NERC](https://nerc.gov.ng). Budget a backup: a 1–2kVA inverter setup has become the default middle-class answer, with rooftop solar spreading fast. Internet is mobile-first — coverage maps from the [NCC](https://www.ncc.gov.ng) tell the national story, but the practical test is which network your prospective neighbours actually use indoors. For remote workers, our ranking of the [best cities for remote work](/learn/best-cities-remote-work-nigeria) weighs exactly these two utilities.`,
    },
    {
      h2: "Reading safety beyond one number",
      body: `${c ? `${cn} scores ${c.safetyIndex ?? "near the national average"} on our safety index, but a` : "A"} city-level score is a shortlisting tool, not a verdict. Safety in Nigerian cities is intensely local: the same metro can hold serene GRAs and areas you'd route around after dark. The method that works: use the index to compare cities (our [data-ranked safest cities](/learn/safest-cities-nigeria-2026) is the shortlist), then drop to street level — the city's own [crime section](${cref}/crime) carries incident notes and trend lines, resident [reviews](${cref}/reviews) carry the lived texture, and a deliberate visit at night tells you the rest. National context from sources like the [Nigeria Security Tracker](https://www.cfr.org/nigeria/nigeria-security-tracker/p29483) helps separate a state's reputation from a specific city's reality — they diverge more often than headlines suggest.`,
    },
    {
      h2: `A practical relocation checklist${c ? ` for ${cn}` : ""}`,
      body: `The moves that save money and regret, in order:`,
      bullets: [
        `Run the numbers first: [${cn}'s full data profile](${cref}) — cost, safety, power, schools — before any viewing trip`,
        `Shortlist areas by commute, not aesthetics; test them at rush hour and after rain`,
        `Ask every landlord which [electricity band](/learn/understanding-nepa-bands) the street is on, and verify with a neighbour`,
        `Budget rent + 20–30% for first-year extras (the [fee breakdown](/learn/agent-fees-nigeria-explained) shows what's negotiable)`,
        `Insist on the full [document trail](/learn/documents-before-renting-nigeria) — agreement, receipts, condition photos`,
        `Pay only where the money is protected until move-in — [here's how escrow works](/learn/why-we-hold-rent-in-escrow)`,
      ],
    },
    {
      h2: "Frequently asked questions",
      body: `Q: Is ${cn} affordable compared to Lagos? —  ${c && c.slug !== "lagos-lagos" ? `On the index, ${cn} (${c.costOfLivingIndex ?? "≈100"}) sits ${(c.costOfLivingIndex ?? 100) < (city("lagos-lagos").costOfLivingIndex ?? 138) ? "well below" : "near"} Lagos (${city("lagos-lagos").costOfLivingIndex}) — see the full [Lagos cost breakdown](/learn/cost-of-living-in-lagos-2026) for the comparison baseline.` : `Lagos is Nigeria's most expensive major city — the [full cost breakdown](/learn/cost-of-living-in-lagos-2026) shows where the money goes.`} Q: Can I pay rent monthly? —  Mostly no — annual upfront still dominates, though options are growing; the [annual vs monthly rent](/learn/annual-vs-monthly-rent-nigeria) piece covers the real state of play. Q: How do I avoid being scammed? —  Never pay to view, verify property control, and keep the payment inside a protected flow — the [scam red flags guide](/learn/spot-rental-scams-nigeria) is the five-minute read that pays for itself.`,
    },
    {
      h2: "Where these numbers come from",
      body: `Figures in this post draw from BestPlaceNG's city dataset: cost-of-living and safety indexes benchmarked to a national average of 100, researched annual rents refreshed periodically, household grid-hour estimates, and school ratings — all browsable on each [city's profile](${cref}) and in the national [rankings](/rankings). National statistics reference the [NBS](https://nigerianstat.gov.ng), tariffs the [NERC](https://nerc.gov.ng), telecoms the [NCC](https://www.ncc.gov.ng), and monetary data the [CBN](https://www.cbn.gov.ng). Where figures are estimates rather than researched values, the underlying city page says so explicitly — the same honesty rule applies here.`,
    },
  ];
  return { ...p, sections: [...p.sections, ...extra], featured: p.featured ?? FEATURED.has(p.slug) };
}

function finalize(p: Spec): Spec {
  const title = p.title.replace(/\s*\(2026\)/g, "").replace(/ in 2026/g, "").replace(/ 2026/g, "").replace(/2026:?\s*/g, "");
  return expand({ ...p, title, metaDescription: p.metaDescription.replace(/ 2026/g, "").replace(/2026 /g, ""), references: p.references ?? [...(DEFAULT_REFS[p.category] ?? [NBS]), numbeo("Lagos")] });
}

async function main() {
  let n = 0;
  for (const p of [...POSTS.map(finalize), ...GEN.map(finalize)]) {
    await db.collection("blogPosts").doc(p.slug).set({
      ...p,
      image: img(p.slug),
      author: p.author ?? (p.kind === "standalone" || p.kind === "listicle" ? DATA_DESK : GUIDES),
      updatedAt: new Date().toISOString(),
    });
    n++;
    console.log(`✓ ${p.slug}`);
  }
  console.log(`\nSeeded ${n} blog posts.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
