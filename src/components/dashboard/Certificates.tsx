import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Award, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";
import { useLearnerEnrollments } from "@/hooks/useLearnerEnrollments";
import { useEnrollmentProgress } from "@/hooks/useEnrollmentProgress";
import { useCourseLaunch } from "@/hooks/useCourseLaunch";

interface Props {
  userId: string;
}

export const Certificates = ({ userId }: Props) => {
  const { enrollments, loading } = useLearnerEnrollments(userId);
  const { launch, launching, errors: launchErrors } = useCourseLaunch();
  const ids = useMemo(
    () => enrollments.map((e) => e.thinkific_enrollment_id).filter((x): x is number => !!x),
    [enrollments],
  );
  const { progress: liveProgress } = useEnrollmentProgress(ids);

  if (loading) return <Skeleton className="h-64 w-full" />;

  const earned = enrollments.filter((e) => {
    const pct = e.thinkific_enrollment_id
      ? liveProgress[e.thinkific_enrollment_id] ?? Number(e.progress_percent ?? 0)
      : Number(e.progress_percent ?? 0);
    return e.completed_at || pct >= 100;
  });

  if (!earned.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
          <p className="text-muted-foreground">
            Complete a course to earn your first certificate. It'll appear here automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {earned.map((e) => {
        const err = launchErrors[e.id];
        return (
        <Card key={e.id} className="border-primary/40">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge className="mb-2 gap-1">
                  <Award className="h-3 w-3" /> Certificate earned
                </Badge>
                <CardTitle className="text-lg">{e.product?.name || "Course"}</CardTitle>
                <CardDescription>
                  Completed{" "}
                  {e.completed_at
                    ? format(new Date(e.completed_at), "MMM d, yyyy")
                    : "recently"}
                </CardDescription>
              </div>
              <Award className="h-8 w-8 text-primary shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={launching === e.id}
              onClick={() => launch(e.id, e.product?.thinkific_course_url)}
            >
              {launching === e.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              {err ? "Retry opening certificate" : "View / download certificate"}
              {launching !== e.id && <ExternalLink className="h-3 w-3" />}
            </Button>
            {err ? (
              <p className="text-xs text-destructive mt-2 flex items-start justify-center gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{err.message}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Certificates are issued and downloaded through your learning account.
              </p>
            )}
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
};