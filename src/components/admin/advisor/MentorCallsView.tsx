import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Video, Calendar, ExternalLink, Loader2, AlertCircle, Copy, Check, Eye, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";

interface MentorCall {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_date: string;
  preferred_time: string;
  timezone: string;
  topic: string | null;
  notes: string | null;
  status: string;
  meet_link: string | null;
  calendar_event_id: string | null;
  admin_notes: string | null;
  scheduled_at: string | null;
  created_at: string;
  assessment_id: string | null;
}

export default function MentorCallsView() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState<MentorCall | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [hasGoogle, setHasGoogle] = useState<boolean | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<null | {
    event_id: string;
    meet_link: string;
    summary: string;
    description: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees: { email: string; displayName?: string }[];
    html_link?: string | null;
  }>(null);

  useEffect(() => {
    if (params.get("google") === "connected") toast.success("Google connected");
    if (params.get("google_error")) toast.error("Could not connect Google. Try again.");
    void checkGoogle();
  }, [params]);

  const checkGoogle = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setHasGoogle(false); return; }
    const { data } = await supabase.from("admin_google_tokens").select("user_id").eq("user_id", session.user.id).maybeSingle();
    setHasGoogle(!!data);
  };

  const { data: calls, isLoading } = useQuery({
    queryKey: ["admin-mentor-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_call_requests")
        .select("*")
        .order("preferred_date", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MentorCall[];
    },
    refetchInterval: 30_000,
  });

  const schedule = async () => {
    if (!selected) return;
    if (!hasGoogle) { toast.error("Connect Google in Settings first."); return; }
    setScheduling(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-mentor-schedule", {
        body: {
          request_id: selected.id,
          admin_notes: adminNotes || undefined,
          send_invite: true,
          mode: "schedule",
          event_id: preview?.event_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Mentor call scheduled & invite sent");
      qc.invalidateQueries({ queryKey: ["admin-mentor-calls"] });
      setPreview(null);
      setSelected(null);
    } catch (e: any) {
      toast.error(e?.message || "Could not schedule");
    } finally {
      setScheduling(false);
    }
  };

  const generatePreview = async () => {
    if (!selected) return;
    if (!hasGoogle) { toast.error("Connect Google in Settings first."); return; }
    setPreviewing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-mentor-schedule", {
        body: {
          request_id: selected.id,
          admin_notes: adminNotes || undefined,
          send_invite: true,
          mode: "preview",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPreview(data);
    } catch (e: any) {
      toast.error(e?.message || "Could not generate preview");
    } finally {
      setPreviewing(false);
    }
  };

  const discardPreview = async () => {
    if (!preview || !selected) { setPreview(null); return; }
    try {
      await supabase.functions.invoke("admin-mentor-schedule", {
        body: {
          request_id: selected.id,
          mode: "cancel_preview",
          event_id: preview.event_id,
        },
      });
    } catch { /* ignore */ }
    setPreview(null);
  };

  const closeDialog = async () => {
    if (preview) await discardPreview();
    setSelected(null);
    setPreview(null);
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("mentor_call_requests").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Marked cancelled"); qc.invalidateQueries({ queryKey: ["admin-mentor-calls"] }); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      scheduled: "bg-emerald-100 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-100 text-rose-700 border-rose-200",
      completed: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return <Badge className={`${map[s] || "bg-muted"} border`}>{s}</Badge>;
  };

  return (
    <div className="space-y-4">
      {hasGoogle === false && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1 text-sm">
            <strong>Connect your Google account</strong> in the Settings tab to auto-create Calendar events with Meet links.
          </div>
        </div>
      )}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : !calls?.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No mentor call requests yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Learner</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meet</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div>{format(new Date(c.preferred_date), "EEE, d MMM")}</div>
                      <div className="text-xs text-muted-foreground">{c.preferred_time} · {c.timezone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-sm truncate">{c.topic || "—"}</div>
                    </TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell>
                      {c.meet_link ? (
                        <div className="flex items-center gap-1">
                          <a href={c.meet_link} target="_blank" rel="noreferrer" className="text-primary text-sm inline-flex items-center gap-1 hover:underline">
                            Join <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(c.meet_link!);
                              setCopiedId(c.id);
                              setTimeout(() => setCopiedId(null), 1200);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === c.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {c.status !== "scheduled" && c.status !== "cancelled" && (
                        <Button size="sm" onClick={() => { setSelected(c); setAdminNotes(c.admin_notes || ""); }}>
                          <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule
                        </Button>
                      )}
                      {c.status === "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => cancel(c.id)}>Cancel</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Video className="w-5 h-5 text-primary" /> Schedule mentor call</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div><strong>{selected.full_name}</strong> · {selected.email}</div>
                <div className="text-muted-foreground">{format(new Date(selected.preferred_date), "EEE, d MMM yyyy")} · {selected.preferred_time} · {selected.timezone}</div>
                {selected.topic && <div className="pt-1">Topic: {selected.topic}</div>}
                {selected.notes && <div className="text-xs italic">"{selected.notes}"</div>}
              </div>
              {!preview && (
                <>
                  <div>
                    <Label htmlFor="anotes">Internal notes (optional, included in Calendar event)</Label>
                    <Textarea id="anotes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generate a preview to see the exact Calendar event &amp; Meet link before sending the invite.
                  </p>
                </>
              )}

              {preview && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3">
                    <div className="text-xs uppercase tracking-wider opacity-90">Calendar event preview</div>
                    <div className="font-semibold mt-0.5">{preview.summary}</div>
                  </div>
                  <div className="p-4 space-y-3 text-sm bg-card">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(preview.start.dateTime), "EEE, d MMM yyyy · HH:mm")}
                          {" – "}
                          {format(new Date(preview.end.dateTime), "HH:mm")}
                        </div>
                        <div className="text-xs text-muted-foreground">{preview.start.timeZone}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Video className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground mb-0.5">Google Meet link</div>
                        {preview.meet_link ? (
                          <div className="flex items-center gap-2">
                            <a href={preview.meet_link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate text-sm">
                              {preview.meet_link}
                            </a>
                            <button
                              onClick={async () => { await navigator.clipboard.writeText(preview.meet_link); toast.success("Copied"); }}
                              className="text-muted-foreground hover:text-foreground shrink-0"
                              title="Copy"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : <div className="text-xs text-muted-foreground italic">No Meet link returned</div>}
                      </div>
                    </div>
                    {preview.attendees.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">Will be invited</div>
                          {preview.attendees.map((a) => (
                            <div key={a.email} className="text-sm">{a.displayName ? `${a.displayName} · ` : ""}{a.email}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {preview.description && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Description</div>
                        <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/80 max-h-32 overflow-auto">{preview.description}</pre>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-900">
                    Draft event is on your calendar but the learner has <strong>not</strong> been notified yet.
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {!preview ? (
              <>
                <Button variant="ghost" onClick={closeDialog}>Close</Button>
                <Button onClick={generatePreview} disabled={previewing || !hasGoogle}>
                  {previewing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</> : <><Eye className="w-4 h-4 mr-2" /> Generate preview</>}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={discardPreview} disabled={scheduling}>Discard preview</Button>
                <Button onClick={schedule} disabled={scheduling}>
                  {scheduling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending invite…</> : <><Calendar className="w-4 h-4 mr-2" /> Confirm &amp; send invite</>}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
