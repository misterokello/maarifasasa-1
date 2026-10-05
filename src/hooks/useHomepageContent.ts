import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Featured courses for the homepage carousel: certificates, bootcamps and
 * programmes (incl. Talent Accelerator), newest first, capped at 8.
 */
export function useFeaturedCourses() {
  return useQuery({
    queryKey: ["homepage", "featured-courses"],
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .in("category", ["certificate", "bootcamp", "program"])
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

/**
 * Upcoming bootcamp cohorts (start_date in the future, soonest first).
 * Falls back to the newest bootcamps when nothing is dated ahead.
 */
export function useUpcomingCohorts() {
  return useQuery({
    queryKey: ["homepage", "upcoming-cohorts"],
    staleTime: FIVE_MINUTES,
    queryFn: async (): Promise<Product[]> => {
      const today = new Date().toISOString().slice(0, 10);

      const upcoming = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", "bootcamp")
        .not("start_date", "is", null)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(6);

      if (upcoming.error) throw upcoming.error;
      if ((upcoming.data ?? []).length > 0) return upcoming.data as Product[];

      const fallback = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", "bootcamp")
        .order("created_at", { ascending: false })
        .limit(6);

      if (fallback.error) throw fallback.error;
      return (fallback.data ?? []) as Product[];
    },
  });
}
