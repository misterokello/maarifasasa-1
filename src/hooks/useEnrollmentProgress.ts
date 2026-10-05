import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches live Thinkific progress for a set of enrollment IDs.
 * Returns a { [enrollmentId]: percent } map. Falls back gracefully when
 * the Thinkific side is unreachable — callers should combine with the
 * `progress_percent` column on public.enrollments.
 */
export function useEnrollmentProgress(enrollmentIds: number[]) {
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const key = enrollmentIds.join(",");

  const refresh = useCallback(async () => {
    if (!enrollmentIds.length) {
      setProgress({});
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-progress", {
        body: { enrollment_ids: enrollmentIds },
      });
      if (error) throw error;
      setProgress(data?.progress || {});
    } catch (err) {
      console.error("[useEnrollmentProgress]", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) refresh();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { progress, loading, refresh };
}