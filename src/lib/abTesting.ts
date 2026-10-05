/**
 * Tiny client-side A/B testing utility.
 *
 * Variants are assigned once per visitor (sticky in localStorage) so the
 * experience is stable across visits, and are attached to every analytics
 * event so conversion can be attributed per variant.
 */
import React from "react";
import { track } from "@/lib/analytics";

export const EXPERIMENTS = {
  hero_message: ["mission", "outcome"] as const,
  pathway_cta: ["browse", "urgency"] as const,
  final_cta: ["explore", "enrol"] as const,
};

export type ExperimentKey = keyof typeof EXPERIMENTS;
export type VariantOf<K extends ExperimentKey> = (typeof EXPERIMENTS)[K][number];

const STORAGE_KEY = "ms_experiments";

const readAll = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const writeAll = (value: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage may be unavailable */
  }
};

/** Forced variant via `?ab_hero_message=outcome` — handy for QA. */
const forcedVariant = (key: ExperimentKey): string | null => {
  if (typeof window === "undefined") return null;
  const forced = new URLSearchParams(window.location.search).get(`ab_${key}`);
  return forced && (EXPERIMENTS[key] as readonly string[]).includes(forced) ? forced : null;
};

export function getVariant<K extends ExperimentKey>(key: K): VariantOf<K> {
  const options = EXPERIMENTS[key] as readonly string[];
  const forced = forcedVariant(key);
  if (forced) return forced as VariantOf<K>;

  const all = readAll();
  const existing = all[key];
  if (existing && options.includes(existing)) return existing as VariantOf<K>;

  const assigned = options[Math.floor(Math.random() * options.length)];
  writeAll({ ...all, [key]: assigned });
  return assigned as VariantOf<K>;
}

/** All variants assigned so far — used to enrich analytics events. */
export function getActiveVariants(): Record<string, string> {
  const all = readAll();
  const out: Record<string, string> = {};
  (Object.keys(EXPERIMENTS) as ExperimentKey[]).forEach((key) => {
    const forced = forcedVariant(key);
    const value = forced ?? all[key];
    if (value) out[key] = value;
  });
  return out;
}

/** Assign (once) and report an experiment exposure for the current visitor. */
export function useExperiment<K extends ExperimentKey>(key: K): VariantOf<K> {
  const [variant] = React.useState<VariantOf<K>>(() => getVariant(key));

  React.useEffect(() => {
    track("experiment_view", { experiment: key, variant });
  }, [key, variant]);

  return variant;
}
