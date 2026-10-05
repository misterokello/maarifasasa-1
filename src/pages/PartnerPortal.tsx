import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PartnerPortalPanel from "@/components/partner/PartnerPortalPanel";

const PartnerPortal = () => {
  const { session, isReady } = useAuth();

  return (
    <>
      <Helmet>
        <title>Partner Portal | Maarifasasa Referrals</title>
        <meta name="description" content="Track clicks, signups, sales and commission from your Maarifasasa referral code." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container max-w-3xl mx-auto px-4 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Partner portal</h1>
            <p className="text-muted-foreground mt-1">
              Your referral codes and the results they've driven.
            </p>
          </div>

          {!isReady ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !session?.user ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-muted-foreground">Sign in to view your referral performance.</p>
                <Button asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PartnerPortalPanel userId={session.user.id} />
          )}
        </div>
      </div>
    </>
  );
};

export default PartnerPortal;
