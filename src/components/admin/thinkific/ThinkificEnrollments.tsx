import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Loader2, RotateCcw, Search, BookOpen, Users, CheckCircle2,
  Clock, TrendingUp, Award, ExternalLink, Eye, Filter, Circle, PlayCircle,
  BarChart3, Sparkles, Mail,
} from "lucide-react";
import { toast } from "sonner";
import BulkEmailDialog from "@/components/admin/BulkEmailDialog";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, Legend, ComposedChart,
} from "recharts";

interface ThinkificCourse {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  course_card_image_url?: string;
  product_id?: number;
  user_id?: number;
  keywords?: string;
  duration?: string;
  instructional_level?: string;
  published?: boolean;
  reviews_enabled?: boolean;
  course_card_text?: string;
  created_at?: string;
}

interface Enrollment {
  id: number;
  course_id: number;
  course_name: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  percentage_completed: string | number;
  completed: boolean;
  expired: boolean;
  is_free_trial: boolean;
  started_at?: string;
  activated_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface CourseAnalytics {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  expired: number;
  freeTrial: number;
  avgProgress: number;
  completionRate: number;
  newLast30: number;
  completedLast30: number;
}

interface CourseData {
  loading: boolean;
  loaded: boolean;
  enrollments: Enrollment[];
  analytics: CourseAnalytics | null;
  search: string;
  statusFilter: "all" | "completed" | "in_progress" | "not_started" | "expired";
  minProgress: number;
  maxProgress: number;
  activeSince: string; // ISO date (yyyy-mm-dd)
  sortBy: "name" | "progress" | "enrolled" | "active" | "completed";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

const emptyData: CourseData = {
  loading: false, loaded: false, enrollments: [], analytics: null, search: "", statusFilter: "all",
  minProgress: 0, maxProgress: 100, activeSince: "", sortBy: "progress", sortDir: "desc",
  page: 1, pageSize: 25,
};

const ThinkificEnrollments = () => {
  const [courses, setCourses] = useState<ThinkificCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [search, setSearch] = useState("");
  const [courseSort, setCourseSort] = useState<"newest" | "oldest" | "name">("newest");
  const [data, setData] = useState<Record<number, CourseData>>({});
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [drawerLearner, setDrawerLearner] = useState<{ enrollment: Enrollment; course: ThinkificCourse } | null>(null);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("thinkific-courses", { method: "GET" });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      // Thinkific public API /courses returns the site's listed courses; `published`
      // is not always present in the payload, so don't filter it out client-side.
      const items = (res?.items || []) as ThinkificCourse[];
      const filtered = items.filter((c) => c.published !== false);
      setCourses(filtered);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const loadCourseEnrollments = async (courseId: number, force = false) => {
    setData((d) => ({
      ...d,
      [courseId]: { ...(d[courseId] || emptyData), loading: true },
    }));
    try {
      const { data: res, error } = await supabase.functions.invoke(
        `thinkific-course-enrollments?course_id=${courseId}${force ? `&_=${Date.now()}` : ""}`,
        { method: "GET" }
      );
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      setData((d) => ({
        ...d,
        [courseId]: {
          ...(d[courseId] || emptyData),
          loading: false,
          loaded: true,
          enrollments: res.enrollments || [],
          analytics: res.analytics || null,
        },
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load enrollments");
      setData((d) => ({ ...d, [courseId]: { ...(d[courseId] || emptyData), loading: false } }));
    }
  };

  const onAccordionChange = (values: string[]) => {
    setOpenItems(values);
    for (const v of values) {
      const id = Number(v);
      if (!data[id]?.loaded && !data[id]?.loading) loadCourseEnrollments(id);
    }
  };

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? courses.filter((c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q) ||
          String(c.id).includes(q)
        )
      : courses.slice();
    list.sort((a, b) => {
      if (courseSort === "name") return a.name.localeCompare(b.name);
      // Thinkific's public /courses endpoint doesn't always include created_at,
      // so fall back to the numeric course id (assigned sequentially, so a higher
      // id reliably means a more recently created course).
      const ta = a.created_at ? new Date(a.created_at).getTime() : Number(a.id) || 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : Number(b.id) || 0;
      return courseSort === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [courses, search, courseSort]);

  if (loadingCourses) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Loading courses...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Course Enrollments
          </h2>
          <p className="text-muted-foreground">
            Published Thinkific courses with enrolled learners and analytics
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[280px]"
            />
          </div>
          <Select value={courseSort} onValueChange={(v) => setCourseSort(v as typeof courseSort)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest courses</SelectItem>
              <SelectItem value="oldest">Oldest courses</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadCourses}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">No published courses found.</p>
        </div>
      ) : (
        <>
        <EnrollmentsOverview courses={filteredCourses} />
        <Accordion type="multiple" value={openItems} onValueChange={onAccordionChange} className="space-y-3 mt-4">
          {filteredCourses.map((course) => {
            const cdata = data[course.id];
            return (
              <AccordionItem
                key={course.id}
                value={String(course.id)}
                className="border rounded-lg bg-card overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    {course.course_card_image_url ? (
                      <img
                        src={course.course_card_image_url}
                        alt={course.name}
                        loading="lazy"
                        className="h-12 w-16 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{course.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>#{course.id}</span>
                        {course.instructional_level && <span>· {course.instructional_level}</span>}
                        {course.duration && <span>· {course.duration}</span>}
                        {cdata?.loaded && (
                          <Badge variant="secondary" className="ml-1">
                            {cdata.analytics?.total ?? 0} enrolled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <CourseEnrollmentsBody
                    course={course}
                    cdata={cdata}
                    onRefresh={() => loadCourseEnrollments(course.id, true)}
                    onLearnerClick={(enrollment) => setDrawerLearner({ enrollment, course })}
                    onPatch={(patch) =>
                      setData((d) => ({
                        ...d,
                        [course.id]: {
                          ...(d[course.id] || emptyData),
                          ...patch,
                          // Any filter/sort change resets pagination back to page 1.
                          ...(Object.keys(patch).some(
                            (k) => k !== "page" && k !== "pageSize",
                          )
                            ? { page: 1 }
                            : {}),
                        },
                      }))
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        </>
      )}

      <LearnerProgressDrawer
        open={!!drawerLearner}
        onClose={() => setDrawerLearner(null)}
        enrollment={drawerLearner?.enrollment ?? null}
        course={drawerLearner?.course ?? null}
      />
    </div>
  );
};

const StatTile = ({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{label}</p>
      <span className="text-primary">{icon}</span>
    </div>
    <p className="text-xl font-bold mt-1">{value}</p>
  </div>
);

interface CourseSnapshot {
  course: ThinkificCourse;
  analytics: CourseAnalytics;
  enrollments: Enrollment[];
}

const EnrollmentsOverview = ({ courses }: { courses: ThinkificCourse[] }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [snapshots, setSnapshots] = useState<CourseSnapshot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendMonths, setTrendMonths] = useState<6 | 12 | 24>(12);
  const [drilldownCourseId, setDrilldownCourseId] = useState<number | null>(null);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);
    setSnapshots(null);
    setProgress({ done: 0, total: courses.length });
    try {
      const results: CourseSnapshot[] = [];
      // Limit concurrency to avoid overwhelming the edge function.
      const concurrency = 4;
      let i = 0;
      const workers = Array.from({ length: Math.min(concurrency, courses.length) }, async () => {
        while (i < courses.length) {
          const idx = i++;
          const course = courses[idx];
          try {
            const { data, error } = await supabase.functions.invoke(
              `thinkific-course-enrollments?course_id=${course.id}`,
              { method: "GET" },
            );
            if (!error && !data?.error && data?.analytics) {
              results.push({
                course,
                analytics: data.analytics,
                enrollments: Array.isArray(data.enrollments) ? data.enrollments : [],
              });
            }
          } catch (e) {
            console.warn("snapshot course failed", course.id, e);
          } finally {
            setProgress((p) => ({ ...p, done: p.done + 1 }));
          }
        }
      });
      await Promise.all(workers);
      setSnapshots(results);
    } catch (e: any) {
      setError(e.message || "Failed to load snapshot");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    if (!snapshots) return null;
    const t = {
      coursesAnalyzed: snapshots.length,
      totalEnrollments: 0,
      totalCompleted: 0,
      totalInProgress: 0,
      totalNotStarted: 0,
      totalExpired: 0,
      newLast30: 0,
      completedLast30: 0,
      weightedProgress: 0,
      coursesWithLearners: 0,
    };
    let progressNumerator = 0;
    for (const s of snapshots) {
      const a = s.analytics;
      t.totalEnrollments += a.total;
      t.totalCompleted += a.completed;
      t.totalInProgress += a.inProgress;
      t.totalNotStarted += a.notStarted;
      t.totalExpired += a.expired;
      t.newLast30 += a.newLast30;
      t.completedLast30 += a.completedLast30;
      progressNumerator += (a.avgProgress || 0) * a.total;
      if (a.total > 0) t.coursesWithLearners += 1;
    }
    const avgProgress = t.totalEnrollments
      ? Math.round(progressNumerator / t.totalEnrollments)
      : 0;
    const completionRate = t.totalEnrollments
      ? Math.round((t.totalCompleted / t.totalEnrollments) * 100)
      : 0;
    return { ...t, avgProgress, completionRate };
  }, [snapshots]);

  const topByEnrollment = useMemo(
    () => (snapshots ? [...snapshots].sort((a, b) => b.analytics.total - a.analytics.total).slice(0, 5) : []),
    [snapshots],
  );
  const topByCompletion = useMemo(
    () =>
      snapshots
        ? [...snapshots]
            .filter((s) => s.analytics.total >= 1)
            .sort((a, b) => b.analytics.completionRate - a.analytics.completionRate)
            .slice(0, 5)
        : [],
    [snapshots],
  );

  // Monthly trend: enrolments + completions + completion rate over last N months
  const trendData = useMemo(() => {
    if (!snapshots) return [];
    const now = new Date();
    const buckets: { key: string; label: string; enrolments: number; completions: number }[] = [];
    for (let i = trendMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        enrolments: 0,
        completions: 0,
      });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const s of snapshots) {
      for (const e of s.enrollments) {
        const startRaw = e.activated_at || e.created_at || e.started_at;
        if (startRaw) {
          const dt = new Date(startRaw);
          const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
          const b = map.get(k);
          if (b) b.enrolments += 1;
        }
        if (e.completed_at) {
          const dt = new Date(e.completed_at);
          const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
          const b = map.get(k);
          if (b) b.completions += 1;
        }
      }
    }
    return buckets.map((b) => ({
      ...b,
      completionRate: b.enrolments > 0 ? Math.round((b.completions / b.enrolments) * 100) : 0,
    }));
  }, [snapshots, trendMonths]);

  // Bar breakdown: per-course enrolments split by status (top 8 by total)
  const breakdownData = useMemo(() => {
    if (!snapshots) return [];
    return [...snapshots]
      .sort((a, b) => b.analytics.total - a.analytics.total)
      .slice(0, 8)
      .map((s) => ({
        courseId: s.course.id,
        name: s.course.name.length > 22 ? s.course.name.slice(0, 22) + "…" : s.course.name,
        Completed: s.analytics.completed,
        "In progress": s.analytics.inProgress,
        "Not started": s.analytics.notStarted,
        completionRate: s.analytics.completionRate,
      }));
  }, [snapshots]);

  const drilldownSnapshot = useMemo(
    () => (snapshots && drilldownCourseId != null ? snapshots.find((s) => s.course.id === drilldownCourseId) ?? null : null),
    [snapshots, drilldownCourseId],
  );

  const drilldownTrend = useMemo(() => {
    if (!drilldownSnapshot) return [];
    const now = new Date();
    const buckets: { key: string; label: string; enrolments: number; completions: number }[] = [];
    for (let i = trendMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        enrolments: 0,
        completions: 0,
      });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const e of drilldownSnapshot.enrollments) {
      const startRaw = e.activated_at || e.created_at || e.started_at;
      if (startRaw) {
        const dt = new Date(startRaw);
        const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        const b = map.get(k);
        if (b) b.enrolments += 1;
      }
      if (e.completed_at) {
        const dt = new Date(e.completed_at);
        const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        const b = map.get(k);
        if (b) b.completions += 1;
      }
    }
    return buckets.map((b) => ({
      ...b,
      completionRate: b.enrolments > 0 ? Math.round((b.completions / b.enrolments) * 100) : 0,
    }));
  }, [drilldownSnapshot, trendMonths]);

  return (
    <Card className="mb-4 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Enrollment snapshot
            </CardTitle>
            <CardDescription>
              Aggregate insights across {courses.length} course{courses.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <Button onClick={loadSnapshot} disabled={loading} size="sm">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading {progress.done}/{progress.total}…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {snapshots ? "Refresh snapshot" : "Load snapshot"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-lg p-3">
            {error}
          </div>
        )}

        {!snapshots && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Click "Load snapshot" to fetch aggregate enrollment analytics across all visible courses.
            Larger catalogues may take a moment.
          </p>
        )}

        {totals && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatTile icon={<BookOpen className="h-4 w-4" />} label="Courses" value={totals.coursesAnalyzed} />
              <StatTile icon={<Users className="h-4 w-4" />} label="Total enrolments" value={totals.totalEnrollments.toLocaleString()} />
              <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={totals.totalCompleted.toLocaleString()} />
              <StatTile icon={<Clock className="h-4 w-4" />} label="In progress" value={totals.totalInProgress.toLocaleString()} />
              <StatTile icon={<Circle className="h-4 w-4" />} label="Not started" value={totals.totalNotStarted.toLocaleString()} />
              <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Avg. progress" value={`${totals.avgProgress}%`} />
              <StatTile icon={<Award className="h-4 w-4" />} label="Completion rate" value={`${totals.completionRate}%`} />
              <StatTile icon={<Users className="h-4 w-4" />} label="New (30d)" value={totals.newLast30.toLocaleString()} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> Top courses by enrolment
                </p>
                {topByEnrollment.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No enrolments yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {topByEnrollment.map((s) => (
                      <li key={s.course.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{s.course.name}</span>
                        <Badge variant="secondary" className="shrink-0">{s.analytics.total}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-primary" /> Top courses by completion rate
                </p>
                {topByCompletion.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No completion data yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {topByCompletion.map((s) => (
                      <li key={s.course.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{s.course.name}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {s.analytics.completionRate}% · {s.analytics.completed}/{s.analytics.total}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" /> Enrolment &amp; completion trend
                </p>
                <Select value={String(trendMonths)} onValueChange={(v) => setTrendMonths(Number(v) as 6 | 12 | 24)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Last 6 months</SelectItem>
                    <SelectItem value="12">Last 12 months</SelectItem>
                    <SelectItem value="24">Last 24 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="enrolments" name="New enrolments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="completions" name="Completions" fill="hsl(var(--chart-2, 142 71% 45%))" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="completionRate" name="Completion rate %" stroke="hsl(var(--chart-3, 24 95% 53%))" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" /> Enrolment breakdown by course (top 8)
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={breakdownData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
                    onClick={(state: any) => {
                      const payload = state?.activePayload?.[0]?.payload;
                      if (payload?.courseId != null) setDrilldownCourseId(payload.courseId);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Completed" stackId="a" fill="hsl(var(--chart-2, 142 71% 45%))" />
                    <Bar dataKey="In progress" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="Not started" stackId="a" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Tip: click a bar to drill into that course's trend.</p>
            </div>

            {drilldownSnapshot && (
              <div className="rounded-lg border p-3 bg-muted/20">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" /> {drilldownSnapshot.course.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {drilldownSnapshot.analytics.total} enrolled · {drilldownSnapshot.analytics.completed} completed · {drilldownSnapshot.analytics.completionRate}% completion rate
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setDrilldownCourseId(null)}>Close</Button>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={drilldownTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                      <RTooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="enrolments" name="New enrolments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="completions" name="Completions" fill="hsl(var(--chart-2, 142 71% 45%))" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="completionRate" name="Completion rate %" stroke="hsl(var(--chart-3, 24 95% 53%))" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
              <div className="rounded border p-2">
                <p className="text-muted-foreground">Completed in last 30 days</p>
                <p className="text-base font-semibold text-foreground">{totals.completedLast30.toLocaleString()}</p>
              </div>
              <div className="rounded border p-2">
                <p className="text-muted-foreground">Expired enrolments</p>
                <p className="text-base font-semibold text-foreground">{totals.totalExpired.toLocaleString()}</p>
              </div>
              <div className="rounded border p-2">
                <p className="text-muted-foreground">Courses with learners</p>
                <p className="text-base font-semibold text-foreground">
                  {totals.coursesWithLearners} / {totals.coursesAnalyzed}
                </p>
              </div>
              <div className="rounded border p-2">
                <p className="text-muted-foreground">Avg. learners / course</p>
                <p className="text-base font-semibold text-foreground">
                  {totals.coursesAnalyzed
                    ? Math.round(totals.totalEnrollments / totals.coursesAnalyzed)
                    : 0}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const CourseEnrollmentsBody = ({
  course, cdata, onRefresh, onLearnerClick, onPatch,
}: {
  course: ThinkificCourse;
  cdata: CourseData | undefined;
  onRefresh: () => void;
  onLearnerClick: (enrollment: Enrollment) => void;
  onPatch: (patch: Partial<CourseData>) => void;
}) => {
  const [emailOpen, setEmailOpen] = useState(false);

  if (!cdata || cdata.loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const a = cdata.analytics;
  const q = cdata.search.trim().toLowerCase();
  const status = cdata.statusFilter;
  const activeSinceMs = cdata.activeSince ? new Date(cdata.activeSince).getTime() : 0;
  const filtered = cdata.enrollments.filter((e) => {
    if (q) {
      const matches =
        e.user_name?.toLowerCase().includes(q) ||
        e.user_email?.toLowerCase().includes(q) ||
        String(e.user_id).includes(q);
      if (!matches) return false;
    }
    const pct = Number(e.percentage_completed || 0);
    if (pct < cdata.minProgress || pct > cdata.maxProgress) return false;
    if (activeSinceMs) {
      const last = e.updated_at || e.completed_at || e.activated_at || e.started_at || e.created_at;
      const ts = last ? new Date(last).getTime() : 0;
      if (!ts || ts < activeSinceMs) return false;
    }
    switch (status) {
      case "completed": return e.completed;
      case "in_progress": return !e.completed && pct > 0;
      case "not_started": return !e.completed && pct === 0;
      case "expired": return !!e.expired;
      default: return true;
    }
  });

  const sorted = filtered.slice().sort((a, b) => {
    const dir = cdata.sortDir === "asc" ? 1 : -1;
    const ts = (s?: string) => (s ? new Date(s).getTime() : 0);
    switch (cdata.sortBy) {
      case "name":
        return dir * (a.user_name || a.user_email || "").localeCompare(b.user_name || b.user_email || "");
      case "progress":
        return dir * (Number(a.percentage_completed || 0) - Number(b.percentage_completed || 0));
      case "enrolled":
        return dir * (ts(a.activated_at || a.started_at || a.created_at) - ts(b.activated_at || b.started_at || b.created_at));
      case "active":
        return dir * (ts(a.updated_at) - ts(b.updated_at));
      case "completed":
        return dir * (ts(a.completed_at) - ts(b.completed_at));
      default:
        return 0;
    }
  });

  const pageSize = cdata.pageSize || 25;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(Math.max(1, cdata.page || 1), totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paged = sorted.slice(pageStart, pageStart + pageSize);

  return (
    <div className="space-y-4">
      {/* Analytics */}
      {a && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatTile icon={<Users className="h-4 w-4" />} label="Total enrolled" value={a.total} />
          <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={a.completed} />
          <StatTile icon={<Clock className="h-4 w-4" />} label="In progress" value={a.inProgress} />
          <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Avg. progress" value={`${a.avgProgress}%`} />
          <StatTile icon={<Award className="h-4 w-4" />} label="Completion rate" value={`${a.completionRate}%`} />
          <StatTile icon={<Users className="h-4 w-4" />} label="New (30d)" value={a.newLast30} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={cdata.search}
              onChange={(e) => onPatch({ search: e.target.value })}
              className="pl-9 w-[280px]"
            />
          </div>
          <Select value={status} onValueChange={(v) => onPatch({ statusFilter: v as CourseData["statusFilter"] })}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Progress</span>
            <Input
              type="number" min={0} max={100}
              value={cdata.minProgress}
              onChange={(e) => onPatch({ minProgress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              className="w-16 h-9"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number" min={0} max={100}
              value={cdata.maxProgress}
              onChange={(e) => onPatch({ maxProgress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              className="w-16 h-9"
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Active since</span>
            <Input
              type="date"
              value={cdata.activeSince}
              onChange={(e) => onPatch({ activeSince: e.target.value })}
              className="h-9 w-[150px]"
            />
          </div>
          <Select value={cdata.sortBy} onValueChange={(v) => onPatch({ sortBy: v as CourseData["sortBy"] })}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress">Sort: Progress</SelectItem>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="enrolled">Sort: Enrolled</SelectItem>
              <SelectItem value="active">Sort: Last active</SelectItem>
              <SelectItem value="completed">Sort: Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPatch({ sortDir: cdata.sortDir === "asc" ? "desc" : "asc" })}
          >
            {cdata.sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPatch({ search: "", statusFilter: "all", minProgress: 0, maxProgress: 100, activeSince: "" })}
          >
            Reset
          </Button>
          <span className="text-xs text-muted-foreground">
            {sorted.length} / {cdata.enrollments.length}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPatch({ pageSize: Number(v), page: 1 })}
          >
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
              <SelectItem value="250">250 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {course.slug && (
            <a
              href={`https://maarifasasa.thinkific.com/courses/${course.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> View course
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailOpen(true)}
            disabled={sorted.length === 0}
            title="Email the filtered learners"
          >
            <Mail className="h-3.5 w-3.5 mr-1" /> Email learners ({sorted.length})
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {cdata.enrollments.length === 0
              ? "No learners enrolled in this course yet."
              : "No learners match your filters."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Learner</TableHead>
                <TableHead className="w-[200px]">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="w-[80px] text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((e) => {
                const pct = Math.round(Number(e.percentage_completed || 0));
                return (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => onLearnerClick(e)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{e.user_name || `User #${e.user_id}`}</p>
                        <p className="text-xs text-muted-foreground">{e.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={pct} className="h-2" />
                        <p className="text-xs text-muted-foreground">{pct}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {e.completed ? (
                        <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
                      ) : pct > 0 ? (
                        <Badge variant="secondary">In progress</Badge>
                      ) : (
                        <Badge variant="outline">Not started</Badge>
                      )}
                      {e.expired && <Badge variant="destructive" className="ml-1">Expired</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {e.activated_at || e.started_at
                        ? new Date((e.activated_at || e.started_at)!).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {e.updated_at ? new Date(e.updated_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(ev) => { ev.stopPropagation(); onLearnerClick(e); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>
            Showing {pageStart + 1}–{Math.min(pageStart + pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPatch({ page: currentPage - 1 })}
            >
              Previous
            </Button>
            <span className="px-2">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPatch({ page: currentPage + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <BulkEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        audienceLabel={`learners enrolled in "${course.name}"`}
        recipients={sorted
          .filter((e) => !!e.user_email)
          .map((e) => ({ email: e.user_email as string, name: e.user_name || null }))}
      />
    </div>
  );
};

interface LessonProgress {
  id: number;
  name: string;
  content_type: string | null;
  position: number;
  completed: boolean;
  completed_at: string | null;
  inferred_from_enrollment?: boolean;
}

interface ChapterProgress {
  id: number;
  name: string;
  position: number;
  lessons: LessonProgress[];
  completed_count: number;
  total_count: number;
}

interface ProgressPayload {
  total_lessons: number;
  completed_lessons: number;
  percentage_completed: number;
  completion_source?: "lesson_completions" | "enrollment" | "course_structure";
  chapters: ChapterProgress[];
}

const LearnerProgressDrawer = ({
  open, onClose, enrollment, course,
}: {
  open: boolean;
  onClose: () => void;
  enrollment: Enrollment | null;
  course: ThinkificCourse | null;
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !enrollment || !course) return;
    let cancelled = false;
    setLoading(true);
    setProgress(null);
    setError(null);
    supabase.functions
      .invoke(`thinkific-user-course-progress?user_id=${enrollment.user_id}&course_id=${course.id}`, {
        method: "GET",
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setProgress(data as ProgressPayload);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError(e.message || "Failed to load progress");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, enrollment, course]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {enrollment?.user_name || `User #${enrollment?.user_id}`}
          </SheetTitle>
          <SheetDescription>
            {course?.name} · Lesson-by-lesson progress
          </SheetDescription>
        </SheetHeader>

        {enrollment && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Enrollment progress</span>
                <span className="font-semibold">
                  {Math.round(Number(enrollment.percentage_completed || 0))}%
                </span>
              </div>
              <Progress value={Number(enrollment.percentage_completed || 0)} className="h-2" />
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                <div>Email: <span className="text-foreground">{enrollment.user_email || "—"}</span></div>
                <div>Status: <span className="text-foreground">
                  {enrollment.completed ? "Completed" :
                    Number(enrollment.percentage_completed || 0) > 0 ? "In progress" : "Not started"}
                </span></div>
                <div>Enrolled: <span className="text-foreground">
                  {enrollment.activated_at || enrollment.started_at
                    ? new Date((enrollment.activated_at || enrollment.started_at)!).toLocaleDateString()
                    : "—"}
                </span></div>
                <div>Completed: <span className="text-foreground">
                  {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : "—"}
                </span></div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="border border-destructive/40 bg-destructive/10 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {progress && !loading && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <StatTile icon={<BookOpen className="h-4 w-4" />} label="Lessons" value={progress.total_lessons} />
                  <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Done" value={progress.completed_lessons} />
                  <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Progress" value={`${progress.percentage_completed}%`} />
                </div>

                {progress.completion_source === "enrollment" && (
                  <p className="text-xs text-muted-foreground">
                    Thinkific returned course-level progress without lesson completion timestamps, so lesson completion is aligned to the enrollment progress record.
                  </p>
                )}

                <Accordion type="multiple" defaultValue={progress.chapters.map((c) => String(c.id))} className="space-y-2">
                  {progress.chapters.map((ch) => (
                    <AccordionItem key={ch.id} value={String(ch.id)} className="border rounded-lg">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                        <div className="flex-1 text-left flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{ch.name}</span>
                          <Badge variant="secondary" className="shrink-0">
                            {ch.completed_count}/{ch.total_count}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-2">
                        {ch.lessons.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No lessons</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {ch.lessons.map((l) => (
                              <li key={l.id} className="flex items-start gap-2 text-sm py-1 border-b last:border-b-0">
                                <span className="mt-0.5 shrink-0">
                                  {l.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={l.completed ? "" : "text-muted-foreground"}>{l.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {l.content_type && <span className="capitalize">{l.content_type}</span>}
                                    {l.completed_at && (
                                      <span>· {new Date(l.completed_at).toLocaleString()}</span>
                                    )}
                                    {l.inferred_from_enrollment && <span>· From enrollment progress</span>}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ThinkificEnrollments;