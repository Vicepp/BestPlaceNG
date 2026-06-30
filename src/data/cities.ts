import majorOverrides from "./major-overrides.json";
import lgaEntries from "./nigeria-lgas.json";
import { getFirestoreCollection } from "@/lib/firestoreData";

export interface CityData {
  slug: string;
  name: string;
  stateName: string;
  stateSlug: string;
  lga: string;
  region: string;
  population: number;
  populationYear: number;
  growthRatePercent: number;
  zipCode?: string;
  isStateCapital: boolean;
  isFederalCapital?: boolean;
  rank: number;
  /** "major" = full researched profile; "lga" = population/state/LGA only, pending richer data. */
  tier: "major" | "lga";
  costOfLivingIndex?: number;
  safetyIndex?: number;
  climate?: { tempHighC: number; tempLowC: number; rainySeasonMonths: string };
  schoolRating?: number;
  description?: string;
}

interface MajorOverride {
  population: number;
  growthRatePercent: number;
  populationYear: number;
}
const overrides = majorOverrides as Record<string, MajorOverride>;

/**
 * Curated profile dataset for major Nigerian cities/state capitals.
 * Population/growth figures were originally research-based estimates (Wikipedia /
 * WorldPopulationReview), then reconciled in 2026 against a user-supplied LGA-level
 * population dataset (see src/data/nigeria-lga-population-linked.csv) — see
 * `major-overrides.json` for the applied values. Where a city spans multiple LGAs
 * (e.g. Enugu, Jos, Ife) the figure is the sum of its constituent LGAs from that
 * dataset; where the source gave a whole-metro figure (Lagos, Kano, Ibadan, Benin
 * City, Kaduna, Port Harcourt) that figure is used instead.
 * costOfLivingIndex / safetyIndex / schoolRating are illustrative relative indices
 * (national avg = 100), pending verified third-party data, and should be refined
 * over time.
 */
const majorCitiesRaw: Omit<CityData, "tier">[] = [
  { slug: "lagos-lagos", name: "Lagos", stateName: "Lagos", stateSlug: "lagos", lga: "Ikeja", region: "South West", population: 17803700, populationYear: 2025, growthRatePercent: 3.2, zipCode: "100001", isStateCapital: false, rank: 1, costOfLivingIndex: 138, safetyIndex: 72, climate: { tempHighC: 32, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.8, description: "Nigeria's commercial capital and largest city, a sprawling coastal megacity driving the country's finance, entertainment, and tech sectors." },
  { slug: "kano-kano", name: "Kano", stateName: "Kano", stateSlug: "kano", lga: "Kano Municipal", region: "North West", population: 4810800, populationYear: 2025, growthRatePercent: 2.6, zipCode: "700001", isStateCapital: true, rank: 2, costOfLivingIndex: 88, safetyIndex: 78, climate: { tempHighC: 34, tempLowC: 18, rainySeasonMonths: "May - September" }, schoolRating: 6.0, description: "The largest city in northern Nigeria, a historic trade hub known for textiles, agriculture and leather goods." },
  { slug: "abuja-fct", name: "Abuja", stateName: "Federal Capital Territory", stateSlug: "fct", lga: "Abuja Municipal Area Council", region: "North Central", population: 4392360, populationYear: 2025, growthRatePercent: 4.1, zipCode: "900001", isStateCapital: false, isFederalCapital: true, rank: 3, costOfLivingIndex: 132, safetyIndex: 80, climate: { tempHighC: 33, tempLowC: 19, rainySeasonMonths: "April - October" }, schoolRating: 7.5, description: "Nigeria's planned federal capital city, known for wide boulevards, government institutions, and a fast-growing diplomatic and middle-class population." },
  { slug: "ibadan-oyo", name: "Ibadan", stateName: "Oyo", stateSlug: "oyo", lga: "Ibadan North", region: "South West", population: 4293160, populationYear: 2025, growthRatePercent: 2.4, zipCode: "200001", isStateCapital: true, rank: 4, costOfLivingIndex: 90, safetyIndex: 75, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.9, description: "One of West Africa's oldest cities, a major educational center anchored by the University of Ibadan." },
  { slug: "port-harcourt-rivers", name: "Port Harcourt", stateName: "Rivers", stateSlug: "rivers", lga: "Port Harcourt", region: "South South", population: 3951670, populationYear: 2025, growthRatePercent: 2.9, zipCode: "500001", isStateCapital: true, rank: 5, costOfLivingIndex: 118, safetyIndex: 68, climate: { tempHighC: 30, tempLowC: 23, rainySeasonMonths: "March - November" }, schoolRating: 6.4, description: "The heart of Nigeria's oil and gas industry, a busy port city in the Niger Delta." },
  { slug: "benin-city-edo", name: "Benin City", stateName: "Edo", stateSlug: "edo", lga: "Oredo", region: "South South", population: 2120460, populationYear: 2025, growthRatePercent: 2.3, zipCode: "300001", isStateCapital: true, rank: 6, costOfLivingIndex: 85, safetyIndex: 76, climate: { tempHighC: 31, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.5, description: "A historic royal city famed for centuries of Benin Kingdom heritage and bronze artistry." },
  { slug: "onitsha-anambra", name: "Onitsha", stateName: "Anambra", stateSlug: "anambra", lga: "Onitsha North", region: "South East", population: 1839880, populationYear: 2025, growthRatePercent: 2.8, zipCode: "420001", isStateCapital: false, rank: 7, costOfLivingIndex: 95, safetyIndex: 70, climate: { tempHighC: 31, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.3, description: "A major commercial river-port city on the Niger, home to one of West Africa's largest markets." },
  { slug: "uyo-akwa-ibom", name: "Uyo", stateName: "Akwa Ibom", stateSlug: "akwa-ibom", lga: "Uyo", region: "South South", population: 1520020, populationYear: 2025, growthRatePercent: 3.0, zipCode: "520001", isStateCapital: true, rank: 8, costOfLivingIndex: 92, safetyIndex: 81, climate: { tempHighC: 30, tempLowC: 23, rainySeasonMonths: "March - November" }, schoolRating: 7.0, description: "A clean, fast-growing state capital known for orderly city planning and a calm pace of life." },
  { slug: "aba-abia", name: "Aba", stateName: "Abia", stateSlug: "abia", lga: "Aba North", region: "South East", population: 1428069, populationYear: 2025, growthRatePercent: 2.2, zipCode: "440001", isStateCapital: false, rank: 9, costOfLivingIndex: 84, safetyIndex: 69, climate: { tempHighC: 31, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.1, description: "A manufacturing and trading powerhouse, often called Nigeria's 'Japan' for its locally made goods." },
  { slug: "nnewi-anambra", name: "Nnewi", stateName: "Anambra", stateSlug: "anambra", lga: "Nnewi North", region: "South East", population: 1421790, populationYear: 2025, growthRatePercent: 2.5, zipCode: "420002", isStateCapital: false, rank: 10, costOfLivingIndex: 86, safetyIndex: 73, climate: { tempHighC: 31, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.2, description: "An industrial city renowned for indigenous automobile and motorcycle manufacturing." },
  { slug: "kaduna-kaduna", name: "Kaduna", stateName: "Kaduna", stateSlug: "kaduna", lga: "Kaduna North", region: "North West", population: 1302330, populationYear: 2025, growthRatePercent: 2.7, zipCode: "800001", isStateCapital: true, rank: 11, costOfLivingIndex: 87, safetyIndex: 65, climate: { tempHighC: 34, tempLowC: 17, rainySeasonMonths: "May - September" }, schoolRating: 6.6, description: "A former colonial capital of northern Nigeria, now a key industrial and military hub." },
  { slug: "ilorin-kwara", name: "Ilorin", stateName: "Kwara", stateSlug: "kwara", lga: "Ilorin West", region: "North Central", population: 1282219, populationYear: 2025, growthRatePercent: 2.5, zipCode: "240001", isStateCapital: true, rank: 12, costOfLivingIndex: 82, safetyIndex: 79, climate: { tempHighC: 33, tempLowC: 21, rainySeasonMonths: "April - October" }, schoolRating: 6.7, description: "A gateway city between Nigeria's north and south, known for traditional weaving and a relaxed cost of living." },
  { slug: "ikorodu-lagos", name: "Ikorodu", stateName: "Lagos", stateSlug: "lagos", lga: "Ikorodu", region: "South West", population: 1248110, populationYear: 2025, growthRatePercent: 3.5, zipCode: "104101", isStateCapital: false, rank: 13, costOfLivingIndex: 105, safetyIndex: 71, climate: { tempHighC: 32, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.4, description: "A rapidly expanding suburb of Lagos, popular for more affordable housing within the metro area." },
  { slug: "warri-delta", name: "Warri", stateName: "Delta", stateSlug: "delta", lga: "Warri South", region: "South South", population: 1120980, populationYear: 2025, growthRatePercent: 2.4, zipCode: "332001", isStateCapital: false, rank: 14, costOfLivingIndex: 102, safetyIndex: 68, climate: { tempHighC: 30, tempLowC: 23, rainySeasonMonths: "March - November" }, schoolRating: 6.2, description: "An oil-industry city in the Niger Delta with a vibrant, multi-ethnic population." },
  { slug: "enugu-enugu", name: "Enugu", stateName: "Enugu", stateSlug: "enugu", lga: "Enugu North", region: "South East", population: 1115303, populationYear: 2025, growthRatePercent: 2.6, zipCode: "400001", isStateCapital: true, rank: 15, costOfLivingIndex: 89, safetyIndex: 80, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 7.1, description: "The 'Coal City', a hilly, green state capital popular for its relatively low cost of living and good schools." },
  { slug: "owerri-imo", name: "Owerri", stateName: "Imo", stateSlug: "imo", lga: "Owerri Municipal", region: "South East", population: 1105500, populationYear: 2025, growthRatePercent: 2.5, zipCode: "460001", isStateCapital: true, rank: 16, costOfLivingIndex: 91, safetyIndex: 74, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.8, description: "A tidy, tree-lined state capital known for its zoo and growing real estate market." },
  { slug: "jos-plateau", name: "Jos", stateName: "Plateau", stateSlug: "plateau", lga: "Jos North", region: "North Central", population: 1071590, populationYear: 2025, growthRatePercent: 2.3, zipCode: "930001", isStateCapital: true, rank: 17, costOfLivingIndex: 80, safetyIndex: 70, climate: { tempHighC: 27, tempLowC: 14, rainySeasonMonths: "April - October" }, schoolRating: 6.9, description: "A highland city with Nigeria's coolest climate, historically a mining and tourism center." },
  { slug: "umuahia-abia", name: "Umuahia", stateName: "Abia", stateSlug: "abia", lga: "Umuahia North", region: "South East", population: 1033090, populationYear: 2025, growthRatePercent: 2.1, zipCode: "440002", isStateCapital: true, rank: 18, costOfLivingIndex: 81, safetyIndex: 77, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.5, description: "A quiet administrative state capital surrounded by agricultural land." },
  { slug: "lokoja-kogi", name: "Lokoja", stateName: "Kogi", stateSlug: "kogi", lga: "Lokoja", region: "North Central", population: 974767, populationYear: 2025, growthRatePercent: 2.6, zipCode: "260001", isStateCapital: true, rank: 19, costOfLivingIndex: 76, safetyIndex: 75, climate: { tempHighC: 34, tempLowC: 21, rainySeasonMonths: "April - October" }, schoolRating: 6.0, description: "Nigeria's first colonial capital, situated at the confluence of the Niger and Benue rivers." },
  { slug: "maiduguri-borno", name: "Maiduguri", stateName: "Borno", stateSlug: "borno", lga: "Maiduguri Metropolitan", region: "North East", population: 929408, populationYear: 2025, growthRatePercent: 1.8, zipCode: "600001", isStateCapital: true, rank: 20, costOfLivingIndex: 74, safetyIndex: 55, climate: { tempHighC: 36, tempLowC: 18, rainySeasonMonths: "June - September" }, schoolRating: 5.5, description: "A historic Kanem-Borno cultural center in Nigeria's far northeast, rebuilding momentum in recent years." },
  { slug: "bauchi-bauchi", name: "Bauchi", stateName: "Bauchi", stateSlug: "bauchi", lga: "Bauchi", region: "North East", population: 881600, populationYear: 2025, growthRatePercent: 2.2, zipCode: "740001", isStateCapital: true, rank: 21, costOfLivingIndex: 73, safetyIndex: 72, climate: { tempHighC: 34, tempLowC: 17, rainySeasonMonths: "May - September" }, schoolRating: 6.0, description: "A state capital near Yankari National Park, known for agriculture and emerging tourism." },
  { slug: "zaria-kaduna", name: "Zaria", stateName: "Kaduna", stateSlug: "kaduna", lga: "Zaria", region: "North West", population: 835966, populationYear: 2025, growthRatePercent: 2.0, zipCode: "810001", isStateCapital: false, rank: 22, costOfLivingIndex: 75, safetyIndex: 70, climate: { tempHighC: 34, tempLowC: 17, rainySeasonMonths: "May - September" }, schoolRating: 6.8, description: "A centuries-old walled city and major university town, home to Ahmadu Bello University." },
  { slug: "akure-ondo", name: "Akure", stateName: "Ondo", stateSlug: "ondo", lga: "Akure South", region: "South West", population: 834009, populationYear: 2025, growthRatePercent: 2.4, zipCode: "340001", isStateCapital: true, rank: 23, costOfLivingIndex: 83, safetyIndex: 78, climate: { tempHighC: 30, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.9, description: "A calm state capital in Nigeria's cocoa-growing belt." },
  { slug: "abeokuta-ogun", name: "Abeokuta", stateName: "Ogun", stateSlug: "ogun", lga: "Abeokuta South", region: "South West", population: 800000, populationYear: 2025, growthRatePercent: 2.9, zipCode: "110001", isStateCapital: true, rank: 24, costOfLivingIndex: 88, safetyIndex: 77, climate: { tempHighC: 31, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.6, description: "A rocky-hilled state capital close to Lagos, popular for tie-dye textiles and growing as a Lagos commuter town." },
  { slug: "oyo-oyo", name: "Oyo", stateName: "Oyo", stateSlug: "oyo", lga: "Oyo East", region: "South West", population: 793241, populationYear: 2025, growthRatePercent: 1.9, zipCode: "211001", isStateCapital: false, rank: 25, costOfLivingIndex: 78, safetyIndex: 79, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.3, description: "The historic seat of the Oyo Empire, today a quiet town known for traditional crafts." },
  { slug: "sokoto-sokoto", name: "Sokoto", stateName: "Sokoto", stateSlug: "sokoto", lga: "Sokoto North", region: "North West", population: 789726, populationYear: 2025, growthRatePercent: 2.1, zipCode: "840001", isStateCapital: true, rank: 26, costOfLivingIndex: 72, safetyIndex: 71, climate: { tempHighC: 37, tempLowC: 19, rainySeasonMonths: "June - September" }, schoolRating: 5.8, description: "The seat of the Sokoto Caliphate, a historic center of Islamic scholarship in Nigeria's far northwest." },
  { slug: "yola-adamawa", name: "Yola", stateName: "Adamawa", stateSlug: "adamawa", lga: "Yola North", region: "North East", population: 758153, populationYear: 2025, growthRatePercent: 2.3, zipCode: "640001", isStateCapital: true, rank: 27, costOfLivingIndex: 73, safetyIndex: 68, climate: { tempHighC: 35, tempLowC: 19, rainySeasonMonths: "May - September" }, schoolRating: 6.1, description: "A riverside state capital near the Cameroon border, rebuilding as a regional trade hub." },
  { slug: "ogbomosho-oyo", name: "Ogbomosho", stateName: "Oyo", stateSlug: "oyo", lga: "Ogbomosho North", region: "South West", population: 744835, populationYear: 2025, growthRatePercent: 1.8, zipCode: "210001", isStateCapital: false, rank: 28, costOfLivingIndex: 77, safetyIndex: 78, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.4, description: "A historic Yoruba trading town known for agriculture and textiles." },
  { slug: "gusau-zamfara", name: "Gusau", stateName: "Zamfara", stateSlug: "zamfara", lga: "Gusau", region: "North West", population: 682700, populationYear: 2025, growthRatePercent: 2.0, zipCode: "860001", isStateCapital: true, rank: 29, costOfLivingIndex: 71, safetyIndex: 64, climate: { tempHighC: 35, tempLowC: 18, rainySeasonMonths: "May - September" }, schoolRating: 5.7, description: "A state capital in Nigeria's northwest known for agriculture, particularly groundnut and cotton." },
  { slug: "calabar-cross-river", name: "Calabar", stateName: "Cross River", stateSlug: "cross-river", lga: "Calabar Municipal", region: "South South", population: 673427, populationYear: 2025, growthRatePercent: 2.5, zipCode: "540001", isStateCapital: true, rank: 30, costOfLivingIndex: 94, safetyIndex: 86, climate: { tempHighC: 30, tempLowC: 23, rainySeasonMonths: "March - November" }, schoolRating: 7.3, description: "Widely regarded as one of Nigeria's cleanest and most tourist-friendly cities, host of the annual Calabar Carnival." },
  { slug: "osogbo-osun", name: "Osogbo", stateName: "Osun", stateSlug: "osun", lga: "Osogbo", region: "South West", population: 645000, populationYear: 2025, growthRatePercent: 2.2, zipCode: "230001", isStateCapital: true, rank: 31, costOfLivingIndex: 80, safetyIndex: 79, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.6, description: "A state capital famed for the UNESCO-listed Osun-Osogbo sacred grove." },
  { slug: "yenagoa-bayelsa", name: "Yenagoa", stateName: "Bayelsa", stateSlug: "bayelsa", lga: "Yenagoa", region: "South South", population: 586393, populationYear: 2025, growthRatePercent: 3.1, zipCode: "561001", isStateCapital: true, rank: 32, costOfLivingIndex: 99, safetyIndex: 70, climate: { tempHighC: 30, tempLowC: 23, rainySeasonMonths: "March - November" }, schoolRating: 6.4, description: "A riverine state capital in the heart of the Niger Delta, built up rapidly since 1996." },
  { slug: "katsina-katsina", name: "Katsina", stateName: "Katsina", stateSlug: "katsina", lga: "Katsina", region: "North West", population: 565000, populationYear: 2025, growthRatePercent: 2.0, zipCode: "820001", isStateCapital: true, rank: 33, costOfLivingIndex: 71, safetyIndex: 73, climate: { tempHighC: 36, tempLowC: 17, rainySeasonMonths: "June - September" }, schoolRating: 5.9, description: "A historic Hausa city with centuries-old city walls and a strong trading tradition." },
  { slug: "minna-niger", name: "Minna", stateName: "Niger", stateSlug: "niger", lga: "Chanchaga", region: "North Central", population: 552407, populationYear: 2025, growthRatePercent: 2.4, zipCode: "920001", isStateCapital: true, rank: 34, costOfLivingIndex: 76, safetyIndex: 80, climate: { tempHighC: 33, tempLowC: 20, rainySeasonMonths: "April - October" }, schoolRating: 6.5, description: "A rocky-outcrop state capital roughly two hours from Abuja, popular with commuters." },
  { slug: "okene-kogi", name: "Okene", stateName: "Kogi", stateSlug: "kogi", lga: "Okene", region: "North Central", population: 546000, populationYear: 2025, growthRatePercent: 2.0, zipCode: "270001", isStateCapital: false, rank: 35, costOfLivingIndex: 74, safetyIndex: 76, climate: { tempHighC: 33, tempLowC: 21, rainySeasonMonths: "April - October" }, schoolRating: 6.1, description: "A hilly commercial town known for marble and cement production." },
  { slug: "makurdi-benue", name: "Makurdi", stateName: "Benue", stateSlug: "benue", lga: "Makurdi", region: "North Central", population: 517342, populationYear: 2025, growthRatePercent: 2.3, zipCode: "970001", isStateCapital: true, rank: 36, costOfLivingIndex: 75, safetyIndex: 75, climate: { tempHighC: 33, tempLowC: 21, rainySeasonMonths: "April - October" }, schoolRating: 6.4, description: "A riverside state capital on the Benue River, an agricultural trading center known as the 'Food Basket of the Nation'." },
  { slug: "ondo-ondo", name: "Ondo", stateName: "Ondo", stateSlug: "ondo", lga: "Ondo West", region: "South West", population: 510000, populationYear: 2025, growthRatePercent: 1.9, zipCode: "351001", isStateCapital: false, rank: 37, costOfLivingIndex: 79, safetyIndex: 80, climate: { tempHighC: 30, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.7, description: "A historic Yoruba town in the cocoa belt, the former seat of the Ondo Kingdom." },
  { slug: "lafia-nasarawa", name: "Lafia", stateName: "Nasarawa", stateSlug: "nasarawa", lga: "Lafia", region: "North Central", population: 509300, populationYear: 2025, growthRatePercent: 2.5, zipCode: "962001", isStateCapital: true, rank: 38, costOfLivingIndex: 77, safetyIndex: 78, climate: { tempHighC: 33, tempLowC: 20, rainySeasonMonths: "April - October" }, schoolRating: 6.3, description: "A growing state capital near Abuja, known for sesame and other agricultural exports." },
  { slug: "ife-osun", name: "Ife", stateName: "Osun", stateSlug: "osun", lga: "Ife Central", region: "South West", population: 492000, populationYear: 2025, growthRatePercent: 2.0, zipCode: "220001", isStateCapital: false, rank: 39, costOfLivingIndex: 81, safetyIndex: 80, climate: { tempHighC: 30, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 7.2, description: "One of the oldest Yoruba cities, regarded as a cradle of Yoruba civilization and home to Obafemi Awolowo University." },
  { slug: "awka-anambra", name: "Awka", stateName: "Anambra", stateSlug: "anambra", lga: "Awka South", region: "South East", population: 301000, populationYear: 2025, growthRatePercent: 3.0, zipCode: "420110", isStateCapital: true, rank: 40, costOfLivingIndex: 90, safetyIndex: 79, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.8, description: "Anambra's state capital, a growing administrative and education center." },
  { slug: "asaba-delta", name: "Asaba", stateName: "Delta", stateSlug: "delta", lga: "Oshimili South", region: "South South", population: 225000, populationYear: 2025, growthRatePercent: 3.3, zipCode: "320001", isStateCapital: true, rank: 41, costOfLivingIndex: 96, safetyIndex: 79, climate: { tempHighC: 31, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.9, description: "Delta's state capital on the Niger River, opposite Onitsha, with a fast-growing residential market." },
  { slug: "ado-ekiti-ekiti", name: "Ado-Ekiti", stateName: "Ekiti", stateSlug: "ekiti", lga: "Ado Ekiti", region: "South West", population: 440000, populationYear: 2025, growthRatePercent: 2.1, zipCode: "360001", isStateCapital: true, rank: 42, costOfLivingIndex: 79, safetyIndex: 84, climate: { tempHighC: 30, tempLowC: 21, rainySeasonMonths: "April - October" }, schoolRating: 7.4, description: "A hilly state capital widely regarded as one of Nigeria's safest and most education-focused cities." },
  { slug: "abakaliki-ebonyi", name: "Abakaliki", stateName: "Ebonyi", stateSlug: "ebonyi", lga: "Abakaliki", region: "South East", population: 200000, populationYear: 2025, growthRatePercent: 2.2, zipCode: "840001", isStateCapital: true, rank: 43, costOfLivingIndex: 75, safetyIndex: 82, climate: { tempHighC: 31, tempLowC: 22, rainySeasonMonths: "April - October" }, schoolRating: 6.5, description: "Ebonyi's state capital, known as Nigeria's leading rice-producing hub." },
  { slug: "gombe-gombe", name: "Gombe", stateName: "Gombe", stateSlug: "gombe", lga: "Gombe", region: "North East", population: 265000, populationYear: 2025, growthRatePercent: 2.4, zipCode: "760001", isStateCapital: true, rank: 44, costOfLivingIndex: 73, safetyIndex: 74, climate: { tempHighC: 35, tempLowC: 19, rainySeasonMonths: "May - September" }, schoolRating: 6.2, description: "A growing state capital known as the 'Jewel of the Savannah'." },
  { slug: "dutse-jigawa", name: "Dutse", stateName: "Jigawa", stateSlug: "jigawa", lga: "Dutse", region: "North West", population: 204000, populationYear: 2025, growthRatePercent: 2.6, zipCode: "720001", isStateCapital: true, rank: 45, costOfLivingIndex: 70, safetyIndex: 77, climate: { tempHighC: 35, tempLowC: 18, rainySeasonMonths: "May - September" }, schoolRating: 5.9, description: "Jigawa's purpose-built state capital, established after the state's creation in 1991." },
  { slug: "birnin-kebbi-kebbi", name: "Birnin Kebbi", stateName: "Kebbi", stateSlug: "kebbi", lga: "Birnin Kebbi", region: "North West", population: 157000, populationYear: 2025, growthRatePercent: 2.1, zipCode: "860001", isStateCapital: true, rank: 46, costOfLivingIndex: 69, safetyIndex: 76, climate: { tempHighC: 37, tempLowC: 17, rainySeasonMonths: "June - September" }, schoolRating: 5.8, description: "A state capital on the Sokoto River, a center for irrigation-based farming." },
  { slug: "jalingo-taraba", name: "Jalingo", stateName: "Taraba", stateSlug: "taraba", lga: "Jalingo", region: "North East", population: 149000, populationYear: 2025, growthRatePercent: 2.3, zipCode: "660001", isStateCapital: true, rank: 47, costOfLivingIndex: 72, safetyIndex: 75, climate: { tempHighC: 34, tempLowC: 19, rainySeasonMonths: "April - October" }, schoolRating: 6.0, description: "Taraba's state capital, a quiet town surrounded by scenic highlands." },
  { slug: "damaturu-yobe", name: "Damaturu", stateName: "Yobe", stateSlug: "yobe", lga: "Damaturu", region: "North East", population: 106000, populationYear: 2025, growthRatePercent: 1.9, zipCode: "620001", isStateCapital: true, rank: 48, costOfLivingIndex: 70, safetyIndex: 60, climate: { tempHighC: 37, tempLowC: 18, rainySeasonMonths: "June - September" }, schoolRating: 5.6, description: "Yobe's state capital in Nigeria's northeast, steadily rebuilding its local economy." },
  { slug: "okpoko-anambra", name: "Okpoko", stateName: "Anambra", stateSlug: "anambra", lga: "Ogbaru", region: "South East", population: 506000, populationYear: 2025, growthRatePercent: 2.7, zipCode: "420003", isStateCapital: false, rank: 49, costOfLivingIndex: 87, safetyIndex: 68, climate: { tempHighC: 31, tempLowC: 23, rainySeasonMonths: "April - October" }, schoolRating: 6.0, description: "A densely populated commercial satellite town bordering Onitsha." },
];

const majorCities: CityData[] = majorCitiesRaw.map((c) => ({
  ...c,
  ...(overrides[c.slug] ?? {}),
  tier: "major",
}));

/**
 * ~700 additional Nigerian LGAs (population/state/LGA only, no researched indices
 * yet), generated from the user-supplied LGA population dataset — see
 * src/data/nigeria-lgas.json and src/data/nigeria-lga-population-linked.csv.
 * A handful of LGA names exist in two different states (Nasarawa, Bassa, Obi,
 * Irepodun, Ifelodun) — both are kept as separate entries since the source data
 * didn't include a state column to disambiguate them; the state/population
 * pairing for those specific five names is our best estimate, not confirmed.
 */
const lgaCities: CityData[] = (lgaEntries as Omit<CityData, "rank">[]).map((c) => ({
  ...c,
  isStateCapital: false,
  rank: 0,
}));

export const cities: CityData[] = [...majorCities, ...lgaCities]
  .sort((a, b) => b.population - a.population)
  .map((c, i) => ({ ...c, rank: i + 1 }));

export function getCityBySlug(slug: string) {
  return cities.find((c) => c.slug === slug);
}

let liveCitiesCache: CityData[] | null = null;

/**
 * The "live" version of `cities` - tries Firestore first (so edits made in
 * the Firebase console show up here), falls back to the static bundled array
 * if Firestore is unconfigured or unreachable. Used by Server Components;
 * client components should keep using the plain `cities` export.
 */
export async function getCitiesLive(): Promise<CityData[]> {
  if (liveCitiesCache) return liveCitiesCache;
  const remote = await getFirestoreCollection<CityData>("cities");
  if (remote && remote.length > 0) {
    liveCitiesCache = remote;
    return remote;
  }
  return cities;
}

export async function getCityBySlugLive(slug: string): Promise<CityData | undefined> {
  const all = await getCitiesLive();
  return all.find((c) => c.slug === slug);
}

export async function getCitiesByStateLive(stateSlug: string): Promise<CityData[]> {
  const all = await getCitiesLive();
  return all.filter((c) => c.stateSlug === stateSlug).sort((a, b) => b.population - a.population);
}

export async function searchCitiesLive(query: string): Promise<CityData[]> {
  const all = await getCitiesLive();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (/^\d{3,6}$/.test(q)) {
    return all.filter((c) => c.zipCode?.startsWith(q));
  }
  return all
    .filter((c) => c.name.toLowerCase().includes(q) || c.stateName.toLowerCase().includes(q) || c.lga.toLowerCase().includes(q))
    .sort((a, b) => b.population - a.population);
}

export function getCitiesByState(stateSlug: string) {
  return cities.filter((c) => c.stateSlug === stateSlug).sort((a, b) => b.population - a.population);
}

/** Matches by exact/partial name, returns all matches (handles same-name-different-state disambiguation). */
export function findCitiesByName(name: string) {
  const normalized = name.trim().toLowerCase();
  return cities.filter((c) => c.name.toLowerCase() === normalized);
}

export function searchCities(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // ZIP code search
  if (/^\d{3,6}$/.test(q)) {
    return cities.filter((c) => c.zipCode?.startsWith(q));
  }
  return cities
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.stateName.toLowerCase().includes(q) ||
        c.lga.toLowerCase().includes(q)
    )
    .sort((a, b) => b.population - a.population);
}
