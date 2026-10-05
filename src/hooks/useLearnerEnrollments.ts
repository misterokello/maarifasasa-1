import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LearnerEnrollment {
  id: string;
  product_id: string | null;
  thinkific_course_id: string | null;
  thinkific_enrollment_id: number | null;
  payment_id: string | null;
  status: string;
  activated_at: string | null;
  completed_at: string | null;
  progress_percent: number | null;
  last_synced_at: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    thinkific_course_id: string | null;
    thinkific_course_url: string | null;
    duration: string | null;
  } | null;
}

/**
 * Phase 5: single source of truth for the learner dashboard.
 * Reads from public.enrollments (cloud-owned) with product info joined.
 * RLS scopes rows to auth.uid().
 */
export function useLearnerEnrollments(userId: string | undefined) {
  const [enrollments, setEnrollments] = useState<LearnerEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `id, product_id, thinkific_course_id, thinkific_enrollment_id, payment_id,
           status, activated_at, completed_at, progress_percent, last_synced_at,
           created_at, metadata,
           product:products(id, name, slug, category, thinkific_course_id, thinkific_course_url, duration)`,
        )
        .eq("user_id", userId)
        .order("activated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEnrollments((data as unknown as LearnerEnrollment[]) || []);
      setError(null);
    } catch (err: any) {
      console.error("[useLearnerEnrollments]", err);
      setError(err?.message || "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Pulls the learner's Thinkific enrollments (admin-provisioned, imported,
  // gifted seats) into public.enrollments so every course they can access
  // shows on the dashboard — not just cloud-checkout purchases.
  const syncFromThinkific = useCallback(async () => {
    if (!userId) return;
    try {
      await supabase.functions.invoke("thinkific-learner-sync", { body: {} });
    } catch (err) {
      // Non-fatal — we still render whatever is already in public.enrollments.
      console.warn("[useLearnerEnrollments] thinkific sync failed", err);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
      await syncFromThinkific();
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load, syncFromThinkific]);

  return { enrollments, loading, error, reload: load, syncFromThinkific };
}