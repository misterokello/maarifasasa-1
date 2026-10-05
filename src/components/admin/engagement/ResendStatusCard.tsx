import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { fetchResendStatus } from "@/lib/engagement/api";

const ResendStatusCard: React.FC = () => {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchResendStatus>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchResendStatus().then(setStatus).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Resend account</span>
          <a href="https://resend.com/overview" target="_blank" rel="noreferrer" className="text-xs font-normal text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            Open dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {err && <p className="text-destructive">{err}</p>}
        {status && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Sent (30d)</div>
                <div className="text-xl font-semibold">{status.sentLast30.toLocaleString()}</div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Bounced (30d)</div>
                <div className="text-xl font-semibold">{status.bouncedLast30.toLocaleString()}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Verified sending domains</div>
              {status.domainError && <p className="text-xs text-destructive">{status.domainError}</p>}
              <div className="flex flex-wrap gap-1.5">
                {status.domains.length === 0 && !status.domainError && (
                  <span className="text-xs text-muted-foreground">Using shared <code>onboarding@resend.dev</code></span>
                )}
                {status.domains.map((d) => (
                  <Badge key={d.id} variant={d.status === "verified" ? "default" : "secondary"} className="gap-1">
                    {d.status === "verified" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground border-t pt-2">{status.notes}</p>
            <div className="flex gap-3 text-xs">
              <a href={status.docs.pricing} target="_blank" rel="noreferrer" className="text-primary hover:underline">View plans</a>
              <a href={status.docs.limits} target="_blank" rel="noreferrer" className="text-primary hover:underline">Rate limits</a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResendStatusCard;