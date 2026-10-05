import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ms_advisor_session";

export function getAdvisorSessionId(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = `as_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return `as_${Date.now().toString(36)}`;
  }
}

export type AdvisorEventType =
  | "hero_view"
  | "wizard_start"
  | "wizard_step"
  | "wizard_complete"
  | "recommendation_viewed"
  | "alternative_clicked"
  | "enroll_clicked"
  | "pdf_downloaded"
  | "save_clicked"
  | "save_completed"
  | "share_copied"
  | "mentor_call_requested"
  | "chat_message_sent"
  | "chat_message_received"
  | "result_viewed_shared";

export interface TrackOptions {
  assessmentId?: string | null;
  productSlug?: string | null;
  stepIndex?: number | null;
  metadata?: Record<string, unknown>;
}

export async function trackAdvisor(eventType: AdvisorEventType, opts: TrackOptions = {}): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("advisor_events").insert({
      event_type: eventType,
      assessment_id: opts.assessmentId ?? null,
      user_id: session?.user?.id ?? null,
      session_id: getAdvisorSessionId(),
      product_slug: opts.productSlug ?? null,
      step_index: opts.stepIndex ?? null,
      metadata: (opts.metadata as any) ?? {},
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      referrer: typeof document !== "undefined" ? document.referrer.slice(0, 500) : null,
    });
  } catch (e) {
    // Analytics must never break UX
    console.warn("trackAdvisor failed", e);
  }
}
