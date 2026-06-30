export interface CitySection {
  slug: string;
  label: string;
  /** Sections backed by user-submittable directory listings (vs. stats/placeholder content). */
  isListing?: boolean;
}

export const citySections: CitySection[] = [
  { slug: "overview", label: "Overview" },
  { slug: "cost-of-living", label: "Cost of Living" },
  { slug: "crime", label: "Crime" },
  { slug: "apartments", label: "Apartments for Rent", isListing: true },
  { slug: "climate", label: "Climate" },
  { slug: "jobs", label: "Jobs", isListing: true },
  { slug: "weather", label: "Weather" },
  { slug: "school-ratings", label: "School Ratings", isListing: true },
  { slug: "education-stats", label: "Education Stats" },
  { slug: "economy", label: "Economy" },
  { slug: "health", label: "Health", isListing: true },
  { slug: "religion", label: "Religion" },
  { slug: "people-stats", label: "People Stats" },
  { slug: "politics-voting", label: "Politics & Voting" },
  { slug: "housing-stats", label: "Housing Stats", isListing: true },
  { slug: "commute-time", label: "Commute Time" },
  { slug: "internet", label: "Internet" },
  { slug: "electricity", label: "Electricity" },
  { slug: "transportation", label: "Transportation" },
  { slug: "hotels", label: "Hotel", isListing: true },
  { slug: "events", label: "Events", isListing: true },
  { slug: "road-condition", label: "Road Condition" },
  { slug: "market", label: "Market", isListing: true },
  { slug: "shopping-malls", label: "Shopping Malls", isListing: true },
  { slug: "police-stations", label: "Police Station", isListing: true },
  { slug: "rankings", label: "Rankings" },
  { slug: "reviews", label: "Reviews" },
  { slug: "interactive-map", label: "Interactive Map" },
];
