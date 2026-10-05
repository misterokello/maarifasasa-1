import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Award, CheckCircle2, Clock, Download, Loader2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  user_id: string;
  thinkific_course_id: string | null;
  progress_percent: number | null;
  completed_at: string | null;
  activated_at: string | null;
  created_at: string;
  status: string;
  metadata: Record<string, any> | null;
  product: { id: string; name: string; category: string | null } | null;
  learner: { id: string; full_name: string | null; email: string | null } | null;
};

type CourseGroup = {
  key: string;
  name: string;
  category: string | null;
  rows: Row[];
  enrolled: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  avgProgress: number;
  completionRate: number;
};

const pctOf = (r: Row) => Math.max(0, Math.min(100, Number(r.progress_percent ?? 0)));
const isComplete = (r: Row) => !!r.completed_at || pctOf(r) >= 100;

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

function toCsv(groups: CourseGroup[]): string {
  const head = [
    "course",
    "category",
    "learner",
    "email",
    "status",
    "progress_percent",
    "enrolled_at",
    "completed_at",
  ];
  const lines = [head.join(",")];
  for (const g of groups) {
    for (const r of g.rows) {
      const cells = [
        g.name,
        g.category ?? "",
        r.learner?.full_name ?? "",
        r.learner?.email ?? "",
        isComplete(r) ? "completed" : pctOf(r) > 0 ? "in_progress" : "not_started",
        String(pctOf(r)),
        r.activated_at ?? r.created_at ?? "",
        r.completed_at ?? "",
      ];
      lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    }
  }
  return lines.join("\n");
}

const CourseOutcomes: React.FC = () => {
  const [search, setSearch] = React.useState("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-course-outcomes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `id, user_id, thinkific_course_id, progress_percent, completed_at, activated_at,
           created_at, status, metadata,
           product:products(id, name, category),
           learner:profiles!enrollments_user_id_fkey(id, full_name, email)`,
        )
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    staleTime: 60_000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("thinkific-completion-sync", {
        body: {},
      });
      if (error) throw error;
      return data as Record<string, any>;
    },
    onSuccess: (res) => {
      toast.success("Completion data refreshed", {
        description: `${res?.scanned ?? 0} academy enrollments scanned · ${res?.updated ?? 0} updated · ${res?.created ?? 0} added`,
      });
      refetch();
    },
    onError: (e: any) =>
      toast.error("Could not sync completions", { description: e?.message ?? "Unknown error" }),
  });

  const groups: CourseGroup[] = React.useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of data ?? []) {
      const key = r.product?.id || r.thinkific_course_id || "unmapped";
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    const out: CourseGroup[] = [];
    map.forEach((rows, key) => {
      const first = rows[0];
      const name =
        first.product?.name ||
        (first.metadata?.thinkific_course_name as string) ||
        (first.thinkific_course_id ? `Academy course ${first.thinkific_course_id}` : "Unmapped course");
      const completed = rows.filter(isComplete).length;
      const inProgress = rows.filter((r) => !isComplete(r) && pctOf(r) > 0).length;
      const notStarted = rows.length - completed - inProgress;
      const avgProgress = Math.round(rows.reduce((s, r) => s + pctOf(r), 0) / rows.length);
      out.push({
        key,
        name,
        category: first.product?.category ?? null,
        rows,
        enrolled: rows.length,
        completed,
        inProgress,
        notStarted,
        avgProgress,
        completionRate: Math.round((completed / rows.length) * 100),
      });
    });
    return out.sort((a, b) => b.enrolled - a.enrolled);
  }, [data]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        rows: g.rows.filter(
          (r) =>
            g.name.toLowerCase().includes(q) ||
            (r.learner?.full_name ?? "").toLowerCase().includes(q) ||
            (r.learner?.email ?? "").toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.name.toLowerCase().includes(q) || g.rows.length > 0);
  }, [groups, search]);

  const totals = React.useMemo(() => {
    const rows = data ?? [];
    const completed = rows.filter(isComplete).length;
    return {
      enrollments: rows.length,
      learners: new Set(rows.map((r) => r.user_id)).size,
      completed,
      rate: rows.length ? Math.round((completed / rows.length) * 100) : 0,
    };
  }, [data]);

  const download = () => {
    const csv = toCsv(groups);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `course-outcomes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          Could not load course outcomes: {(error as any)?.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4 text-primary" />} label="Learners tracked" value={totals.learners} />
        <Stat icon={<Clock className="h-4 w-4 text-blue-500" />} label="Enrollments" value={totals.enrollments} />
        <Stat
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          label="Completions"
          value={totals.completed}
        />
        <Stat icon={<Award className="h-4 w-4 text-primary" />} label="Completion rate" value={`${totals.rate}%`} />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">Course outcomes</CardTitle>
              <CardDescription>
                Who completed each course, based on synced academy progress.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync completions
              </Button>
              <Button variant="outline" size="sm" onClick={download} disabled={!groups.length}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          <Input
            placeholder="Search course, learner name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {isFetching && <p className="mb-3 text-xs text-muted-foreground">Refreshing…</p>}
          {!filtered.length ? (
            <p className="py-10 text-center text-muted-foreground">No enrollment data yet.</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filtered.map((g) => (
                <AccordionItem key={g.key} value={g.key}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full flex-col gap-2 pr-2 text-left md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{g.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {g.category || "program"} · {g.enrolled} enrolled · {g.completed} completed ·{" "}
                          {g.inProgress} in progress · {g.notStarted} not started
                        </p>
                      </div>
                      <div className="flex items-center gap-3 md:w-56">
                        <Progress value={g.completionRate} className="h-2 flex-1" />
                        <Badge variant={g.completionRate >= 50 ? "default" : "secondary"}>
                          {g.completionRate}%
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Learner</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Enrolled</TableHead>
                            <TableHead>Completed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {g.rows
                            .slice()
                            .sort((a, b) => pctOf(b) - pctOf(a))
                            .map((r) => (
                              <TableRow key={r.id}>
                                <TableCell className="max-w-[220px]">
                                  <p className="truncate font-medium">
                                    {r.learner?.full_name || r.learner?.email || "Learner"}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {r.learner?.email}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  {isComplete(r) ? (
                                    <Badge className="bg-emerald-600 hover:bg-emerald-600">Completed</Badge>
                                  ) : pctOf(r) > 0 ? (
                                    <Badge variant="secondary">In progress</Badge>
                                  ) : (
                                    <Badge variant="outline">Not started</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="w-40">
                                  <div className="flex items-center gap-2">
                                    <Progress value={pctOf(r)} className="h-2 w-20" />
                                    <span className="text-xs text-muted-foreground">{pctOf(r)}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {fmtDate(r.activated_at ?? r.created_at)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {fmtDate(r.completed_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

export default CourseOutcomes;
