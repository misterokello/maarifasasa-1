import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const THINKIFIC_SIGNIN_URL = "https://maarifasasa.thinkific.com/users/sign_in";

export interface LaunchError {
  message: string;
  fallbackUrl: string;
}

/**
 * Phase 6 — SSO course launch.
 *
 * Opens a placeholder tab synchronously (to bypass popup blockers), then
 * calls the `thinkific-launch` edge function which mints a fresh express
 * sign-in URL scoped to the caller. If minting fails we close the blank
 * tab, surface a structured error state that callers can render inline
 * (with a Retry button), and expose an `openFallback` escape hatch so
 * learners can still reach the sign-in page manually.
 */
export function useCourseLaunch() {
  const [launching, setLaunching] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, LaunchError>>({});

  const clearError = useCallback((enrollmentId: string) => {
    setErrors((prev) => {
      if (!prev[enrollmentId]) return prev;
      const next = { ...prev };
      delete next[enrollmentId];
      return next;
    });
  }, []);

  const launch = useCallback(
    async (enrollmentId: string, fallbackUrl?: string | null) => {
      setLaunching(enrollmentId);
      clearError(enrollmentId);
      // Open synchronously so browsers don't block the popup after the async call.
      // NOTE: do NOT pass "noopener" — window.open() returns null in that case and
      // the opened tab stays stuck on about:blank forever.
      const tab = window.open("about:blank", "_blank");
      try {
        if (tab) tab.opener = null;
      } catch {
        /* noop */
      }
      const fallback = fallbackUrl || THINKIFIC_SIGNIN_URL;
      try {
        const { data, error } = await supabase.functions.invoke("thinkific-launch", {
          body: { enrollment_id: enrollmentId },
        });
        if (error) throw error;
        const url = (data?.url as string) || null;
        if (!url) throw new Error("No sign-in URL returned");
        if (tab) tab.location.href = url;
        else window.location.href = url; // popup blocked — navigate in place
        if (data && data.sso === false && data.pending) {
          toast.info("Your access is still finalizing — opening the sign-in page.");
        }
      } catch (err: any) {
        console.error("[useCourseLaunch]", err);
        // Close the blank tab so the learner isn't left staring at about:blank.
        try {
          tab?.close();
        } catch {
          /* noop */
        }
        const message =
          typeof err?.message === "string" && err.message
            ? err.message
            : "Couldn't create a one-tap sign-in link.";
        setErrors((prev) => ({
          ...prev,
          [enrollmentId]: { message, fallbackUrl: fallback },
        }));
        toast.error("Couldn't open your course", {
          description: message,
          action: {
            label: "Retry",
            onClick: () => launch(enrollmentId, fallbackUrl),
          },
        });
      } finally {
        setLaunching(null);
      }
    },
    [clearError],
  );

  const openFallback = useCallback(
    (enrollmentId: string) => {
      const info = errors[enrollmentId];
      const url = info?.fallbackUrl || THINKIFIC_SIGNIN_URL;
      window.open(url, "_blank", "noopener,noreferrer");
      clearError(enrollmentId);
    },
    [errors, clearError],
  );

  return { launch, launching, errors, clearError, openFallback };
}