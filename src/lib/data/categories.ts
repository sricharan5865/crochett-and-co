export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  productCount: number;
  gradient: string;
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Crochet Bouquets",
    slug: "crochet-bouquets",
    description: "Handmade crochet flower bouquets that last forever",
    icon: "💐",
    productCount: 12,
    gradient: "from-rose-pink/20 to-lavender/20",
  },
  {
    id: "2",
    name: "Crochet Flowers",
    slug: "crochet-flowers",
    description: "Individual handmade flowers and arrangements",
    icon: "🌸",
    productCount: 18,
    gradient: "from-rose-pink/20 to-sunflower/20",
  },
  {
    id: "3",
    name: "Tulips",
    slug: "tulips",
    description: "Beautiful handmade crochet tulips in every color",
    icon: "🌷",
    productCount: 8,
    gradient: "from-rose-pink/30 to-cream/30",
  },
  {
    id: "4",
    name: "Roses",
    slug: "roses",
    description: "Classic handmade crochet roses for every occasion",
    icon: "🌹",
    productCount: 15,
    gradient: "from-rose-pink-dark/20 to-rose-pink/20",
  },
  {
    id: "5",
    name: "Sunflowers",
    slug: "sunflowers",
    description: "Cheerful handmade crochet sunflowers to brighten any day",
    icon: "🌻",
    productCount: 6,
    gradient: "from-sunflower/20 to-sunflower-light/20",
  },
  {
    id: "6",
    name: "Lavender Collections",
    slug: "lavender-collections",
    description: "Calming handmade crochet lavender arrangements",
    icon: "💜",
    productCount: 5,
    gradient: "from-lavender/20 to-lavender-light/20",
  },
  {
    id: "7",
    name: "Hair Clips",
    slug: "hair-clips",
    description: "Cute handmade crochet hair accessories",
    icon: "🎀",
    productCount: 10,
    gradient: "from-rose-pink/20 to-sunflower/20",
  },
  {
    id: "8",
    name: "Crochet Bags",
    slug: "crochet-bags",
    description: "Stylish handmade crochet bags for every occasion",
    icon: "👜",
    productCount: 7,
    gradient: "from-sage/20 to-cream/20",
  },
  {
    id: "9",
    name: "Keychains",
    slug: "keychains",
    description: "Adorable mini crochet keychains and accessories",
    icon: "🔑",
    productCount: 14,
    gradient: "from-sunflower/20 to-rose-pink/20",
  },
  {
    id: "10",
    name: "Gift Hampers",
    slug: "gift-hampers",
    description: "Curated gift hampers for every special occasion",
    icon: "🎁",
    productCount: 8,
    gradient: "from-lavender/20 to-rose-pink/20",
  },
  {
    id: "11",
    name: "Custom Orders",
    slug: "custom-orders",
    description: "Design your dream crochet item — we'll make it real",
    icon: "✨",
    productCount: 0,
    gradient: "from-sunflower/20 to-sage/20",
  },
  {
    id: "12",
    name: "Seasonal Collections",
    slug: "seasonal-collections",
    description: "Limited edition seasonal crochet collections",
    icon: "🍂",
    productCount: 4,
    gradient: "from-sunflower-dark/20 to-sage/20",
  },
];

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  gradient: string;
}

export const occasions: Occasion[] = [
  {
    id: "1",
    name: "Birthday Gifts",
    slug: "birthday",
    icon: "🎂",
    description: "Handmade gifts that make birthdays extra special",
    gradient: "from-rose-pink to-sunflower",
  },
  {
    id: "2",
    name: "Anniversary Gifts",
    slug: "anniversary",
    icon: "💕",
    description: "Celebrate your love with everlasting flowers",
    gradient: "from-rose-pink to-rose-pink-dark",
  },
  {
    id: "3",
    name: "Friendship Gifts",
    slug: "friendship",
    icon: "👯",
    description: "Show your bestie how much they mean to you",
    gradient: "from-sunflower to-sage",
  },
  {
    id: "4",
    name: "Valentine's Gifts",
    slug: "valentine",
    icon: "❤️",
    description: "Express your love with handmade crochet roses",
    gradient: "from-rose-pink-dark to-rose-pink",
  },
  {
    id: "5",
    name: "Graduation Gifts",
    slug: "graduation",
    icon: "🎓",
    description: "Celebrate their achievements with lasting memories",
    gradient: "from-lavender to-sage",
  },
  {
    id: "6",
    name: "Mother's Day Gifts",
    slug: "mothers-day",
    icon: "👩‍👧",
    description: "Tell Mom she's the best with handmade love",
    gradient: "from-lavender to-rose-pink",
  },
  {
    id: "7",
    name: "Surprise Gifts",
    slug: "surprise",
    icon: "🎉",
    description: "Just because — surprise them with something special",
    gradient: "from-sunflower to-lavender",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getOccasionBySlug(slug: string): Occasion | undefined {
  return occasions.find((o) => o.slug === slug);
}
