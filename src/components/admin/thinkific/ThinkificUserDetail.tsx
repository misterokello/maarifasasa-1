import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Mail, Calendar, Award, BookOpen, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Enrollment {
  id: number;
  course_id: number;
  course_name: string;
  user_id: number;
  percentage_completed: string | number;
  expired: boolean;
  is_free_trial: boolean;
  completed: boolean;
  started_at?: string;
  activated_at?: string;
  completed_at?: string;
  expiry_date?: string;
  updated_at?: string;
}

interface ThinkificUserFull {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  roles?: string[];
  affiliate_code?: string;
  company?: string;
  bio?: string;
  external_source?: string;
  timezone?: string;
  headline?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in?: string;
  custom_profile_fields?: Array<{ label?: string; name?: string; value?: string }>;
}

const ThinkificUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ThinkificUserFull | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [signInUrl, setSignInUrl] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        `thinkific-user-detail?user_id=${encodeURIComponent(userId)}`,
        { method: "GET" }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUser(data.user);
      setEnrollments(data.enrollments || []);
      setSignInUrl(data.sign_in_url || null);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          User not found.
          <div className="mt-4">
            <Button onClick={() => navigate("/admin-users")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to users
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const name = user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;
  const initials = (name || user.email).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const completedCount = enrollments.filter((e) => e.completed).length;
  const inProgressCount = enrollments.filter((e) => !e.completed && Number(e.percentage_completed) > 0).length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((a, e) => a + Number(e.percentage_completed || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin-users")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to users
        </Button>
        {signInUrl && (
          <a href={signInUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" /> Open in Thinkific
            </Button>
          </a>
        )}
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="h-20 w-20">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={name} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-tight">{name}</h2>
              {user.headline && <p className="text-sm text-muted-foreground">{user.headline}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                {user.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                )}
                {user.last_sign_in && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Last sign-in {new Date(user.last_sign_in).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {(user.roles || []).map((r) => (
                  <Badge key={r} variant="secondary">{r}</Badge>
                ))}
                {user.affiliate_code && (
                  <Badge variant="outline">Affiliate: {user.affiliate_code}</Badge>
                )}
                {user.company && <Badge variant="outline">{user.company}</Badge>}
              </div>
            </div>
          </div>

          {user.bio && (
            <>
              <Separator className="my-4" />
              <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="Enrollments" value={enrollments.length} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={completedCount} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="In progress" value={inProgressCount} />
        <StatCard icon={<Award className="h-4 w-4" />} label="Avg. progress" value={`${avgProgress}%`} />
      </div>

      {/* Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Course Enrollments</CardTitle>
          <CardDescription>Per-course progress, status and key dates from Thinkific.</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No enrollments yet.</p>
          ) : (
            <div className="space-y-4">
              {enrollments.map((e) => {
                const pct = Math.round(Number(e.percentage_completed || 0));
                return (
                  <div key={e.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{e.course_name}</h3>
                        <p className="text-xs text-muted-foreground">Enrollment #{e.id} · Course #{e.course_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {e.completed ? (
                          <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
                        ) : pct > 0 ? (
                          <Badge variant="secondary">In progress</Badge>
                        ) : (
                          <Badge variant="outline">Not started</Badge>
                        )}
                        {e.expired && <Badge variant="destructive">Expired</Badge>}
                        {e.is_free_trial && <Badge variant="outline">Free trial</Badge>}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span><span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs text-muted-foreground">
                      <DateBlock label="Started" value={e.started_at} />
                      <DateBlock label="Activated" value={e.activated_at} />
                      <DateBlock label="Completed" value={e.completed_at} />
                      <DateBlock label="Expires" value={e.expiry_date} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom fields */}
      {user.custom_profile_fields && user.custom_profile_fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Profile Fields</CardTitle>
            <CardDescription>Additional data collected on Thinkific.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.custom_profile_fields.map((f, i) => (
                <div key={i} className="border rounded-md p-3">
                  <dt className="text-xs uppercase text-muted-foreground">{f.label || f.name}</dt>
                  <dd className="text-sm font-medium mt-1 break-words">{f.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Raw extras */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <Field label="Thinkific ID" value={String(user.id)} />
            <Field label="Timezone" value={user.timezone} />
            <Field label="External source" value={user.external_source} />
            <Field label="Created" value={user.created_at ? new Date(user.created_at).toLocaleString() : undefined} />
            <Field label="Updated" value={user.updated_at ? new Date(user.updated_at).toLocaleString() : undefined} />
            <Field label="Affiliate code" value={user.affiliate_code} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const DateBlock = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="uppercase tracking-wide">{label}</p>
    <p className="text-foreground">{value ? new Date(value).toLocaleDateString() : "—"}</p>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs uppercase text-muted-foreground">{label}</p>
    <p className="font-medium break-words">{value || "—"}</p>
  </div>
);

export default ThinkificUserDetail;