import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HERO_ORDER,
  HERO_SETTING_KEY,
  normalizeHeroOrder,
  type HeroSlideId,
} from "@/lib/heroSlides";

export async function fetchHeroSlideOrder(): Promise<HeroSlideId[]> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("setting_key", HERO_SETTING_KEY)
    .maybeSingle();

  if (error) throw error;

  const value = (data?.value ?? null) as { order?: unknown } | null;
  return normalizeHeroOrder(value?.order);
}

export async function saveHeroSlideOrder(order: HeroSlideId[]) {
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { setting_key: HERO_SETTING_KEY, value: { order } },
      { onConflict: "setting_key" }
    );
  if (error) throw error;
}

export function useHeroSlideOrder() {
  return useQuery({
    queryKey: ["hero-slide-order"],
    queryFn: fetchHeroSlideOrder,
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_HERO_ORDER,
  });
}
