import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { useMemo } from "react";
import { useLearnerEnrollments } from "@/hooks/useLearnerEnrollments";
import { useEnrollmentProgress } from "@/hooks/useEnrollmentProgress";

interface Props {
  userId: string;
}

export const ProgressOverview = ({ userId }: Props) => {
  const { enrollments, loading } = useLearnerEnrollments(userId);
  const ids = useMemo(
    () => enrollments.map((e) => e.thinkific_enrollment_id).filter((x): x is number => !!x),
    [enrollments],
  );
  const { progress: liveProgress } = useEnrollmentProgress(ids);

  if (loading) return <Skeleton className="h-64 w-full" />;

  if (!enrollments.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Enroll in your first course to see progress here.
        </CardContent>
      </Card>
    );
  }

  const rows = enrollments.map((e) => {
    const pct = e.thinkific_enrollment_id
      ? liveProgress[e.thinkific_enrollment_id] ?? Number(e.progress_percent ?? 0)
      : Number(e.progress_percent ?? 0);
    return { e, pct };
  });

  const inProgress = rows.filter((r) => r.pct > 0 && r.pct < 100).length;
  const completed = rows.filter((r) => r.pct >= 100 || r.e.completed_at).length;
  const notStarted = rows.filter((r) => r.pct === 0 && !r.e.completed_at).length;
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="Enrolled" value={rows.length} />
        <StatCard
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          label="In progress"
          value={inProgress}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          label="Completed"
          value={completed}
        />
        <StatCard
          icon={<Award className="h-4 w-4 text-primary" />}
          label="Avg. progress"
          value={`${avg}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course progress</CardTitle>
          <CardDescription>Live from your learning account, refreshed on load.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map(({ e, pct }) => (
            <div key={e.id} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.product?.name || "Course"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {e.product?.category || "program"}
                    {e.completed_at ? " • completed" : e.status === "pending_sync" ? " • setting up" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pct >= 100 && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  )}
                  {notStarted > 0 && pct === 0 && !e.completed_at && (
                    <Badge variant="outline">Not started</Badge>
                  )}
                  <span className="text-sm font-medium tabular-nums w-10 text-right">
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-semibold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}