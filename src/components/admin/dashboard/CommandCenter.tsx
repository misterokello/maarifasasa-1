import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Handshake,
  Megaphone,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { format, subDays, formatDistanceToNow, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import DashboardDateFilter, {
  DashboardRange,
  daysInRange,
  rangeLabel,
  resolveRange,
} from "./DashboardDateFilter";
import AlertsPanel, { DashboardAlert } from "./AlertsPanel";

const REFRESH = 60_000;

/* --------------------------- helpers --------------------------- */

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function fmtUSD(n: number) {
  return `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function fmtUGX(n: number) {
  return `UGX ${Math.round(n || 0).toLocaleString()}`;
}

/* --------------------------- KPI card --------------------------- */

type KpiProps = {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean } | null;
  accent: string; // tailwind text color class for icon
  bg: string; // tailwind bg class for icon
  to: string;
  spark?: number[];
  sparkColor?: string;
};

const Kpi: React.FC<KpiProps> = ({
  title,
  value,
  sub,
  icon,
  trend,
  accent,
  bg,
  to,
  spark,
  sparkColor = "hsl(var(--primary))",
}) => {
  const data = (spark || []).map((v, i) => ({ i, v }));
  return (
    <Link to={to} className="group">
      <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                {title}
              </p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 truncate">{value}</h3>
              {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  {trend.positive ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      trend.positive ? "text-success" : "text-destructive",
                    )}
                  >
                    {trend.positive ? "+" : ""}
                    {trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs prev</span>
                </div>
              )}
            </div>
            <div className={cn("p-2.5 rounded-xl shrink-0", bg)}>
              <div className={accent}>{icon}</div>
            </div>
          </div>
          {data.length > 1 && (
            <div className="h-10 -mx-1 mt-2 opacity-90">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={sparkColor}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

/* --------------------------- Module insight card --------------------------- */

type Metric = { label: string; value: string | number };
type ModuleCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
  to: string;
  metrics: Metric[];
  highlight?: string;
};

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  accent,
  bg,
  to,
  metrics,
  highlight,
}) => (
  <Link to={to} className="group">
    <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl", bg)}>
            <div className={accent}>{icon}</div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold">{title}</h3>
          {highlight && (
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {highlight}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-1">{description}</p>
        <div className="grid grid-cols-3 gap-2">
          {metrics.slice(0, 3).map((m) => (
            <div key={m.label} className="rounded-lg bg-muted/50 px-2 py-1.5">
              <div className="text-sm font-bold tabular-nums truncate">{m.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </Link>
);

/* --------------------------- Main --------------------------- */

const CommandCenter: React.FC = () => {
  const [range, setRange] = useState<DashboardRange>(resolveRange("30d"));

  // Effective window — null `from` means "all time"
  const now = new Date();
  const rangeTo = range.to ?? now;
  const inRange = (d: string | Date) => {
    if (!range.from) return true;
    const t = new Date(d).getTime();
    return t >= range.from.getTime() && t <= rangeTo.getTime();
  };
  const prevWindow = (() => {
    if (!range.from) return null;
    const span = rangeTo.getTime() - range.from.getTime();
    return { from: new Date(range.from.getTime() - span), to: range.from };
  })();
  const inPrev = (d: string | Date) => {
    if (!prevWindow) return false;
    const t = new Date(d).getTime();
    return t >= prevWindow.from.getTime() && t < prevWindow.to.getTime();
  };

  // -------- Payments (full) --------
  const { data: payments } = useQuery({
    queryKey: ["cc-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, currency, status, payment_method, created_at, product_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: REFRESH,
  });

  // -------- Products --------
  const { data: products } = useQuery({
    queryKey: ["cc-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, is_active, price_usd, price_ugx");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: REFRESH,
  });

  // -------- Affiliates --------
  const { data: affiliates } = useQuery({
    queryKey: ["cc-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("id, status, total_earnings, created_at");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: REFRESH,
  });
  const { data: affiliateConversions } = useQuery({
    queryKey: ["cc-affiliate-conv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_conversions")
        .select("id, order_amount, commission_amount, created_at");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: REFRESH,
  });

  // -------- Blog --------
  const { data: blog } = useQuery({
    queryKey: ["cc-blog"],
    queryFn: async () => {
      const [{ data: posts }, { count: comments }] = await Promise.all([
        supabase.from("blog_posts").select("id, views, published, title, slug, created_at").order("views", { ascending: false }),
        supabase.from("blog_comments").select("id", { count: "exact", head: true }),
      ]);
      return { posts: posts || [], comments: comments || 0 };
    },
    refetchInterval: REFRESH,
  });

  // -------- Advisor --------
  const { data: advisor } = useQuery({
    queryKey: ["cc-advisor"],
    queryFn: async () => {
      const [{ count: assess }, { data: events }, { count: calls }] = await Promise.all([
        supabase.from("advisor_assessments").select("id", { count: "exact", head: true }),
        supabase.from("advisor_events").select("event_type, created_at"),
        supabase.from("mentor_call_requests").select("id", { count: "exact", head: true }),
      ]);
      return { assess: assess || 0, events: events || [], calls: calls || 0 };
    },
    refetchInterval: REFRESH,
  });

  // -------- Engagement --------
  const { data: engagement } = useQuery({
    queryKey: ["cc-engagement"],
    queryFn: async () => {
      const [campaigns, audiences] = await Promise.all([
        supabase.from("email_campaigns").select("status, sent_count, delivered_count, opened_count, clicked_count, bounced_count, recipient_count"),
        supabase.from("email_audiences").select("id, member_count").eq("archived", false),
      ]);
      return { campaigns: campaigns.data || [], audiences: audiences.data || [] };
    },
    refetchInterval: REFRESH,
  });

  // -------- Forms / popups / profiles --------
  const { data: misc } = useQuery({
    queryKey: ["cc-misc-v2"],
    queryFn: async () => {
      const [{ data: tally }, { data: profiles }, { data: popups }, { data: popupEvents }] = await Promise.all([
        supabase.from("tally_submissions").select("id, created_at"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("popups").select("id, is_active"),
        supabase.from("popup_analytics").select("event_type, created_at"),
      ]);
      return {
        tally: tally || [],
        profiles: profiles || [],
        popups: popups || [],
        popupEvents: popupEvents || [],
      };
    },
    refetchInterval: REFRESH,
  });

  // Blog views per day (for range-scoped views metric)
  const { data: blogViews } = useQuery({
    queryKey: ["cc-blog-views"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_views")
        .select("view_date, view_count");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: REFRESH,
  });

  /* ---------- derived ---------- */

  const productById = useMemo(() => {
    const m: Record<string, { name: string; category: string }> = {};
    (products || []).forEach((p: any) => (m[p.id] = { name: p.name, category: p.category }));
    return m;
  }, [products]);

  // Payments scoped to selected range
  const paymentsInRange = useMemo(
    () => (payments || []).filter((p: any) => inRange(p.created_at)),
    [payments, range.from, range.to],
  );

  const pStats = useMemo(() => {
    const all = paymentsInRange;
    const success = all.filter((p) => p.status === "success");
    const pending = all.filter((p) => p.status === "pending");
    const failed = all.filter((p) => p.status === "failed");
    const usd = success.filter((p) => p.currency === "USD").reduce((s, p) => s + (p.amount || 0), 0);
    const ugx = success.filter((p) => p.currency === "UGX").reduce((s, p) => s + (p.amount || 0), 0);
    // amount stored as cents for USD, raw for UGX (matches existing dashboard /100 division)
    return {
      total: all.length,
      success: success.length,
      pending: pending.length,
      failed: failed.length,
      usd: usd / 100,
      ugx,
      successRate: pct(success.length, all.length),
    };
  }, [paymentsInRange]);

  // Build daily series across selected range (or last 90 days for "all time")
  const series = useMemo(() => {
    const start = range.from ?? subDays(rangeTo, 89);
    const end = rangeTo;
    const days = eachDayOfInterval({ start: startOfDay(start), end: endOfDay(end) });
    const useShort = days.length <= 14;
    const buckets = days.map((d) => ({
      date: format(d, "yyyy-MM-dd"),
      label: useShort ? format(d, "EEE") : format(d, "MMM d"),
      usd: 0,
      ugx: 0,
      success: 0,
      failed: 0,
      enrollments: 0,
      views: 0,
    }));
    const idx: Record<string, number> = {};
    buckets.forEach((b, i) => (idx[b.date] = i));
    (payments || []).forEach((p: any) => {
      const key = format(new Date(p.created_at), "yyyy-MM-dd");
      const i = idx[key];
      if (i == null) return;
      if (p.status === "success") {
        buckets[i].success += 1;
        buckets[i].enrollments += 1;
        if (p.currency === "USD") buckets[i].usd += (p.amount || 0) / 100;
        else if (p.currency === "UGX") buckets[i].ugx += p.amount || 0;
      } else if (p.status === "failed") buckets[i].failed += 1;
    });
    (blogViews || []).forEach((v: any) => {
      const i = idx[v.view_date];
      if (i != null) buckets[i].views += v.view_count || 0;
    });
    return buckets;
  }, [payments, blogViews, range.from, range.to]);

  // Previous-period compare for headline trends
  const periodStats = useMemo(() => {
    const f = (rows: any[]) => {
      const succ = rows.filter((p) => p.status === "success");
      return {
        all: rows.length,
        success: succ.length,
        usd: succ.filter((p) => p.currency === "USD").reduce((s, p) => s + (p.amount || 0), 0) / 100,
        ugx: succ.filter((p) => p.currency === "UGX").reduce((s, p) => s + (p.amount || 0), 0),
      };
    };
    const cur = f(paymentsInRange);
    const prev = prevWindow
      ? f((payments || []).filter((p: any) => inPrev(p.created_at)))
      : { all: 0, success: 0, usd: 0, ugx: 0 };
    return {
      cur,
      prev,
      trend: (k: keyof typeof cur) =>
        prev[k] ? Math.round(((cur[k] - prev[k]) / prev[k]) * 1000) / 10 : cur[k] ? 100 : 0,
    };
  }, [paymentsInRange, payments, range.from, range.to]);

  // Top selling products
  const topProducts = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number; cur: string }> = {};
    paymentsInRange.forEach((p: any) => {
      if (p.status !== "success" || !p.product_id) return;
      const k = p.product_id;
      if (!counts[k]) counts[k] = { count: 0, revenue: 0, cur: p.currency };
      counts[k].count += 1;
      counts[k].revenue += p.currency === "USD" ? (p.amount || 0) / 100 : p.amount || 0;
    });
    return Object.entries(counts)
      .map(([id, v]) => ({
        id,
        name: productById[id]?.name || "Unknown",
        category: productById[id]?.category || "—",
        ...v,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [paymentsInRange, productById]);

  const recentPayments = useMemo(
    () => paymentsInRange.slice(0, 6),
    [paymentsInRange],
  );

  // Engagement aggregate — range-scoped on campaigns sent within window
  const eng = useMemo(() => {
    const allCamps = engagement?.campaigns || [];
    const camps = allCamps.filter((c: any) => {
      const d = c.sent_at || c.created_at;
      return d ? inRange(d) : true;
    });
    const totals = camps.reduce(
      (a, c: any) => {
        a.sent += c.sent_count || 0;
        a.delivered += c.delivered_count || 0;
        a.opened += c.opened_count || 0;
        a.clicked += c.clicked_count || 0;
        a.bounced += c.bounced_count || 0;
        return a;
      },
      { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 },
    );
    const subscribers = (engagement?.audiences || []).reduce(
      (s, a: any) => s + (a.member_count || 0),
      0,
    );
    return {
      campaigns: camps.length,
      ...totals,
      openRate: pct(totals.opened, totals.delivered),
      clickRate: pct(totals.clicked, totals.delivered),
      subscribers,
    };
  }, [engagement, range.from, range.to]);

  // Advisor aggregate — range scoped on events / mentor calls
  const adv = useMemo(() => {
    const evs = (advisor?.events || []).filter((e: any) => inRange(e.created_at));
    const wizardStarts = evs.filter((e: any) => e.event_type === "wizard_start").length;
    const wizardComplete = evs.filter((e: any) => e.event_type === "wizard_complete").length;
    return {
      assessments: advisor?.assess || 0,
      events: evs.length,
      calls: advisor?.calls || 0,
      starts: wizardStarts,
      completes: wizardComplete,
      completionRate: pct(wizardComplete, wizardStarts),
    };
  }, [advisor, range.from, range.to]);

  // Popups — range scoped on events
  const pop = useMemo(() => {
    const evs = (misc?.popupEvents || []).filter((e: any) => inRange(e.created_at));
    const impressions = evs.filter((e: any) => e.event_type === "impression").length;
    const clicks = evs.filter((e: any) => e.event_type === "click").length;
    const dismiss = evs.filter((e: any) => e.event_type === "dismissal").length;
    return {
      active: (misc?.popups || []).filter((p: any) => p.is_active).length,
      impressions,
      clicks,
      dismiss,
      ctr: pct(clicks, impressions),
    };
  }, [misc, range.from, range.to]);

  // Counts scoped to range
  const tallyInRange = (misc?.tally || []).filter((t: any) => inRange(t.created_at)).length;
  const profilesInRange = (misc?.profiles || []).filter((p: any) => inRange(p.created_at)).length;
  const profilesTotal = (misc?.profiles || []).length;
  const blogViewsInRange = series.reduce((s, b) => s + (b.views || 0), 0);
  const affiliateConvInRange = (affiliateConversions || []).filter((c: any) => inRange(c.created_at)).length;
  const newAffiliatesInRange = (affiliates || []).filter((a: any) => inRange(a.created_at)).length;

  // Sparklines from series
  const sparkRev = series.map((s) => s.usd + s.ugx / 3700); // unified spark
  const sparkSucc = series.map((s) => s.success);
  const sparkEnr = series.map((s) => s.enrollments);

  const statusData = [
    { name: "Success", value: pStats.success, color: "hsl(var(--success))" },
    { name: "Pending", value: pStats.pending, color: "hsl(var(--warning))" },
    { name: "Failed", value: pStats.failed, color: "hsl(var(--destructive))" },
  ];

  const rangeLbl = rangeLabel(range);
  const dCount = daysInRange(range); // 0 = all-time

  /* ---------- threshold-based alerts ---------- */
  const alerts = useMemo<DashboardAlert[]>(() => {
    const out: DashboardAlert[] = [];

    // 1. Payment failure rate
    const totalAttempts = pStats.success + pStats.failed;
    if (totalAttempts >= 10) {
      const failRate = pct(pStats.failed, totalAttempts);
      if (failRate >= 25) {
        out.push({
          id: "pay-fail-rate",
          severity: "critical",
          title: "High payment failure rate",
          description: `${pStats.failed} of ${totalAttempts} payment attempts failed in ${rangeLbl.toLowerCase()}.`,
          metric: `${failRate}%`,
          threshold: "≥ 25% failures",
          to: "/super-admin-dashboard?tab=payments",
          actionLabel: "View payments",
        });
      } else if (failRate >= 15) {
        out.push({
          id: "pay-fail-rate",
          severity: "warning",
          title: "Elevated payment failures",
          description: `${pStats.failed} of ${totalAttempts} payment attempts failed in ${rangeLbl.toLowerCase()}.`,
          metric: `${failRate}%`,
          threshold: "≥ 15% failures",
          to: "/super-admin-dashboard?tab=payments",
          actionLabel: "View payments",
        });
      }
    }

    // 2. Spike in failures today vs trailing average (last 7 days excl. today)
    if (series.length >= 8) {
      const today = series[series.length - 1];
      const trail = series.slice(-8, -1);
      const avg = trail.reduce((s, b) => s + b.failed, 0) / trail.length;
      if (today.failed >= 5 && today.failed >= avg * 2 && avg >= 0.5) {
        out.push({
          id: "pay-fail-spike",
          severity: "critical",
          title: "Failure spike detected today",
          description: `Today's failed payments (${today.failed}) are more than 2× the 7-day average (${avg.toFixed(1)}).`,
          metric: `${today.failed} today`,
          threshold: "> 2× 7-day avg",
          to: "/super-admin-dashboard?tab=payments",
          actionLabel: "Investigate",
        });
      }
    }

    // 3. Pending payments stuck >24h
    const stuck = paymentsInRange.filter(
      (p: any) =>
        p.status === "pending" &&
        Date.now() - new Date(p.created_at).getTime() > 24 * 3600 * 1000,
    ).length;
    if (stuck >= 3) {
      out.push({
        id: "pay-stuck",
        severity: "warning",
        title: "Pending payments stuck > 24h",
        description: `${stuck} payment${stuck === 1 ? "" : "s"} have been pending for more than a day.`,
        metric: `${stuck} stuck`,
        threshold: "≥ 3 pending > 24h",
        to: "/super-admin-dashboard?tab=payments",
        actionLabel: "Review",
      });
    }

    // 4. Revenue decline vs previous period
    if (prevWindow && periodStats.prev.usd >= 100) {
      const t = periodStats.trend("usd");
      if (t <= -30) {
        out.push({
          id: "rev-drop",
          severity: t <= -50 ? "critical" : "warning",
          title: "Revenue drop vs previous period",
          description: `USD revenue is down ${Math.abs(t)}% versus the prior ${dCount || 30}-day window.`,
          metric: `${t}%`,
          threshold: "≤ −30% MoM",
          to: "/super-admin-dashboard?tab=payments",
          actionLabel: "View trend",
        });
      }
    }

    // 5. Enrollment churn / drop vs previous period
    if (prevWindow && periodStats.prev.success >= 5) {
      const t = periodStats.trend("success");
      if (t <= -30) {
        out.push({
          id: "enroll-drop",
          severity: t <= -50 ? "critical" : "warning",
          title: "Enrollment volume falling",
          description: `Paid enrollments are down ${Math.abs(t)}% versus the previous period.`,
          metric: `${t}%`,
          threshold: "≤ −30%",
          to: "/admin-users",
          actionLabel: "View learners",
        });
      }
    }

    // 6. Email bounce rate
    if (eng.delivered + eng.bounced >= 100) {
      const bounceRate = pct(eng.bounced, eng.delivered + eng.bounced);
      if (bounceRate >= 5) {
        out.push({
          id: "email-bounce",
          severity: bounceRate >= 10 ? "critical" : "warning",
          title: "Email bounce rate above safe limit",
          description: `${eng.bounced.toLocaleString()} bounces across ${(eng.delivered + eng.bounced).toLocaleString()} attempts. Sender reputation at risk.`,
          metric: `${bounceRate}%`,
          threshold: "≥ 5% bounces",
          to: "/admin-engagement",
          actionLabel: "Open engagement",
        });
      }
    }

    // 7. Open-rate collapse
    if (eng.delivered >= 200 && eng.openRate < 10) {
      out.push({
        id: "email-open-low",
        severity: "warning",
        title: "Low email open rate",
        description: `Only ${eng.opened.toLocaleString()} opens across ${eng.delivered.toLocaleString()} delivered emails.`,
        metric: `${eng.openRate}%`,
        threshold: "< 10% opens",
        to: "/admin-engagement",
        actionLabel: "Tune campaigns",
      });
    }

    // 8. Popup CTR collapse
    if (pop.impressions >= 500 && pop.ctr < 1) {
      out.push({
        id: "popup-ctr",
        severity: "info",
        title: "Popup CTR underperforming",
        description: `${pop.impressions.toLocaleString()} impressions with only ${pop.clicks} clicks.`,
        metric: `${pop.ctr}%`,
        threshold: "< 1% CTR @ 500+ impressions",
        to: "/admin-popups",
        actionLabel: "Edit popups",
      });
    }

    // 9. Advisor wizard completion drop
    if (adv.starts >= 20 && adv.completionRate < 30) {
      out.push({
        id: "advisor-completion",
        severity: "warning",
        title: "Advisor wizard completion low",
        description: `${adv.completes} of ${adv.starts} learners completed the assessment.`,
        metric: `${adv.completionRate}%`,
        threshold: "< 30% completion",
        to: "/admin/advisor",
        actionLabel: "Review flow",
      });
    }

    // 10. Affiliate clicks without conversions
    if (prevWindow) {
      const prevConv = (affiliateConversions || []).filter((c: any) => inPrev(c.created_at)).length;
      if (prevConv >= 5 && affiliateConvInRange === 0) {
        out.push({
          id: "aff-conv-zero",
          severity: "warning",
          title: "Affiliate conversions dropped to zero",
          description: `Previous period had ${prevConv} conversion${prevConv === 1 ? "" : "s"}, current period has none.`,
          metric: "0 conv",
          threshold: "Zero vs prior period ≥ 5",
          to: "/super-admin-dashboard?tab=affiliates",
          actionLabel: "View affiliates",
        });
      }
    }

    // Sort: critical → warning → info
    const order: Record<DashboardAlert["severity"], number> = { critical: 0, warning: 1, info: 2 };
    return out.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [
    pStats,
    series,
    paymentsInRange,
    prevWindow,
    periodStats,
    eng,
    pop,
    adv,
    affiliateConversions,
    affiliateConvInRange,
    dCount,
    rangeLbl,
  ]);

  return (
    <div className="space-y-6">
      {/* Global date range filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-background/80 backdrop-blur border-b">
        <div>
          <p className="text-sm text-muted-foreground">
            Live operating picture across all modules. Click any tile to dive in.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-0.5">
            Showing <span className="font-semibold text-foreground">{rangeLbl}</span>
            {dCount > 0 && <> · {dCount} day{dCount > 1 ? "s" : ""}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:inline-flex rounded-lg border bg-muted/40 p-1">
            {([
              { k: "7d", l: "7d" },
              { k: "30d", l: "30d" },
              { k: "90d", l: "90d" },
              { k: "365d", l: "1y" },
              { k: "all", l: "All" },
            ] as const).map((p) => (
              <button
                key={p.k}
                onClick={() => setRange(resolveRange(p.k))}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  range.preset === p.k
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.l}
              </button>
            ))}
          </div>
          <DashboardDateFilter value={range} onChange={setRange} />
        </div>
      </div>

      {/* Threshold-based alerts */}
      <AlertsPanel alerts={alerts} rangeLabel={rangeLbl} />

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi
          title="Revenue (USD)"
          value={fmtUSD(pStats.usd)}
          sub={rangeLbl}
          icon={<DollarSign className="h-5 w-5" />}
          accent="text-success"
          bg="bg-success/10"
          to="/super-admin-dashboard?tab=payments"
          trend={
            prevWindow && periodStats.prev.usd > 0
              ? { value: Math.abs(periodStats.trend("usd")), positive: periodStats.trend("usd") >= 0 }
              : null
          }
          spark={sparkRev}
          sparkColor="hsl(var(--success))"
        />
        <Kpi
          title="Revenue (UGX)"
          value={fmtUGX(pStats.ugx)}
          sub={rangeLbl}
          icon={<Wallet className="h-5 w-5" />}
          accent="text-accent"
          bg="bg-accent/10"
          to="/super-admin-dashboard?tab=payments"
          trend={
            prevWindow && periodStats.prev.ugx > 0
              ? { value: Math.abs(periodStats.trend("ugx")), positive: periodStats.trend("ugx") >= 0 }
              : null
          }
          spark={series.map((s) => s.ugx)}
          sparkColor="hsl(var(--accent))"
        />
        <Kpi
          title="Paid Enrollments"
          value={pStats.success.toLocaleString()}
          sub={`${pStats.successRate}% success rate`}
          icon={<Award className="h-5 w-5" />}
          accent="text-primary"
          bg="bg-primary/10"
          to="/admin-users"
          trend={
            prevWindow && periodStats.prev.success > 0
              ? { value: Math.abs(periodStats.trend("success")), positive: periodStats.trend("success") >= 0 }
              : null
          }
          spark={sparkEnr}
          sparkColor="hsl(var(--primary))"
        />
        <Kpi
          title="Academy Users"
          value={profilesTotal.toLocaleString()}
          sub={range.from ? `+${profilesInRange.toLocaleString()} new · ${blogViewsInRange.toLocaleString()} views` : `${blogViewsInRange.toLocaleString()} blog views`}
          icon={<Users className="h-5 w-5" />}
          accent="text-blue-500"
          bg="bg-blue-500/10"
          to="/admin-users"
        />
        <Kpi
          title="Email Open Rate"
          value={`${eng.openRate}%`}
          sub={`${eng.sent.toLocaleString()} sent · ${eng.campaigns} camps`}
          icon={<Send className="h-5 w-5" />}
          accent="text-purple-500"
          bg="bg-purple-500/10"
          to="/admin-engagement"
        />
        <Kpi
          title="Affiliate Earnings"
          value={fmtUSD(
            (affiliates || []).reduce((s: number, a: any) => s + Number(a.total_earnings || 0), 0),
          )}
          sub={range.from ? `+${newAffiliatesInRange} new · ${affiliateConvInRange} conv` : `${(affiliates || []).filter((a: any) => a.status === "approved").length} approved`}
          icon={<Handshake className="h-5 w-5" />}
          accent="text-cyan-500"
          bg="bg-cyan-500/10"
          to="/super-admin-dashboard?tab=affiliates"
        />
      </div>

      {/* Trend + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Revenue & Enrollments</CardTitle>
                <p className="text-xs text-muted-foreground">{rangeLbl} · daily breakdown</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success" /> USD
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--accent))" }} /> UGX
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Enrollments
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="gUsd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gUgx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="usd"
                    name="USD"
                    stroke="hsl(var(--success))"
                    fill="url(#gUsd)"
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="ugx"
                    name="UGX"
                    stroke="hsl(var(--accent))"
                    fill="url(#gUgx)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="enrollments"
                    name="Enrollments"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Payment health</CardTitle>
            <p className="text-xs text-muted-foreground">{rangeLbl} · status breakdown</p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{s.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-2 border-t text-xs">
                <span className="text-muted-foreground">Success rate</span>
                <span className="font-bold text-success">{pStats.successRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module insights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Modules</h2>
          <span className="text-xs text-muted-foreground">{rangeLbl} · auto-refreshes every 60s</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ModuleCard
            title="Products & Catalog"
            description="Certificates, bootcamps and programs"
            icon={<BookOpen className="h-5 w-5" />}
            accent="text-purple-500"
            bg="bg-purple-500/10"
            to="/admin-courses"
            metrics={[
              { label: "Active", value: (products || []).filter((p: any) => p.is_active).length },
              { label: "Certs", value: (products || []).filter((p: any) => p.category === "certificate").length },
              { label: "Camps", value: (products || []).filter((p: any) => p.category === "bootcamp").length },
            ]}
            highlight={`${pStats.success} sold`}
          />
          <ModuleCard
            title="Payments"
            description="Stripe + ioTec mobile money"
            icon={<CreditCard className="h-5 w-5" />}
            accent="text-success"
            bg="bg-success/10"
            to="/super-admin-dashboard?tab=payments"
            metrics={[
              { label: "Success", value: pStats.success },
              { label: "Pending", value: pStats.pending },
              { label: "Failed", value: pStats.failed },
            ]}
            highlight={`${pStats.successRate}%`}
          />
          <ModuleCard
            title="Engagement"
            description="Email campaigns & audiences"
            icon={<Send className="h-5 w-5" />}
            accent="text-purple-500"
            bg="bg-purple-500/10"
            to="/admin-engagement"
            metrics={[
              { label: "Campaigns", value: eng.campaigns },
              { label: "Sent", value: eng.sent.toLocaleString() },
              { label: "Open", value: `${eng.openRate}%` },
            ]}
            highlight={`${eng.subscribers} subs`}
          />
          <ModuleCard
            title="AI Advisor"
            description="Career assessments & mentor calls"
            icon={<Sparkles className="h-5 w-5" />}
            accent="text-primary"
            bg="bg-primary/10"
            to="/admin/advisor"
            metrics={[
              { label: "Assess", value: adv.assessments },
              { label: "Events", value: adv.events },
              { label: "Calls", value: adv.calls },
            ]}
            highlight={adv.completionRate ? `${adv.completionRate}% finish` : undefined}
          />
          <ModuleCard
            title="Affiliates"
            description="Referral partners & commissions"
            icon={<Handshake className="h-5 w-5" />}
            accent="text-cyan-500"
            bg="bg-cyan-500/10"
            to="/super-admin-dashboard?tab=affiliates"
            metrics={[
              { label: "Total", value: (affiliates || []).length },
              { label: "Approved", value: (affiliates || []).filter((a: any) => a.status === "approved").length },
              { label: "Conv", value: (affiliateConversions || []).length },
            ]}
            highlight={`${(affiliates || []).filter((a: any) => a.status === "pending").length} pending`}
          />
          <ModuleCard
            title="Blog"
            description="Content marketing & SEO"
            icon={<FileText className="h-5 w-5" />}
            accent="text-emerald-500"
            bg="bg-emerald-500/10"
            to="/blog-admin"
            metrics={[
              { label: "Posts", value: (blog?.posts || []).length },
              { label: "Live", value: (blog?.posts || []).filter((p: any) => p.published).length },
              { label: "Views", value: (blog?.posts || []).reduce((s, p: any) => s + (p.views || 0), 0).toLocaleString() },
            ]}
            highlight={`${blog?.comments || 0} cmts`}
          />
          <ModuleCard
            title="Forms (Tally)"
            description="Lead capture submissions"
            icon={<ClipboardList className="h-5 w-5" />}
            accent="text-amber-500"
            bg="bg-amber-500/10"
            to="/super-admin-dashboard?tab=forms"
            metrics={[
              { label: range.from ? "In range" : "Total", value: (range.from ? tallyInRange : (misc?.tally || []).length).toLocaleString() },
              { label: range.from ? "New users" : "Users", value: (range.from ? profilesInRange : profilesTotal).toLocaleString() },
              { label: "Camps", value: (products || []).filter((p: any) => p.category === "bootcamp").length },
            ]}
          />
          <ModuleCard
            title="Popups"
            description="Conversion popups & announcements"
            icon={<Megaphone className="h-5 w-5" />}
            accent="text-pink-500"
            bg="bg-pink-500/10"
            to="/admin-popups"
            metrics={[
              { label: "Active", value: pop.active },
              { label: "Impr.", value: pop.impressions },
              { label: "CTR", value: `${pop.ctr}%` },
            ]}
          />
        </div>
      </div>

      {/* Bottom row: top products + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Top selling products</CardTitle>
              <p className="text-xs text-muted-foreground">By paid enrollments</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin-courses" className="text-xs">
                Manage products <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">No paid enrollments yet</div>
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={140}
                      tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 20) + "…" : v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Enrollments" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
              <p className="text-xs text-muted-foreground">Latest payments</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/super-admin-dashboard?tab=payments" className="text-xs">
                All <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPayments.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">No recent activity</div>
            )}
            {recentPayments.map((p: any) => {
              const color =
                p.status === "success"
                  ? "bg-success/15 text-success"
                  : p.status === "pending"
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">
                      {productById[p.product_id]?.name || "Product"}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {p.payer_email || p.payer_phone || "guest"} ·{" "}
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold tabular-nums">
                      {p.currency === "USD" ? `$${((p.amount || 0) / 100).toFixed(0)}` : `UGX ${(p.amount || 0).toLocaleString()}`}
                    </div>
                    <Badge className={cn("text-[9px] px-1.5 py-0 h-4 capitalize border-0", color)}>{p.status}</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommandCenter;