export const HERO_SLIDE_IDS = ["mission", "learners", "enterprise"] as const;

export type HeroSlideId = (typeof HERO_SLIDE_IDS)[number];

export const HERO_SLIDE_LABELS: Record<HeroSlideId, string> = {
  mission: "Mission — Building Africa's Digital Workforce Engine",
  learners: "Learners — Learn the skills. Start earning in months.",
  enterprise: "Enterprise — Hire job-ready African talent with proof",
};

export const DEFAULT_HERO_ORDER: HeroSlideId[] = ["learners", "mission", "enterprise"];

export const HERO_SETTING_KEY = "homepage_hero";

/** Coerce any stored value into a valid, complete, de-duplicated slide order. */
export function normalizeHeroOrder(input: unknown): HeroSlideId[] {
  const raw = Array.isArray(input) ? input : [];
  const seen = new Set<HeroSlideId>();
  const order: HeroSlideId[] = [];

  for (const value of raw) {
    if (typeof value !== "string") continue;
    const id = value as HeroSlideId;
    if (!HERO_SLIDE_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }

  for (const id of DEFAULT_HERO_ORDER) {
    if (!seen.has(id)) order.push(id);
  }

  return order;
}
