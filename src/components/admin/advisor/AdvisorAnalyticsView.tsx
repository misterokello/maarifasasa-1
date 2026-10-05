import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, MessageSquare, Phone, Save, FileDown } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import DateRangeSelector, { DateRangeOption, getDaysFromRange } from "@/components/admin/charts/DateRangeSelector";
import { format, subDays } from "date-fns";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { downloadCSV, convertToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";

const COLORS = ["#6366F1", "#8B5CF6", "#14B8A6", "#F59E0B", "#EF4444", "#10B981", "#3B82F6"];

export default function AdvisorAnalyticsView() {
  const [range, setRange] = useState<DateRangeOption>("30d");
  const days = getDaysFromRange(range);
  const startISO = subDays(new Date(), days).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["advisor-analytics", range],
    queryFn: async () => {
      const [eventsRes, assessRes, mcrRes] = await Promise.all([
        supabase.from("advisor_events").select("event_type, created_at, assessment_id, session_id, product_slug, step_index, metadata").gte("created_at", startISO).order("created_at"),
        supabase.from("advisor_assessments").select("id, recommendation, answers, created_at, email").gte("created_at", startISO),
        supabase.from("mentor_call_requests").select("id, status, created_at").gte("created_at", startISO),
      ]);
      return {
        events: eventsRes.data || [],
        assessments: assessRes.data || [],
        mentorCalls: mcrRes.data || [],
      };
    },
    refetchInterval: 60_000,
  });

  const stats = useMemo(() => {
    const events = data?.events || [];
    const sessions = new Set(events.map((e: any) => e.session_id).filter(Boolean));
    const heroViews = events.filter((e: any) => e.event_type === "hero_view").length;
    const wizardStarts = events.filter((e: any) => e.event_type === "wizard_start").length;
    const wizardCompletes = events.filter((e: any) => e.event_type === "wizard_complete").length;
    const recViews = events.filter((e: any) => e.event_type === "recommendation_viewed").length;
    const saves = events.filter((e: any) => e.event_type === "save_completed").length;
    const mentorReqs = events.filter((e: any) => e.event_type === "mentor_call_requested").length;
    const pdfs = events.filter((e: any) => e.event_type === "pdf_downloaded").length;
    const chatSent = events.filter((e: any) => e.event_type === "chat_message_sent").length;
    return {
      sessions: sessions.size,
      heroViews,
      wizardStarts,
      wizardCompletes,
      recViews,
      saves,
      mentorReqs,
      pdfs,
      chatSent,
      assessments: data?.assessments?.length || 0,
      mentorCalls: data?.mentorCalls?.length || 0,
      completionRate: wizardStarts ? Math.round((wizardCompletes / wizardStarts) * 100) : 0,
      saveRate: recViews ? Math.round((saves / recViews) * 100) : 0,
      mentorRate: recViews ? Math.round((mentorReqs / recViews) * 100) : 0,
    };
  }, [data]);

  const timeSeries = useMemo(() => {
    const buckets: Record<string, { date: string; assessments: number; mentor: number; saves: number; chats: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      buckets[d] = { date: d, assessments: 0, mentor: 0, saves: 0, chats: 0 };
    }
    (data?.events || []).forEach((e: any) => {
      const d = format(new Date(e.created_at), "yyyy-MM-dd");
      if (!buckets[d]) return;
      if (e.event_type === "wizard_complete") buckets[d].assessments += 1;
      if (e.event_type === "mentor_call_requested") buckets[d].mentor += 1;
      if (e.event_type === "save_completed") buckets[d].saves += 1;
      if (e.event_type === "chat_message_sent") buckets[d].chats += 1;
    });
    return Object.values(buckets).map((b) => ({ ...b, name: format(new Date(b.date), days <= 14 ? "EEE" : "MMM d") }));
  }, [data, days]);

  const productMix = useMemo(() => {
    const counts: Record<string, number> = {};
    (data?.assessments || []).forEach((a: any) => {
      const slug = a?.recommendation?.primary?.product_slug;
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([slug, value]) => ({ name: slug, value }));
  }, [data]);

  const goalBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    (data?.assessments || []).forEach((a: any) => {
      const g = a?.answers?.career_goal;
      if (g) counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const funnel = useMemo(() => {
    return [
      { stage: "Hero view", count: stats.heroViews },
      { stage: "Wizard start", count: stats.wizardStarts },
      { stage: "Wizard complete", count: stats.wizardCompletes },
      { stage: "Recommendation", count: stats.recViews },
      { stage: "Saved", count: stats.saves },
      { stage: "Mentor call", count: stats.mentorReqs },
    ];
  }, [stats]);

  const exportEvents = () => {
    const events = data?.events || [];
    if (!events.length) { toast.error("No events to export"); return; }
    const cols = [
      { key: "created_at" as const, header: "Timestamp" },
      { key: "event_type" as const, header: "Event" },
      { key: "session_id" as const, header: "Session" },
      { key: "assessment_id" as const, header: "Assessment" },
      { key: "product_slug" as const, header: "Product" },
      { key: "step_index" as const, header: "Step" },
    ];
    downloadCSV(convertToCSV(events as any, cols as any), `advisor-events-${range}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success("Events exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeSelector value={range} onChange={setRange} />
        <Button variant="outline" onClick={exportEvents}>
          <Download className="w-4 h-4 mr-2" /> Export events CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard title="Unique sessions" value={stats.sessions} icon={<Users className="h-5 w-5 text-blue-500" />} iconBgColor="bg-blue-500/10" />
        <StatsCard title="Assessments" value={stats.assessments} icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} iconBgColor="bg-emerald-500/10" />
        <StatsCard title="Wizard completion" value={`${stats.completionRate}%`} icon={<TrendingUp className="h-5 w-5 text-purple-500" />} iconBgColor="bg-purple-500/10" />
        <StatsCard title="Saved" value={stats.saves} icon={<Save className="h-5 w-5 text-amber-500" />} iconBgColor="bg-amber-500/10" />
        <StatsCard title="Mentor calls" value={stats.mentorCalls} icon={<Phone className="h-5 w-5 text-rose-500" />} iconBgColor="bg-rose-500/10" />
        <StatsCard title="PDF downloads" value={stats.pdfs} icon={<FileDown className="h-5 w-5 text-cyan-500" />} iconBgColor="bg-cyan-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Daily activity</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} /></linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} /><stop offset="95%" stopColor="#14B8A6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="assessments" stroke="#6366F1" fill="url(#g1)" name="Assessments" />
                  <Area type="monotone" dataKey="saves" stroke="#F59E0B" fill="none" name="Saves" />
                  <Area type="monotone" dataKey="mentor" stroke="#14B8A6" fill="url(#g2)" name="Mentor calls" />
                  <Area type="monotone" dataKey="chats" stroke="#8B5CF6" fill="none" name="Chats" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Top recommended products</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {productMix.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={productMix} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(e) => e.name}>
                      {productMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Conversion funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="stage" type="category" fontSize={12} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Career goals</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {goalBreakdown.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
