export const TAXONOMY_CATEGORIES = [
  "profession",
  "sport",
  "fandom",
  "personality",
  "media",
  "lifestyle",
  "values",
] as const;

export type TaxonomyCategory = (typeof TAXONOMY_CATEGORIES)[number];

type TaxonomySeedEntry = {
  slug: string;
  label: string;
};

export const TAXONOMY: Record<TaxonomyCategory, TaxonomySeedEntry[]> = {
  profession: [
    { slug: "developer", label: "Developer" },
    { slug: "designer", label: "Designer" },
    { slug: "teacher", label: "Teacher" },
    { slug: "student", label: "Student" },
    { slug: "founder", label: "Founder" },
    { slug: "engineer", label: "Engineer" },
    { slug: "marketer", label: "Marketer" },
    { slug: "freelancer", label: "Freelancer" },
  ],
  sport: [
    { slug: "football", label: "Football" },
    { slug: "basketball", label: "Basketball" },
    { slug: "running", label: "Running" },
    { slug: "gym", label: "Gym" },
    { slug: "badminton", label: "Badminton" },
    { slug: "volleyball", label: "Volleyball" },
    { slug: "swimming", label: "Swimming" },
    { slug: "hiking", label: "Hiking" },
  ],
  fandom: [
    { slug: "cristiano-ronaldo", label: "Cristiano Ronaldo" },
    { slug: "lionel-messi", label: "Lionel Messi" },
    { slug: "real-madrid", label: "Real Madrid" },
    { slug: "barcelona", label: "Barcelona" },
    { slug: "marvel", label: "Marvel" },
    { slug: "dc", label: "DC" },
    { slug: "star-wars", label: "Star Wars" },
    { slug: "taylor-swift", label: "Taylor Swift" },
  ],
  personality: [
    { slug: "extrovert", label: "Extrovert" },
    { slug: "introvert", label: "Introvert" },
    { slug: "open-minded", label: "Open-Minded" },
    { slug: "ambitious", label: "Ambitious" },
    { slug: "calm", label: "Calm" },
    { slug: "curious", label: "Curious" },
    { slug: "creative", label: "Creative" },
    { slug: "empathetic", label: "Empathetic" },
  ],
  media: [
    { slug: "horror-movies", label: "Horror Movies" },
    { slug: "action-movies", label: "Action Movies" },
    { slug: "romance-movies", label: "Romance Movies" },
    { slug: "anime", label: "Anime" },
    { slug: "gaming", label: "Gaming" },
    { slug: "kdrama", label: "K-Drama" },
    { slug: "sci-fi", label: "Sci-Fi" },
    { slug: "podcasts", label: "Podcasts" },
  ],
  lifestyle: [
    { slug: "early-riser", label: "Early Riser" },
    { slug: "night-owl", label: "Night Owl" },
    { slug: "traveler", label: "Traveler" },
    { slug: "foodie", label: "Foodie" },
    { slug: "pet-lover", label: "Pet Lover" },
    { slug: "coffee-lover", label: "Coffee Lover" },
    { slug: "remote-worker", label: "Remote Worker" },
    { slug: "minimalist", label: "Minimalist" },
  ],
  values: [
    { slug: "family-first", label: "Family First" },
    { slug: "faith", label: "Faith" },
    { slug: "kindness", label: "Kindness" },
    { slug: "loyalty", label: "Loyalty" },
    { slug: "self-growth", label: "Self Growth" },
    { slug: "sustainability", label: "Sustainability" },
    { slug: "community", label: "Community" },
    { slug: "discipline", label: "Discipline" },
  ],
};

export type TaxonomyEntry = {
  slug: string;
  label: string;
  category: TaxonomyCategory;
};

export const TAXONOMY_ENTRIES: TaxonomyEntry[] = TAXONOMY_CATEGORIES.flatMap(
  (category) =>
    TAXONOMY[category].map((entry) => ({
      ...entry,
      category,
    })),
);

export const ALL_VOCABULARY_SLUGS = TAXONOMY_ENTRIES.map((entry) => entry.slug);

const taxonomyBySlug = new Map(
  TAXONOMY_ENTRIES.map((entry) => [entry.slug, entry] as const),
);

export const getTaxonomyEntry = (slug: string) => taxonomyBySlug.get(slug);
