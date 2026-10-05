import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RefreshCw, Users, BookOpen, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listAudiences, refreshAudience, type EmailAudience } from "@/lib/engagement/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const AudiencesManager: React.FC = () => {
  const [audiences, setAudiences] = useState<EmailAudience[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<Partial<EmailAudience> | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; rows: any[] } | null>(null);
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [courseCountLoading, setCourseCountLoading] = useState(false);

  const loadCourses = async () => {
    if (courses.length || coursesLoading) return;
    setCoursesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-courses");
      if (error) throw error;
      setCourses(((data?.items as any[]) || []).map((c) => ({ id: c.id, name: c.name })));
    } catch (e: any) {
      toast.error(e.message || "Failed to load courses");
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadCourseCount = async (courseId: string) => {
    if (!courseId) return;
    setCourseCountLoading(true);
    setCourseCount(null);
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-course-enrollments", { body: { course_id: courseId } });
      if (error) throw error;
      setCourseCount((data?.analytics?.total as number) ?? null);
    } catch (e: any) {
      toast.error(e.message || "Failed to load enrollment count");
    } finally {
      setCourseCountLoading(false);
    }
  };

  useEffect(() => {
    if (creating?.type === "course_enrollment") loadCourses();
  }, [creating?.type]);

  const load = async () => {
    setLoading(true);
    const { data } = await listAudiences();
    setAudiences((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!creating?.name || !creating.type) { toast.error("Name and type required"); return; }
    if (creating.type === "course_enrollment" && !creating.course_id) { toast.error("Course ID required"); return; }
    const { error } = await supabase.from("email_audiences").insert({
      name: creating.name,
      description: creating.description ?? null,
      type: creating.type,
      course_id: creating.course_id ?? null,
      course_name: creating.course_name ?? null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Audience created — refresh to populate."); setCreating(null); load(); }
  };

  const doRefresh = async (a: EmailAudience, withPreview = false) => {
    setRefreshing(a.id);
    try {
      const r = await refreshAudience(a.id, withPreview);
      toast.success(`Found ${r.member_count.toLocaleString()} recipients`);
      if (withPreview && r.recipients) setPreview({ name: a.name, rows: r.recipients });
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to refresh");
    } finally { setRefreshing(null); }
  };

  const archive = async (a: EmailAudience) => {
    if (!confirm(`Archive "${a.name}"?`)) return;
    await supabase.from("email_audiences").update({ archived: true }).eq("id", a.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Audiences</h2>
          <p className="text-sm text-muted-foreground">Imported from Academy users and course enrollments.</p>
        </div>
        <Button onClick={() => setCreating({ type: "all_users" })}><Plus className="h-4 w-4 mr-2" /> New audience</Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : audiences.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No audiences yet. Create one to start sending campaigns.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {audiences.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-md bg-primary/10 p-2.5">
                  {a.type === "course_enrollment" ? <BookOpen className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{a.name}</h3>
                    <Badge variant="outline" className="text-[10px] capitalize">{a.type.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.member_count.toLocaleString()} recipients
                    {a.last_refreshed_at && ` • refreshed ${formatDistanceToNow(new Date(a.last_refreshed_at))} ago`}
                    {a.course_name && ` • ${a.course_name}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => doRefresh(a, true)} disabled={refreshing === a.id}>
                    {refreshing === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    <span className="ml-1">Refresh</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => archive(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!creating} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New audience</DialogTitle></DialogHeader>
          {creating && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={creating.name ?? ""} onChange={(e) => setCreating({ ...creating, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={creating.description ?? ""} onChange={(e) => setCreating({ ...creating, description: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={creating.type} onValueChange={(v: any) => setCreating({ ...creating, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">All Academy users</SelectItem>
                    <SelectItem value="course_enrollment">Course enrollment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {creating.type === "course_enrollment" && (
                <div>
                  <Label>Course</Label>
                  <Select
                    value={creating.course_id ?? ""}
                    onValueChange={(v) => {
                      const c = courses.find((x) => String(x.id) === v);
                      setCreating({ ...creating, course_id: v, course_name: c?.name ?? creating.course_name ?? null });
                      setCourseSearch("");
                      if (v) loadCourseCount(v);
                      else setCourseCount(null);
                    }}
                    disabled={coursesLoading && courses.length === 0}
                  >
                    <SelectTrigger>
                      {coursesLoading && courses.length === 0 ? (
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading courses…
                        </span>
                      ) : (
                        <SelectValue placeholder="Select a course" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 pb-2 pt-1 sticky top-0 bg-popover z-10">
                        <Input
                          placeholder="Search courses…"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>
                      {courses
                        .filter((c) => c.name.toLowerCase().includes(courseSearch.toLowerCase()) || String(c.id).includes(courseSearch))
                        .map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            <div className="flex flex-col">
                              <span>{c.name}</span>
                              <span className="text-xs text-muted-foreground">ID: {c.id}</span>
                            </div>
                          </SelectItem>
                        ))}
                      {courses.filter((c) => c.name.toLowerCase().includes(courseSearch.toLowerCase()) || String(c.id).includes(courseSearch)).length === 0 && (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">No courses match.</div>
                      )}
                    </SelectContent>
                  </Select>
                  {creating.course_id && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Selected: {creating.course_name || `Course ${creating.course_id}`}</span>
                      {courseCountLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : courseCount != null ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {courseCount.toLocaleString()} enrolled recipient{courseCount === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(null)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Preview — {preview?.name}</DialogTitle></DialogHeader>
          <div className="max-h-96 overflow-auto text-sm rounded border">
            <table className="w-full">
              <thead className="bg-muted/40 text-xs"><tr><th className="text-left p-2">Email</th><th className="text-left p-2">Name</th></tr></thead>
              <tbody>
                {(preview?.rows ?? []).map((r, i) => (
                  <tr key={i} className="border-t"><td className="p-2">{r.email}</td><td className="p-2 text-muted-foreground">{r.name || "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Showing first 50 recipients.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AudiencesManager;