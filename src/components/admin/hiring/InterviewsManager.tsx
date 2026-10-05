import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const InterviewsManager = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    application_id: "",
    stage: "interview",
    scheduled_at: "",
    duration_minutes: 60,
    format: "video",
    location_or_url: "",
    summary: "",
    recommendation: "",
    status: "scheduled",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from("interview_sessions").select("*").order("scheduled_at", { ascending: false }),
      supabase.from("job_applications").select("id, full_name, email"),
    ]);
    setSessions(s || []); setApps(a || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.application_id) return toast.error("Pick an applicant");
    const { error } = await supabase.from("interview_sessions").insert({
      ...form,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Interview scheduled");
    setOpen(false); load();
  };

  const updateStatus = async (s: any, status: string) => {
    const patch: any = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("interview_sessions").update(patch).eq("id", s.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Interviews</h3>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Schedule</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">Loading interviews…</TableCell></TableRow>
            ) : sessions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No interviews yet.</TableCell></TableRow>
            ) : sessions.map((s) => {
              const ap = apps.find((a) => a.id === s.application_id);
              return (
                <TableRow key={s.id}>
                  <TableCell>{ap?.full_name || "—"}</TableCell>
                  <TableCell className="capitalize">{s.stage}</TableCell>
                  <TableCell>{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="capitalize">{s.format}</TableCell>
                  <TableCell><Badge variant="secondary">{s.status}</Badge></TableCell>
                  <TableCell>
                    <Select value={s.status} onValueChange={(v) => updateStatus(s, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["scheduled", "completed", "cancelled", "no_show"].map((x) => (
                          <SelectItem key={x} value={x}>{x.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Schedule interview</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Applicant</Label>
                <Select value={form.application_id} onValueChange={(v) => setForm({ ...form, application_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select applicant" /></SelectTrigger>
                  <SelectContent>
                    {apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name} — {a.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["screening", "interview", "panel", "assessment", "final"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["video", "phone", "in_person"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>When</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
              <div className="md:col-span-2"><Label>Location / meeting URL</Label><Input value={form.location_or_url} onChange={(e) => setForm({ ...form, location_or_url: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Summary</Label><Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default InterviewsManager;