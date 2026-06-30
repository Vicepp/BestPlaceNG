export type Region =
  | "South West"
  | "South East"
  | "South South"
  | "North Central"
  | "North West"
  | "North East";

export interface StateInfo {
  slug: string;
  name: string;
  capital: string;
  region: Region;
  zipPrefix: string;
}

export const states: StateInfo[] = [
  { slug: "abia", name: "Abia", capital: "Umuahia", region: "South East", zipPrefix: "440" },
  { slug: "adamawa", name: "Adamawa", capital: "Yola", region: "North East", zipPrefix: "640" },
  { slug: "akwa-ibom", name: "Akwa Ibom", capital: "Uyo", region: "South South", zipPrefix: "520" },
  { slug: "anambra", name: "Anambra", capital: "Awka", region: "South East", zipPrefix: "420" },
  { slug: "bauchi", name: "Bauchi", capital: "Bauchi", region: "North East", zipPrefix: "740" },
  { slug: "bayelsa", name: "Bayelsa", capital: "Yenagoa", region: "South South", zipPrefix: "561" },
  { slug: "benue", name: "Benue", capital: "Makurdi", region: "North Central", zipPrefix: "970" },
  { slug: "borno", name: "Borno", capital: "Maiduguri", region: "North East", zipPrefix: "600" },
  { slug: "cross-river", name: "Cross River", capital: "Calabar", region: "South South", zipPrefix: "540" },
  { slug: "delta", name: "Delta", capital: "Asaba", region: "South South", zipPrefix: "320" },
  { slug: "ebonyi", name: "Ebonyi", capital: "Abakaliki", region: "South East", zipPrefix: "840" },
  { slug: "edo", name: "Edo", capital: "Benin City", region: "South South", zipPrefix: "300" },
  { slug: "ekiti", name: "Ekiti", capital: "Ado-Ekiti", region: "South West", zipPrefix: "360" },
  { slug: "enugu", name: "Enugu", capital: "Enugu", region: "South East", zipPrefix: "400" },
  { slug: "fct", name: "Federal Capital Territory", capital: "Abuja", region: "North Central", zipPrefix: "900" },
  { slug: "gombe", name: "Gombe", capital: "Gombe", region: "North East", zipPrefix: "760" },
  { slug: "imo", name: "Imo", capital: "Owerri", region: "South East", zipPrefix: "460" },
  { slug: "jigawa", name: "Jigawa", capital: "Dutse", region: "North West", zipPrefix: "720" },
  { slug: "kaduna", name: "Kaduna", capital: "Kaduna", region: "North West", zipPrefix: "800" },
  { slug: "kano", name: "Kano", capital: "Kano", region: "North West", zipPrefix: "700" },
  { slug: "katsina", name: "Katsina", capital: "Katsina", region: "North West", zipPrefix: "820" },
  { slug: "kebbi", name: "Kebbi", capital: "Birnin Kebbi", region: "North West", zipPrefix: "860" },
  { slug: "kogi", name: "Kogi", capital: "Lokoja", region: "North Central", zipPrefix: "260" },
  { slug: "kwara", name: "Kwara", capital: "Ilorin", region: "North Central", zipPrefix: "240" },
  { slug: "lagos", name: "Lagos", capital: "Ikeja", region: "South West", zipPrefix: "100" },
  { slug: "nasarawa", name: "Nasarawa", capital: "Lafia", region: "North Central", zipPrefix: "962" },
  { slug: "niger", name: "Niger", capital: "Minna", region: "North Central", zipPrefix: "920" },
  { slug: "ogun", name: "Ogun", capital: "Abeokuta", region: "South West", zipPrefix: "110" },
  { slug: "ondo", name: "Ondo", capital: "Akure", region: "South West", zipPrefix: "340" },
  { slug: "osun", name: "Osun", capital: "Osogbo", region: "South West", zipPrefix: "230" },
  { slug: "oyo", name: "Oyo", capital: "Ibadan", region: "South West", zipPrefix: "200" },
  { slug: "plateau", name: "Plateau", capital: "Jos", region: "North Central", zipPrefix: "930" },
  { slug: "rivers", name: "Rivers", capital: "Port Harcourt", region: "South South", zipPrefix: "500" },
  { slug: "sokoto", name: "Sokoto", capital: "Sokoto", region: "North West", zipPrefix: "840" },
  { slug: "taraba", name: "Taraba", capital: "Jalingo", region: "North East", zipPrefix: "660" },
  { slug: "yobe", name: "Yobe", capital: "Damaturu", region: "North East", zipPrefix: "620" },
  { slug: "zamfara", name: "Zamfara", capital: "Gusau", region: "North West", zipPrefix: "860" },
];

export function getStateBySlug(slug: string) {
  return states.find((s) => s.slug === slug);
}
