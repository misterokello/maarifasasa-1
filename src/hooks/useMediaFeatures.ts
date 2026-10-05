import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MediaFeature {
  id: string;
  title: string;
  article_url: string;
  outlet_name: string | null;
  outlet_logo_url: string | null;
  image_url: string | null;
  excerpt: string | null;
  published_at: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Active media features for the public homepage section. */
export const useMediaFeatures = () =>
  useQuery({
    queryKey: ["media-features", "public"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MediaFeature[]> => {
      const { data, error } = await supabase
        .from("media_features")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(12);

      if (error) throw error;
      return (data as MediaFeature[]) ?? [];
    },
  });
