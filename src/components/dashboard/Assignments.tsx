import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, ClipboardList, ExternalLink, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useLearnerEnrollments } from "@/hooks/useLearnerEnrollments";
import { useEnrollmentProgress } from "@/hooks/useEnrollmentProgress";
import { useCourseLaunch } from "@/hooks/useCourseLaunch";

interface Props {
  userId: string;
}

/**
 * Learner "assignments" view. We surface every enrolled course that still
 * has outstanding work (progress < 100%), sorted by how close the learner
 * is to completion — the classic "keep going, you're almost there" list.
 * Detailed per-lesson assignments live in the learning platform itself.
 */
export const Assignments = ({ userId }: Props) => {
  const { enrollments, loading } = useLearnerEnrollments(userId);
  const { launch, launching, errors: launchErrors } = useCourseLaunch();
  const ids = useMemo(
    () => enrollments.map((e) => e.thinkific_enrollment_id).filter((x): x is number => !!x),
    [enrollments],
  );
  const { progress: liveProgress } = useEnrollmentProgress(ids);

  if (loading) return <Skeleton className="h-64 w-full" />;

  const rows = enrollments
    .filter((e) => e.status !== "cancelled")
    .map((e) => {
      const pct = e.thinkific_enrollment_id
        ? liveProgress[e.thinkific_enrollment_id] ?? Number(e.progress_percent ?? 0)
        : Number(e.progress_percent ?? 0);
      return { e, pct };
    })
    .filter(({ pct, e }) => pct < 100 && !e.completed_at)
    .sort((a, b) => b.pct - a.pct);

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">You're all caught up 🎉</h3>
          <p className="text-muted-foreground">
            No outstanding coursework. Explore new programs to keep learning.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          Coursework to complete
        </CardTitle>
        <CardDescription>
          Pick up any course below to jump straight to your next lesson. Detailed
          assignment submissions happen inside the course.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map(({ e, pct }) => {
          const pending = e.status === "pending_sync";
          const remaining = Math.max(0, 100 - pct);
          const err = launchErrors[e.id];
          return (
            <div
              key={e.id}
              className="p-4 border rounded-lg space-y-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{e.product?.name || "Course"}</p>
                    {e.product?.category && (
                      <Badge variant="outline" className="capitalize text-xs">
                        {e.product.category}
                      </Badge>
                    )}
                    {pending && (
                      <Badge variant="secondary" className="text-xs">
                        Setting up
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pct === 0
                      ? "Not started yet — jump in whenever you're ready."
                      : `~${Math.round(remaining)}% remaining to reach your certificate.`}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-2 shrink-0"
                  disabled={pending || launching === e.id}
                  onClick={() => launch(e.id, e.product?.thinkific_course_url)}
                >
                  {launching === e.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  {err ? "Retry" : pct === 0 ? "Start now" : "Continue"}
                  {launching !== e.id && <ExternalLink className="h-3 w-3" />}
                </Button>
              </div>
              <Progress value={pct} className="h-1.5" />
              {err && (
                <p className="text-xs text-destructive flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Couldn't open course — {err.message}</span>
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};