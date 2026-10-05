import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import AdvisorResults from "@/components/advisor/AdvisorResults";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import { AdvisorAnswers, AdvisorProductBrief, Recommendation } from "@/types/advisor";

export default function AdvisorResult() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    answers: AdvisorAnswers;
    recommendation: Recommendation;
    products: Record<string, AdvisorProductBrief>;
    fullName?: string | null;
    email?: string | null;
    assessmentId?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: rows, error: e } = await supabase
        .rpc("get_assessment_by_share_code", { _code: code });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (e || !row) {
        setError("This pathway link doesn't exist or has expired.");
        setLoading(false);
        return;
      }
      const rec = row.recommendation as any;
      const products = (rec?._products as Record<string, AdvisorProductBrief>) || {};
      const cleanRec = { ...rec };
      delete cleanRec._products;
      setData({
        answers: row.answers as unknown as AdvisorAnswers,
        recommendation: cleanRec as unknown as Recommendation,
        products,
        fullName: (row as any).full_name,
        email: (row as any).email,
        assessmentId: (row as any).id,
      });
      setLoading(false);
    })();
  }, [code]);

  return (
    <>
      <Helmet>
        <title>A Maarifasasa Learning Pathway</title>
        <meta name="description" content="A personalised AI-generated learning pathway from Maarifasasa." />
      </Helmet>
      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-4 pt-8 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/advisor"><ArrowLeft className="w-4 h-4 mr-1" /> Take your own assessment</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/advisor"><Sparkles className="w-4 h-4 mr-1" /> Find my path</Link>
          </Button>
        </div>

        {loading && (
          <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
            Loading pathway...
          </div>
        )}
        {error && (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
                <Link to="/advisor">Take the assessment</Link>
              </Button>
            </div>
          </div>
        )}
        {data && (
          <AdvisorResults
            answers={data.answers}
            recommendation={data.recommendation}
            products={data.products}
            hideSave
            assessmentId={data.assessmentId}
            fullName={data.fullName}
            email={data.email}
            shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
          />
        )}
      </div>
    </>
  );
}