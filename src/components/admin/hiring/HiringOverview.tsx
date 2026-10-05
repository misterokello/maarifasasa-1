import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, CheckCircle2, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Counts = {
  openRoles: number;
  totalApplications: number;
  thisMonth: number;
  offerAccepted: number;
  byStatus: Record<string, number>;
};

const HiringOverview = () => {
  const [c, setC] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      const startMonth = new Date();
      startMonth.setDate(1);
      startMonth.setHours(0, 0, 0, 0);

      const [{ count: openRoles }, { count: totalApps }, { count: thisMonth }, { data: byStatusData }, { count: accepted }] = await Promise.all([
        supabase.from("job_postings").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("job_applications").select("id", { count: "exact", head: true }),
        supabase
          .from("job_applications")
          .select("id", { count: "exact", head: true })
          .gte("submitted_at", startMonth.toISOString()),
        supabase.from("job_applications").select("status"),
        supabase.from("offer_letters").select("id", { count: "exact", head: true }).eq("status", "accepted"),
      ]);

      const byStatus: Record<string, number> = {};
      (byStatusData || []).forEach((r: any) => {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      });
      setC({
        openRoles: openRoles || 0,
        totalApplications: totalApps || 0,
        thisMonth: thisMonth || 0,
        offerAccepted: accepted || 0,
        byStatus,
      });
    })();
  }, []);

  if (!c) return <div className="text-sm text-muted-foreground">Loading hiring snapshot…</div>;

  const tiles = [
    { label: "Open roles", value: c.openRoles, icon: Briefcase },
    { label: "Total applications", value: c.totalApplications, icon: Users },
    { label: "Applications this month", value: c.thisMonth, icon: Clock },
    { label: "Offers accepted", value: c.offerAccepted, icon: CheckCircle2 },
  ];

  const funnel = ["new", "screening", "shortlisted", "interview", "assessment", "reference_check", "offer", "hired"]
    .map((s) => ({ stage: s.replace(/_/g, " "), count: c.byStatus[s] || 0 }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</p>
                <p className="text-2xl font-semibold mt-1">{t.value.toLocaleString()}</p>
              </div>
              <t.icon className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Pipeline funnel</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HiringOverview;