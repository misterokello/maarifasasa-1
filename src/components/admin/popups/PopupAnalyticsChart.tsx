import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Eye, XCircle, MousePointerClick, BarChart3, Loader2 } from "lucide-react";

interface AnalyticsRow {
  popup_id: string;
  event_type: string;
  created_at: string;
}

interface PopupAnalyticsChartProps {
  popupId: string;
  popupTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const PopupAnalyticsChart = ({ popupId, popupTitle, open, onOpenChange }: PopupAnalyticsChartProps) => {
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ impressions: 0, dismissals: 0, cta_clicks: 0 });
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("30");

  useEffect(() => {
    if (!open || !popupId) return;

    const fetchData = async () => {
      setLoading(true);
      const days = parseInt(range);
      const since = subDays(new Date(), days).toISOString();

      const { data: rows, error } = await supabase
        .from("popup_analytics" as any)
        .select("event_type, created_at")
        .eq("popup_id", popupId)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching popup analytics:", error);
        setLoading(false);
        return;
      }

      const interval = eachDayOfInterval({
        start: subDays(new Date(), days),
        end: new Date(),
      });

      const dayMap: Record<string, { impressions: number; dismissals: number; cta_clicks: number }> = {};
      interval.forEach((d) => {
        const key = format(d, "yyyy-MM-dd");
        dayMap[key] = { impressions: 0, dismissals: 0, cta_clicks: 0 };
      });

      let totalImpressions = 0, totalDismissals = 0, totalClicks = 0;

      (rows as unknown as AnalyticsRow[])?.forEach((row) => {
        const key = format(new Date(row.created_at), "yyyy-MM-dd");
        if (!dayMap[key]) return;
        if (row.event_type === "impression") { dayMap[key].impressions++; totalImpressions++; }
        else if (row.event_type === "dismissal") { dayMap[key].dismissals++; totalDismissals++; }
        else if (row.event_type === "cta_click") { dayMap[key].cta_clicks++; totalClicks++; }
      });

      const chartData = Object.entries(dayMap).map(([date, counts]) => ({
        date: format(new Date(date), days > 14 ? "MMM d" : "EEE, MMM d"),
        ...counts,
      }));

      setData(chartData);
      setTotals({ impressions: totalImpressions, dismissals: totalDismissals, cta_clicks: totalClicks });
      setLoading(false);
    };

    fetchData();
  }, [open, popupId, range]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytics: {popupTitle}</DialogTitle>
          <DialogDescription>Track impressions, dismissals, and CTA clicks over time.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="font-semibold">{totals.impressions}</span>
              <span className="text-muted-foreground">Impressions</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <XCircle className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{totals.dismissals}</span>
              <span className="text-muted-foreground">Dismissals</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <MousePointerClick className="h-4 w-4 text-green-500" />
              <span className="font-semibold">{totals.cta_clicks}</span>
              <span className="text-muted-foreground">Clicks</span>
            </div>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No analytics data yet for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(data.length / 8))}
                className="text-muted-foreground"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2}
                dot={false}
                name="Impressions"
              />
              <Line
                type="monotone"
                dataKey="dismissals"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                dot={false}
                name="Dismissals"
              />
              <Line
                type="monotone"
                dataKey="cta_clicks"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={false}
                name="CTA Clicks"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {totals.impressions > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <strong>Engagement rate:</strong>{" "}
            {((totals.cta_clicks / totals.impressions) * 100).toFixed(1)}% click-through
            {" · "}
            {((totals.dismissals / totals.impressions) * 100).toFixed(1)}% dismissal rate
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PopupAnalyticsChart;
