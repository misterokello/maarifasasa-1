import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import DateRangeSelector, { DateRangeOption, getDaysFromRange } from "../charts/DateRangeSelector";

// Generate distinct colors for forms
const FORM_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

interface FormSubmissionData {
  form_id: string;
  form_name: string;
  submitted_at: string;
}

const TallyAnalyticsChart = () => {
  const [dateRange, setDateRange] = useState<DateRangeOption>("30d");
  const [visibleForms, setVisibleForms] = useState<Record<string, boolean>>({});
  const daysCount = getDaysFromRange(dateRange);

  // Fetch submissions within date range
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["tally-analytics", dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), daysCount);
      const { data, error } = await supabase
        .from("tally_submissions")
        .select("form_id, form_name, submitted_at")
        .gte("submitted_at", startDate.toISOString())
        .order("submitted_at", { ascending: true });

      if (error) throw error;
      return data as FormSubmissionData[];
    },
  });

  // Process data for chart
  const { chartData, forms, totals } = useMemo(() => {
    if (!submissions) return { chartData: [], forms: [], totals: { total: 0, daily: 0 } };

    // Get unique forms
    const formMap = new Map<string, string>();
    submissions.forEach((s) => {
      if (!formMap.has(s.form_id)) {
        formMap.set(s.form_id, s.form_name || "Unknown Form");
      }
    });
    const uniqueForms = Array.from(formMap.entries()).map(([id, name]) => ({ id, name }));

    // Initialize visible forms if not set
    if (Object.keys(visibleForms).length === 0 && uniqueForms.length > 0) {
      const initial: Record<string, boolean> = {};
      uniqueForms.slice(0, 5).forEach((f) => (initial[f.id] = true)); // Show first 5 by default
      setVisibleForms(initial);
    }

    // Generate date array
    const days = Array.from({ length: daysCount }, (_, i) => {
      const date = subDays(new Date(), daysCount - 1 - i);
      return {
        date,
        dateStr: format(date, "yyyy-MM-dd"),
        name:
          daysCount <= 14
            ? format(date, "EEE")
            : daysCount <= 90
            ? format(date, "MMM d")
            : format(date, "MMM d"),
      };
    });

    // Group submissions by day and form
    const submissionsByDayAndForm: Record<string, Record<string, number>> = {};
    submissions.forEach((s) => {
      const day = format(parseISO(s.submitted_at), "yyyy-MM-dd");
      if (!submissionsByDayAndForm[day]) {
        submissionsByDayAndForm[day] = {};
      }
      submissionsByDayAndForm[day][s.form_id] =
        (submissionsByDayAndForm[day][s.form_id] || 0) + 1;
    });

    // Build chart data
    const data = days.map((day) => {
      const dayData: Record<string, string | number> = { name: day.name, date: day.dateStr };
      let dayTotal = 0;
      uniqueForms.forEach((form) => {
        const count = submissionsByDayAndForm[day.dateStr]?.[form.id] || 0;
        dayData[form.id] = count;
        dayTotal += count;
      });
      dayData.total = dayTotal;
      return dayData;
    });

    // Calculate totals
    const total = submissions.length;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todaySubmissions = submissions.filter(
      (s) => format(parseISO(s.submitted_at), "yyyy-MM-dd") === todayStr
    ).length;

    return {
      chartData: data,
      forms: uniqueForms,
      totals: { total, daily: todaySubmissions },
    };
  }, [submissions, daysCount, visibleForms]);

  const toggleFormVisibility = (formId: string) => {
    setVisibleForms((prev) => ({
      ...prev,
      [formId]: !prev[formId],
    }));
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Submission Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                {totals.total} submissions in the last {daysCount} days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              {totals.daily} today
            </Badge>
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Form toggles */}
        {forms.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {forms.map((form, index) => (
              <button
                key={form.id}
                onClick={() => toggleFormVisibility(form.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  visibleForms[form.id]
                    ? "bg-opacity-20 border-2"
                    : "bg-muted/50 text-muted-foreground border border-transparent"
                }`}
                style={{
                  backgroundColor: visibleForms[form.id]
                    ? `${FORM_COLORS[index % FORM_COLORS.length]}20`
                    : undefined,
                  borderColor: visibleForms[form.id]
                    ? FORM_COLORS[index % FORM_COLORS.length]
                    : undefined,
                  color: visibleForms[form.id]
                    ? FORM_COLORS[index % FORM_COLORS.length]
                    : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: FORM_COLORS[index % FORM_COLORS.length] }}
                />
                {form.name.length > 20 ? `${form.name.slice(0, 20)}...` : form.name}
              </button>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {forms.map((form, index) => (
                    <linearGradient
                      key={form.id}
                      id={`color-${form.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={FORM_COLORS[index % FORM_COLORS.length]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={FORM_COLORS[index % FORM_COLORS.length]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string) => {
                    const form = forms.find((f) => f.id === name);
                    return [value, form?.name || name];
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    const form = forms.find((f) => f.id === value);
                    const name = form?.name || value;
                    return name.length > 15 ? `${name.slice(0, 15)}...` : name;
                  }}
                />
                {forms.map((form, index) =>
                  visibleForms[form.id] ? (
                    <Area
                      key={form.id}
                      type="monotone"
                      dataKey={form.id}
                      name={form.id}
                      stroke={FORM_COLORS[index % FORM_COLORS.length]}
                      fillOpacity={1}
                      fill={`url(#color-${form.id})`}
                      strokeWidth={2}
                    />
                  ) : null
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No submission data available</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TallyAnalyticsChart;
