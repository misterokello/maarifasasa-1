/**
 * Learner goal preferences.
 *
 * Visitors pick what they want to achieve; the homepage then filters and
 * reorders featured courses and pathway emphasis around those goals.
 * Stored locally so no account is needed to personalise the landing page.
 */
import React from "react";
import type { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";

export const LEARNER_GOALS = [
  {
    id: "get_a_job",
    label: "Get hired",
    description: "Land a digital job or internship",
    keywords: ["job", "career", "placement", "employ", "accelerator", "talent"],
    categories: ["program", "bootcamp"] as const,
  },
  {
    id: "freelance",
    label: "Freelance & earn online",
    description: "Work remotely for global clients",
    keywords: ["freelance", "remote", "upwork", "client", "virtual", "assistant", "bpo"],
    categories: ["certificate", "bootcamp"] as const,
  },
  {
    id: "tech_skills",
    label: "Learn tech skills",
    description: "Software, data, AI foundations",
    keywords: ["software", "web", "data", "ai", "python", "develop", "code", "analytics"],
    categories: ["bootcamp", "certificate"] as const,
  },
  {
    id: "marketing",
    label: "Digital marketing",
    description: "Social media, ads, content, brand",
    keywords: ["marketing", "social", "content", "brand", "seo", "ads", "design"],
    categories: ["certificate", "bootcamp"] as const,
  },
  {
    id: "business",
    label: "Grow a business",
    description: "Entrepreneurship, e-commerce, fintech",
    keywords: ["business", "entrepreneur", "commerce", "fintech", "agri", "enterprise"],
    categories: ["program", "certificate"] as const,
  },
  {
    id: "certify",
    label: "Get certified fast",
    description: "Short, recognised certificates",
    keywords: ["certificate", "short", "intro", "foundation"],
    categories: ["certificate"] as const,
  },
] as const;

export type LearnerGoalId = (typeof LEARNER_GOALS)[number]["id"];

const STORAGE_KEY = "ms_learner_goals";
const EVENT = "ms:learner-goals";

export function getLearnerGoals(): LearnerGoalId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const valid = LEARNER_GOALS.map((g) => g.id) as string[];
    return parsed.filter((id): id is LearnerGoalId => typeof id === "string" && valid.includes(id));
  } catch {
    return [];
  }
}

export function setLearnerGoals(goals: LearnerGoalId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    /* storage may be unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: goals }));
}

const sanitise = (value: unknown): LearnerGoalId[] => {
  if (!Array.isArray(value)) return [];
  const valid = LEARNER_GOALS.map((g) => g.id) as string[];
  return value.filter((id): id is LearnerGoalId => typeof id === "string" && valid.includes(id));
};

/** Persist the goals on the signed-in learner's profile (best effort). */
async function saveGoalsToProfile(goals: LearnerGoalId[]) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("profiles").update({ learner_goals: goals }).eq("id", userId);
}

/** Read the goals stored on the signed-in learner's profile. */
async function loadGoalsFromProfile(): Promise<LearnerGoalId[] | null> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("learner_goals")
    .eq("id", userId)
    .maybeSingle();
  return sanitise(profile?.learner_goals);
}

/**
 * React binding that stays in sync across components on the page, and — for
 * signed-in learners — across sessions and devices via their profile.
 */
export function useLearnerGoals(): [LearnerGoalId[], (goals: LearnerGoalId[]) => void] {
  const [goals, setGoals] = React.useState<LearnerGoalId[]>(() => getLearnerGoals());

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LearnerGoalId[]>).detail;
      setGoals(Array.isArray(detail) ? detail : getLearnerGoals());
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  // Hydrate from the profile on return visits; local picks made while signed
  // out win and are pushed up to the profile instead.
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const remote = await loadGoalsFromProfile();
        if (!active || remote === null) return;
        const local = getLearnerGoals();
        if (local.length > 0) {
          if (local.join(",") !== remote.join(",")) await saveGoalsToProfile(local);
          return;
        }
        if (remote.length > 0) setLearnerGoals(remote);
      } catch {
        /* personalisation is non-critical */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const update = React.useCallback((next: LearnerGoalId[]) => {
    setLearnerGoals(next);
    void saveGoalsToProfile(next).catch(() => undefined);
  }, []);

  return [goals, update];
}

const scoreProduct = (product: Product, goals: LearnerGoalId[]): number => {
  if (goals.length === 0) return 0;
  const haystack = `${product.name} ${product.description ?? ""}`.toLowerCase();

  return goals.reduce((score, goalId) => {
    const goal = LEARNER_GOALS.find((g) => g.id === goalId);
    if (!goal) return score;

    let s = score;
    if ((goal.categories as readonly string[]).includes(product.category)) s += 2;
    if (goalId === "get_a_job" && product.program_type === "talent_accelerator") s += 3;
    s += goal.keywords.filter((kw) => haystack.includes(kw)).length * 2;
    return s;
  }, 0);
};

/**
 * Reorders products so the best matches for the selected goals come first.
 * When `filter` is true, non-matching products are dropped (unless nothing
 * matches, in which case the original list is returned).
 */
export function personaliseProducts(
  products: Product[],
  goals: LearnerGoalId[],
  filter = true
): Product[] {
  if (goals.length === 0) return products;

  const scored = products.map((product, index) => ({
    product,
    index,
    score: scoreProduct(product, goals),
  }));

  const matches = scored.filter((s) => s.score > 0);
  const pool = filter && matches.length >= 3 ? matches : scored;

  return [...pool]
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((s) => s.product);
}

export const goalLabel = (id: LearnerGoalId) =>
  LEARNER_GOALS.find((g) => g.id === id)?.label ?? id;
