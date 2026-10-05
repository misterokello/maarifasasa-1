import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Loader2,
  Play,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useLearnerEnrollments, type LearnerEnrollment } from "@/hooks/useLearnerEnrollments";
import { useEnrollmentProgress } from "@/hooks/useEnrollmentProgress";
import { useCourseLaunch } from "@/hooks/useCourseLaunch";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
}

const courseTitle = (e: LearnerEnrollment) =>
  e.product?.name ||
  (e.metadata?.thinkific_course_name as string | undefined) ||
  "Your course";

const courseImage = (e: LearnerEnrollment) =>
  (e.metadata?.thinkific_course_image_url as string | undefined) || null;

const courseUrl = (e: LearnerEnrollment) =>
  e.product?.thinkific_course_url ||
  (e.metadata?.thinkific_course_url as string | undefined) ||
  null;

/** Gradient placeholder so cards without Thinkific artwork still look intentional. */
const CourseArt = ({
  enrollment,
  className,
}: {
  enrollment: LearnerEnrollment;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const src = courseImage(enrollment);
  const title = courseTitle(enrollment);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${title} course cover`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      className={`h-full w-full bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/30 flex items-center justify-center ${className ?? ""}`}
    >
      <GraduationCap className="h-10 w-10 text-primary/70" />
    </div>
  );
};

export const ContinueLearning = ({ userId }: Props) => {
  const { enrollments, loading, reload, syncFromThinkific } = useLearnerEnrollments(userId);
  const [refreshing, setRefreshing] = useState(false);
  const { launch, launching, errors: launchErrors, clearError, openFallback } = useCourseLaunch();

  // Only real seats: rows tied to a Thinkific enrollment (synced) or still
  // being provisioned after payment. Cancelled/refunded seats are excluded.
  const myCourses = useMemo(
    () =>
      enrollments.filter(
        (e) =>
          e.status !== "cancelled" &&
          e.status !== "refunded" &&
          (!!e.thinkific_enrollment_id || e.status === "pending_sync"),
      ),
    [enrollments],
  );

  const inProgress = useMemo(() => myCourses.filter((e) => !e.completed_at), [myCourses]);
  const completed = useMemo(() => myCourses.filter((e) => !!e.completed_at), [myCourses]);

  const ids = useMemo(
    () => myCourses.map((e) => e.thinkific_enrollment_id).filter((x): x is number => !!x),
    [myCourses],
  );
  const { progress: liveProgress, refresh: refreshProgress } = useEnrollmentProgress(ids);
  const launchedRef = useRef(false);

  const pctOf = (e: LearnerEnrollment) => {
    const live = e.thinkific_enrollment_id ? liveProgress[e.thinkific_enrollment_id] : undefined;
    const value = live ?? Number(e.progress_percent ?? 0);
    return Math.max(0, Math.min(100, Math.round(value)));
  };

  // Refresh when the learner comes back from the Thinkific tab.
  useEffect(() => {
    const onFocus = () => {
      if (!launchedRef.current) return;
      launchedRef.current = false;
      reload();
      refreshProgress();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload, refreshProgress]);

  const handleLaunch = (enrollment: LearnerEnrollment) => {
    launchedRef.current = true;
    launch(enrollment.id, courseUrl(enrollment));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke("thinkific-sync", {
        body: { drain: true, trigger: "manual" },
      });
      await syncFromThinkific();
    } catch (err) {
      console.warn("[ContinueLearning] manual sync failed", err);
    }
    await reload();
    await refreshProgress();
    setRefreshing(false);
    toast.success("Synced with your learning account");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (!myCourses.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No courses yet</h3>
            <p className="text-muted-foreground">
              Once you enrol, your courses and progress will appear here automatically.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => (window.location.href = "/learning")}>Explore programs</Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync courses
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hero = inProgress[0] ?? myCourses[0];
  const heroPending = hero.status === "pending_sync";
  const heroProgress = pctOf(hero);
  const heroError = launchErrors[hero.id];
  const pendingSince = hero.created_at ? new Date(hero.created_at) : null;
  const waitedLabel = pendingSince
    ? formatDistanceToNowStrict(pendingSince, { addSuffix: false })
    : null;

  const rest = myCourses.filter((e) => e.id !== hero.id);

  const renderTile = (e: LearnerEnrollment) => {
    const pct = pctOf(e);
    const pending = e.status === "pending_sync";
    const done = !!e.completed_at;
    const tileError = launchErrors[e.id];

    return (
      <Card key={e.id} className="overflow-hidden flex flex-col group">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <CourseArt
            enrollment={e}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 flex gap-1">
            {done ? (
              <Badge className="gap-1 bg-primary text-primary-foreground">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </Badge>
            ) : (
              e.product?.category && (
                <Badge variant="secondary" className="capitalize">
                  {e.product.category}
                </Badge>
              )
            )}
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 pt-4">
          <h4 className="font-semibold leading-snug line-clamp-2">{courseTitle(e)}</h4>
          <div className="mt-auto space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pending ? "Preparing access" : "Progress"}</span>
                <span className="font-medium text-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
            <Button
              size="sm"
              variant={done ? "outline" : "default"}
              className="w-full gap-2"
              disabled={pending || launching === e.id}
              onClick={() => handleLaunch(e)}
            >
              {pending ? (
                "Preparing…"
              ) : launching === e.id ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Opening…
                </>
              ) : (
                <>
                  {tileError ? <RotateCw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {tileError ? "Retry" : done ? "Review course" : "Continue"}
                  <ExternalLink className="h-3 w-3" />
                </>
              )}
            </Button>
            {tileError && (
              <p className="text-xs text-destructive flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{tileError.message}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">My Learning</h2>
          <p className="text-sm text-muted-foreground">
            {myCourses.length} enrolled course{myCourses.length === 1 ? "" : "s"} ·{" "}
            {completed.length} completed
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {refreshing ? "Syncing…" : "Sync progress"}
        </Button>
      </div>

      {/* Featured resume card */}
      <Card className="overflow-hidden border-primary/40">
        <div className="grid md:grid-cols-[280px_1fr]">
          <div className="relative aspect-[16/9] md:aspect-auto md:h-full min-h-[180px] bg-muted">
            <CourseArt enrollment={hero} />
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {hero.completed_at ? "Completed course" : "Continue where you left off"}
              </p>
              <h3 className="text-2xl font-bold leading-tight">{courseTitle(hero)}</h3>
              {hero.activated_at && (
                <p className="text-sm text-muted-foreground">
                  Started {format(new Date(hero.activated_at), "MMM d, yyyy")}
                </p>
              )}
            </div>

            {heroPending ? (
              <div className="rounded-md bg-amber-500/10 text-amber-900 dark:text-amber-200 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">
                      Your access is being finalized{waitedLabel ? ` (${waitedLabel} so far)` : ""}.
                    </p>
                    <p className="text-xs opacity-90">
                      Payment confirmed — we're provisioning your seat. Tap sync to check now.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{heroProgress}%</span>
                </div>
                <Progress value={heroProgress} className="h-2" />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleLaunch(hero)}
                disabled={heroPending || launching === hero.id}
                className="gap-2"
              >
                {launching === hero.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {hero.completed_at ? "Review course" : "Resume learning"}
                <ExternalLink className="h-3 w-3" />
              </Button>
              {hero.product?.category && (
                <Badge variant="secondary" className="self-center capitalize">
                  {hero.product.category}
                </Badge>
              )}
            </div>

            {heroError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive p-3 text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">We couldn't open your course.</p>
                    <p className="text-xs opacity-90">{heroError.message}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                    disabled={launching === hero.id}
                    onClick={() => handleLaunch(hero)}
                  >
                    <RotateCw className="h-3 w-3" /> Retry
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => openFallback(hero.id)}>
                    Open sign-in page
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => clearError(hero.id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rest.map(renderTile)}</div>
      )}
    </div>
  );
};
