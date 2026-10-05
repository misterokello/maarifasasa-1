import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Save, MessageCircle, Repeat, Download, Video } from "lucide-react";
import RecommendationCard from "./RecommendationCard";
import AlternativeCard from "./AlternativeCard";
import PathwayTimeline from "./PathwayTimeline";
import AdvisorChat from "./AdvisorChat";
import SaveResultDialog from "./SaveResultDialog";
import MentorCallDialog from "./MentorCallDialog";
import { AdvisorAnswers, Recommendation, AdvisorProductBrief } from "@/types/advisor";
import { downloadAdvisorPdf } from "@/lib/advisorPdf";
import { toast } from "@/hooks/use-toast";
import { trackAdvisor } from "@/lib/advisor/analytics";

interface Props {
  answers: AdvisorAnswers;
  recommendation: Recommendation;
  products: Record<string, AdvisorProductBrief>;
  onRestart?: () => void;
  hideSave?: boolean;
  assessmentId?: string | null;
  fullName?: string | null;
  email?: string | null;
  shareUrl?: string;
}

export default function AdvisorResults({ answers, recommendation, products, onRestart, hideSave, assessmentId, fullName, email, shareUrl }: Props) {
  const [showChat, setShowChat] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showMentor, setShowMentor] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    trackAdvisor(hideSave ? "result_viewed_shared" : "recommendation_viewed", {
      assessmentId: assessmentId ?? null,
      productSlug: recommendation.primary?.product_slug ?? null,
      metadata: { fit_score: recommendation.primary?.fit_score },
    });
    const t = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.3 },
        colors: ["#6366F1", "#8B5CF6", "#14B8A6", "#F59E0B"],
      });
    }, 250);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const primaryProduct = products[recommendation.primary?.product_slug];

  const handleDownload = () => {
    try {
      setDownloading(true);
      trackAdvisor("pdf_downloaded", {
        assessmentId: assessmentId ?? null,
        productSlug: recommendation.primary?.product_slug ?? null,
      });
      downloadAdvisorPdf({
        fullName: fullName || undefined,
        recommendation,
        products,
        answers,
        shareUrl,
      });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Couldn't generate PDF", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-12 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {recommendation.no_strong_match && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="font-semibold text-amber-900 mb-1">We weren't able to find a strong match.</div>
            <p className="text-sm text-amber-900/90">{recommendation.no_match_guidance}</p>
          </div>
        )}

        <div className="mb-10">
          <p className="text-lg text-foreground leading-relaxed bg-card border rounded-xl p-5 shadow-sm">
            {recommendation.summary}
          </p>
        </div>

        <div className="mb-12">
          <RecommendationCard primary={recommendation.primary} product={primaryProduct} />
        </div>

        {recommendation.alternatives?.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Other paths to consider</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendation.alternatives.map((alt, i) => (
                <AlternativeCard key={i} alt={alt} product={products[alt.product_slug]} />
              ))}
            </div>
          </div>
        )}

        {recommendation.pathway?.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-2 text-foreground">Your 6–12 month roadmap</h3>
            <p className="text-muted-foreground mb-6">A realistic timeline based on your goal and time commitment.</p>
            <div className="bg-card border rounded-xl p-6 md:p-8 shadow-sm">
              <PathwayTimeline pathway={recommendation.pathway} products={products} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-10">
          {!hideSave && (
            <Button onClick={() => setShowSave(true)} variant="default" size="lg">
              <Save className="w-4 h-4 mr-2" /> Save & email me
            </Button>
          )}
          <Button
            onClick={() => setShowMentor(true)}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white"
          >
            <Video className="w-4 h-4 mr-2" /> Book a mentor call
          </Button>
          <Button onClick={handleDownload} variant="outline" size="lg" disabled={downloading}>
            <Download className="w-4 h-4 mr-2" /> {downloading ? "Preparing…" : "Download as PDF"}
          </Button>
          <Button onClick={() => setShowChat((s) => !s)} variant="outline" size="lg">
            <MessageCircle className="w-4 h-4 mr-2" /> {showChat ? "Hide" : "Refine with AI"}
          </Button>
          {onRestart && (
            <Button onClick={onRestart} variant="ghost" size="lg">
              <Repeat className="w-4 h-4 mr-2" /> Retake assessment
            </Button>
          )}
        </div>

        {showChat && (
          <div className="mb-10">
            <AdvisorChat answers={answers} recommendation={recommendation} products={products} assessmentId={assessmentId} />
          </div>
        )}
      </div>

      {!hideSave && (
        <SaveResultDialog
          open={showSave}
          onOpenChange={setShowSave}
          answers={answers}
          recommendation={recommendation}
          products={products}
        />
      )}

      <MentorCallDialog
        open={showMentor}
        onOpenChange={setShowMentor}
        assessmentId={assessmentId}
        defaultName={fullName || undefined}
        defaultEmail={email || undefined}
        defaultTopic={primaryProduct ? `Pathway around ${primaryProduct.name}` : undefined}
      />
    </div>
  );
}