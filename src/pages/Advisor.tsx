import { useState } from "react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdvisorHero from "@/components/advisor/AdvisorHero";
import AdvisorWizard from "@/components/advisor/AdvisorWizard";
import ThinkingState from "@/components/advisor/ThinkingState";
import AdvisorResults from "@/components/advisor/AdvisorResults";
import { AdvisorAnswers, AdvisorProductBrief, Recommendation } from "@/types/advisor";

type Phase = "hero" | "wizard" | "thinking" | "results";

interface Result {
  recommendation: Recommendation;
  products: Record<string, AdvisorProductBrief>;
  answers: AdvisorAnswers;
  assessmentId?: string | null;
}

export default function Advisor() {
  const [phase, setPhase] = useState<Phase>("hero");
  const [result, setResult] = useState<Result | null>(null);

  const handleComplete = async (answers: AdvisorAnswers) => {
    setPhase("thinking");
    try {
      const { data, error } = await supabase.functions.invoke("advisor-recommend", {
        body: { answers },
      });
      if (error) {
        const msg = (error as any)?.context?.body
          ? JSON.parse((error as any).context.body)?.error
          : error.message;
        toast.error(msg || "Could not generate your pathway. Please try again.");
        setPhase("wizard");
        return;
      }
      if (!data?.recommendation) {
        toast.error("No recommendation returned. Please try again.");
        setPhase("wizard");
        return;
      }
      setResult({
        recommendation: data.recommendation,
        products: data.products || {},
        answers,
      });
      setPhase("results");
      // Create a draft assessment so chat transcripts are persisted per user
      void (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id ?? null;
          const email = session?.user?.email ?? null;
          const fullName = (session?.user?.user_metadata as any)?.full_name ?? null;
          const shareCode = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
            ? (crypto as any).randomUUID().slice(0, 12)
            : Math.random().toString(36).slice(2, 14);
          const { data: row, error: insErr } = await supabase
            .from("advisor_assessments")
            .insert({
              answers: answers as any,
              recommendation: data.recommendation as any,
              chat_history: [],
              share_code: shareCode,
              user_id: userId,
              email,
              full_name: fullName,
            })
            .select("id")
            .maybeSingle();
          if (insErr) {
            console.warn("draft assessment insert failed", insErr);
            return;
          }
          setResult((prev) => (prev ? { ...prev, assessmentId: row?.id ?? null } : prev));
        } catch (e) {
          console.warn("draft assessment error", e);
        }
      })();
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
      setPhase("wizard");
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Learning Pathway Advisor | Maarifasasa</title>
        <meta
          name="description"
          content="Get a free, personalised recommendation across Maarifasasa Certificates, Bootcamps, and the Talent Accelerator. Answer 7 quick questions and receive your pathway in 2 minutes."
        />
        <meta property="og:title" content="AI Learning Pathway Advisor | Maarifasasa" />
        <meta
          property="og:description"
          content="Find your perfect learning path in Africa's digital economy. Free AI-powered career guidance from Maarifasasa."
        />
      </Helmet>

      <div className="pt-20">
        {phase === "hero" && <AdvisorHero onStart={() => setPhase("wizard")} />}
        {phase === "wizard" && (
          <AdvisorWizard onComplete={handleComplete} onCancel={() => setPhase("hero")} />
        )}
        {phase === "thinking" && <ThinkingState />}
        {phase === "results" && result && (
          <AdvisorResults
            answers={result.answers}
            recommendation={result.recommendation}
            products={result.products}
            assessmentId={result.assessmentId ?? null}
            onRestart={() => {
              setResult(null);
              setPhase("wizard");
            }}
          />
        )}
      </div>
    </>
  );
}