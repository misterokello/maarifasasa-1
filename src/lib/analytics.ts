/**
 * Lightweight, provider-agnostic analytics layer.
 *
 * Events are pushed to `window.dataLayer` (GTM/GA4 friendly) and forwarded to
 * gtag / PostHog when those are present on the page. Every event is enriched
 * with the visitor's active A/B experiment variants and selected learner goals
 * so the full learner/enterprise funnel can be segmented.
 */
import { getActiveVariants } from "@/lib/abTesting";
import { getLearnerGoals } from "@/lib/learnerPreferences";

type Props = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    posthog?: { capture?: (event: string, props?: Props) => void };
  }
}

const DEBUG_KEY = "ms_analytics_debug";

const baseContext = (): Props => {
  if (typeof window === "undefined") return {};
  return {
    page_path: window.location.pathname,
    page_search: window.location.search || undefined,
    experiments: getActiveVariants(),
    learner_goals: getLearnerGoals(),
  };
};

export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined") return;

  const payload = { event, ...baseContext(), ...props };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  try {
    window.gtag?.("event", event, payload);
    window.posthog?.capture?.(event, payload);
  } catch {
    /* analytics must never break the UI */
  }

  if (localStorage.getItem(DEBUG_KEY) === "1") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
  }
}

/** A click on any call-to-action. */
export function trackCta(params: {
  /** Stable id, e.g. "hero_primary" */
  id: string;
  label: string;
  /** Where the CTA lives, e.g. "hero", "featured_courses" */
  location: string;
  destination?: string;
  audience?: "learner" | "enterprise" | "affiliate";
  /** Funnel stage this CTA belongs to. */
  stage?: "awareness" | "consideration" | "intent" | "conversion";
  extra?: Props;
}) {
  const { extra, ...rest } = params;
  track("cta_click", { ...rest, ...(extra ?? {}) });
}

/** An enquiry / lead form submission (partner enquiry, demo request, etc.). */
export function trackEnquirySubmit(params: {
  form: string;
  audience: "learner" | "enterprise";
  status: "success" | "error";
  extra?: Props;
}) {
  const { extra, ...rest } = params;
  track("enquiry_submit", { ...rest, ...(extra ?? {}) });
}

export function trackFunnelStep(step: string, props: Props = {}) {
  track("funnel_step", { step, ...props });
}

export function trackPageView(path: string) {
  track("page_view", { page_path: path });
}
