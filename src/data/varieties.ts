/**
 * 🌶️ Curated Chilli Variety Database
 */

export interface Variety {
  slug: string;
  name: string;
  scoville_min: number;
  scoville_max: number;
  days_to_maturity: number;
  care_tips: string;
  heat_level: 'Mild' | 'Medium' | 'Hot' | 'Extreme';
}

export const VARIETIES: Variety[] = [
  {
    slug: 'jalapeno',
    name: 'Jalapeño',
    scoville_min: 2500,
    scoville_max: 8000,
    days_to_maturity: 75,
    care_tips: 'Pick when they are dark green and about 3 inches long. Water regularly.',
    heat_level: 'Mild',
  },
  {
    slug: 'habanero',
    name: 'Habanero',
    scoville_min: 100000,
    scoville_max: 350000,
    days_to_maturity: 90,
    care_tips: 'Likes lots of heat. Wait until they turn bright orange for full flavor.',
    heat_level: 'Hot',
  },
  {
    slug: 'carolina-reaper',
    name: 'Carolina Reaper',
    scoville_min: 1400000,
    scoville_max: 2200000,
    days_to_maturity: 110,
    care_tips: 'Extremely hot! Handle with gloves. Needs long, warm season.',
    heat_level: 'Extreme',
  },
  {
    slug: 'cayenne',
    name: 'Cayenne',
    scoville_min: 30000,
    scoville_max: 50000,
    days_to_maturity: 80,
    care_tips: 'Great for drying. Long thin pods that turn bright red.',
    heat_level: 'Medium',
  },
  {
    slug: 'thai-birdseye',
    name: "Thai Bird's Eye",
    scoville_min: 50000,
    scoville_max: 100000,
    days_to_maturity: 85,
    care_tips: 'Very prolific. Small but packs a punch.',
    heat_level: 'Hot',
  },
  {
    slug: 'padrón',
    name: 'Padrón',
    scoville_min: 500,
    scoville_max: 2500,
    days_to_maturity: 65,
    care_tips: 'Some are hot, some are not. Harvest small and fry in olive oil.',
    heat_level: 'Mild',
  },
  {
    slug: 'ghost-pepper',
    name: 'Ghost Pepper (Bhut Jolokia)',
    scoville_min: 800000,
    scoville_max: 1041427,
    days_to_maturity: 100,
    care_tips: 'Slow to germinate. Needs high humidity and heat.',
    heat_level: 'Extreme',
  },
  {
    slug: 'serrano',
    name: 'Serrano',
    scoville_min: 10000,
    scoville_max: 23000,
    days_to_maturity: 80,
    care_tips: 'Thinner walls than Jalapeño, great for salsa verde.',
    heat_level: 'Medium',
  }
];

export function getVarietyBySlug(slug: string): Variety | undefined {
  return VARIETIES.find(v => v.slug === slug);
}
