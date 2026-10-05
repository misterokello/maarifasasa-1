import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MailOpen, MousePointerClick, AlertTriangle, Users, Mail } from "lucide-react";
import { listCampaigns, campaignRate, type EmailCampaign } from "@/lib/engagement/api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { format, subDays } from "date-fns";
import ResendStatusCard from "./ResendStatusCard";

const KPI: React.FC<{ icon: any; label: string; value: string | number; sub?: string }> = ({ icon: Icon, label, value, sub }) => (
  <Card><CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="rounded-md bg-primary/10 p-2"><Icon className="h-4 w-4 text-primary" /></div>
    </div>
    <div className="mt-2 text-2xl font-semibold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
    {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
  </CardContent></Card>
);

const EngagementDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCampaigns().then(({ data }) => { setCampaigns((data as any) || []); setLoading(false); });
  }, []);

  const stats = useMemo(() => {
    const sent30 = campaigns.filter((c) => c.sent_at && new Date(c.sent_at).getTime() > Date.now() - 30 * 86400000);
    const recipients = sent30.reduce((s, c) => s + (c.recipient_count || 0), 0);
    const delivered = sent30.reduce((s, c) => s + (c.delivered_count || 0), 0);
    const opened = sent30.reduce((s, c) => s + (c.opened_count || 0), 0);
    const clicked = sent30.reduce((s, c) => s + (c.clicked_count || 0), 0);
    const bounced = sent30.reduce((s, c) => s + (c.bounced_count || 0), 0);
    const denom = delivered || sent30.reduce((s, c) => s + (c.sent_count || 0), 0);
    return {
      campaignsSent: sent30.length,
      recipients,
      avgOpen: campaignRate(opened, denom),
      avgClick: campaignRate(clicked, denom),
      bounceRate: campaignRate(bounced, sent30.reduce((s, c) => s + (c.sent_count || 0), 0)),
    };
  }, [campaigns]);

  // Trend (last 30 days) — aggregate by send day
  const trend = useMemo(() => {
    const map = new Map<string, { date: string; opens: number; clicks: number; bounces: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      map.set(d, { date: d, opens: 0, clicks: 0, bounces: 0 });
    }
    campaigns.forEach((c) => {
      if (!c.sent_at) return;
      const d = format(new Date(c.sent_at), "MMM d");
      const row = map.get(d);
      if (!row) return;
      row.opens += c.opened_count; row.clicks += c.clicked_count; row.bounces += c.bounced_count;
    });
    return Array.from(map.values());
  }, [campaigns]);

  const statusBars = useMemo(() => {
    const byStatus: Record<string, number> = {};
    campaigns.forEach((c) => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
    return Object.entries(byStatus).map(([status, count]) => ({ status, count }));
  }, [campaigns]);

  const top = useMemo(() => [...campaigns]
    .filter((c) => c.status === "sent")
    .sort((a, b) => {
      const ar = a.delivered_count ? a.opened_count / a.delivered_count : 0;
      const br = b.delivered_count ? b.opened_count / b.delivered_count : 0;
      return br - ar;
    }).slice(0, 5), [campaigns]);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI icon={Send} label="Campaigns sent (30d)" value={stats.campaignsSent} />
        <KPI icon={Users} label="Recipients reached" value={stats.recipients.toLocaleString()} />
        <KPI icon={MailOpen} label="Avg open rate" value={stats.avgOpen} />
        <KPI icon={MousePointerClick} label="Avg click rate" value={stats.avgClick} />
        <KPI icon={AlertTriangle} label="Bounce rate" value={stats.bounceRate} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Engagement trend — last 30 days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="opens" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bounces" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <ResendStatusCard />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Campaigns by status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top performing campaigns</CardTitle></CardHeader>
          <CardContent>
            {top.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sent campaigns yet.</p>
            ) : (
              <div className="space-y-2">
                {top.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.recipient_count.toLocaleString()} recipients</div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700">
                      {campaignRate(c.opened_count, c.delivered_count || c.sent_count)} open
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EngagementDashboard;