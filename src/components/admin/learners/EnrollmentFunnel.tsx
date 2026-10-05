import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Row = { label: string; count: number; pct: number };

const DAYS = 30;

const EnrollmentFunnel = () => {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState(0);
  const [checkouts, setCheckouts] = useState(0);
  const [paid, setPaid] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);
  const [synced, setSynced] = useState(0);
  const [active, setActive] = useState(0);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();

    try {
      const [popupA, payAll, payPaid, enrAll, enrPending, enrActive] = await Promise.all([
        supabase.from("popup_analytics").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("payments").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .in("status", ["completed", "success", "paid"])
          .gte("created_at", since),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_sync")
          .gte("created_at", since),
        supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .in("status", ["active", "completed"])
          .gte("created_at", since),
      ]);

      if (popupA.error) throw popupA.error;
      setVisits(popupA.count || 0);
      setCheckouts(payAll.count || 0);
      setPaid(payPaid.count || 0);
      setPendingSync(enrPending.count || 0);
      setSynced((enrAll.count || 0) - (enrPending.count || 0));
      setActive(enrActive.count || 0);
    } catch (e: any) {
      toast.error(e.message || "Failed to load funnel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows: Row[] = useMemo(() => {
    const top = Math.max(visits, checkouts, 1);
    const raw = [
      { label: "Site visits (tracked popups)", count: visits },
      { label: "Checkout starts", count: checkouts },
      { label: "Paid", count: paid },
      { label: "Enrollment created", count: paid ? paid : 0 },
      { label: "Synced to academy", count: synced },
      { label: "Active or completed", count: active },
    ];
    return raw.map((r) => ({ ...r, pct: Math.round((r.count / top) * 100) }));
  }, [visits, checkouts, paid, synced, active]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Enrollment Funnel — last {DAYS} days
            </CardTitle>
            <CardDescription>Visits → Checkout → Paid → Synced → Active</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{r.label}</span>
                  <span className="text-muted-foreground">
                    {r.count.toLocaleString()} <span className="opacity-60">({r.pct}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}

            {pendingSync > 0 && (
              <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                <strong>{pendingSync}</strong> enrollment{pendingSync === 1 ? "" : "s"} still pending academy sync — check the Sync Queue tab.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnrollmentFunnel;