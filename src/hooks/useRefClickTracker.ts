import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { captureAffiliateRefFromUrl, getAffiliateRef } from "@/lib/affiliateIntegration";
import { captureDiscountCodeFromUrl } from "@/lib/discountCodes";

/**
 * Global hook that runs on every page load:
 * 1. Captures `ref` from URL into cookie + localStorage + sessionStorage
 * 2. Fires a click-tracking call to the local affiliate-track edge function
 *    (deduped per session)
 */
export function useRefClickTracker() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Capture and persist ref from URL (cookie + localStorage + sessionStorage)
    captureAffiliateRefFromUrl();

    // Capture and persist `?dc=` discount/referral code + record the click
    captureDiscountCodeFromUrl();

    const code = searchParams.get("ref");
    if (!code) return;

    // Deduplicate local tracking per session
    const key = `ref_tracked_${code}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    supabase.functions.invoke("affiliate-track", { body: { code } });
  }, [searchParams]);
}
