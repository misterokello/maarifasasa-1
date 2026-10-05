import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const THINKIFIC_SITE_URL = "https://maarifasasa.thinkific.com";
const THINKIFIC_SIGNIN_URL = `${THINKIFIC_SITE_URL}/users/sign_in`;
const THINKIFIC_DASHBOARD_URL = `${THINKIFIC_SITE_URL}/enrollments`;

type Target = "dashboard" | "account";

/**
 * Seamless (SSO-like) entry into the Thinkific LMS.
 *
 * Both buttons mint a fresh express sign-in URL through the
 * `thinkific-user-provision` edge function, which is idempotent: it creates
 * the learner's Thinkific account on demand if signup-time provisioning was
 * missed, then returns a one-tap sign-in link deep-linked to `return_to`.
 * If minting fails we fall back to the normal Thinkific sign-in page so the
 * learner is never stuck.
 */
export const ThinkificAccess = () => {
  const [busy, setBusy] = useState<Target | null>(null);

  const open = useCallback(async (target: Target) => {
    setBusy(target);
    const returnTo = target === "dashboard" ? THINKIFIC_DASHBOARD_URL : `${THINKIFIC_SITE_URL}/account`;
    // Open synchronously so the browser doesn't treat this as a blocked popup.
    // NOTE: do NOT pass "noopener" — window.open() then returns null and the
    // blank tab can never be navigated (learner is left on about:blank).
    const tab = window.open("about:blank", "_blank");
    try {
      if (tab) tab.opener = null;
    } catch { /* noop */ }
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-user-provision", {
        body: { return_to: returnTo },
      });
      if (error) throw error;
      const url = (data?.express_sign_in_url as string) || returnTo;
      if (!data?.express_sign_in_url) {
        toast.info("Opening your learning platform — you may need to sign in once.");
      }
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      console.error("[ThinkificAccess]", err);
      if (tab) tab.location.href = THINKIFIC_SIGNIN_URL;
      toast.error("Couldn't create a one-tap sign-in link", {
        description: "We opened the sign-in page instead.",
      });
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Access Your Learning Platform</h3>
              <p className="text-sm text-muted-foreground">
                One tap signs you straight into Maarifasasa Academy — no extra password needed.
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => open("account")}
              disabled={busy !== null}
              className="gap-2"
            >
              {busy === "account" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Access Learning Account
            </Button>
            <Button onClick={() => open("dashboard")} disabled={busy !== null} className="gap-2">
              {busy === "dashboard" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              My Learning Dashboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
