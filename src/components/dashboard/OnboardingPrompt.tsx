import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, ArrowRight, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { normalizeFieldDefinitions, computeOnboardingProgress } from "@/lib/onboardingFields";

interface Props {
  userId: string;
  profile: any;
}

export const OnboardingPrompt = ({ userId, profile }: Props) => {
  const navigate = useNavigate();
  const [percent, setPercent] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [celebrated, setCelebrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: defs, error } = await supabase
        .from("profile_field_definitions")
        .select("*")
        .eq("visible", true);
      if (error) {
        console.error("Profile field definitions load error:", error);
      }
      const fields = normalizeFieldDefinitions(defs);
      const p = computeOnboardingProgress(fields, profile);
      setCompletedCount(p.completed);
      setTotalCount(p.total);
      setMissing(p.missingRequired);
      setPercent(p.percent);

      if (p.isComplete && userId) {
        const key = `ms_onboarding_celebrated_${userId}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "1");
          setCelebrated(true);
          if (!firedRef.current) {
            firedRef.current = true;
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 }, disableForReducedMotion: true });
            setTimeout(
              () => confetti({ particleCount: 80, spread: 70, origin: { x: 0.75, y: 0.5 }, disableForReducedMotion: true }),
              250,
            );
          }
        }
      }
    })();
  }, [userId, profile]);

  if (percent === null) return null;
  if (percent === 100 && !celebrated) return null;
  if (dismissed) return null;

  if (percent === 100) {
    return (
      <Card className="mb-6 border-primary/40 bg-primary/5">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">Onboarding complete — congratulations! 🎉</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your profile is 100% complete. You're all set for personalised recommendations.
              </p>
              <Progress value={100} className="h-2" />
            </div>
          </div>
          <Button variant="outline" onClick={() => setDismissed(true)} className="md:self-center">
            Dismiss
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/40 bg-primary/5">
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Complete your onboarding</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Finish your profile to unlock personalised recommendations and full access.
            </p>
            <div className="flex items-center gap-3">
              <Progress value={percent} className="flex-1 h-2" />
              <span className="text-sm font-medium tabular-nums">{percent}%</span>
            </div>
            {totalCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {completedCount} of {totalCount} fields completed
                {missing.length > 0 && ` — still needed: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => navigate("/onboarding?next=/dashboard")} className="md:self-center gap-2">
          Complete Onboarding <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default OnboardingPrompt;