import React, { useEffect, useMemo, useState } from "react";
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
import { FileText, Star, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
  "new", "screening", "shortlisted", "interview", "assessment",
  "reference_check", "offer", "hired", "rejected", "withdrawn",
];

const ApplicantsManager = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<any | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [newScore, setNewScore] = useState({ criterion: "", score: 3, max_score: 5, weight: 1, stage: "shortlist", notes: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: j }] = await Promise.all([
      supabase.from("job_applications").select("*").order("submitted_at", { ascending: false }),
      supabase.from("job_postings").select("id, title").order("created_at", { ascending: false }),
    ]);
    setApps(a || []); setJobs(j || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openApp = async (a: any) => {
    setActive(a);
    const { data } = await supabase.from("application_scores").select("*").eq("application_id", a.id).order("created_at", { ascending: false });
    setScores(data || []);
  };

  const viewResume = async (a: any) => {
    if (!a.resume_path) return toast.error("No resume on file");
    const { data, error } = await supabase.functions.invoke("careers-resume-url", { body: { path: a.resume_path } });
    if (error || !data?.url) return toast.error("Could not load resume");
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  const setStatus = async (a: any, status: string) => {
    const { error } = await supabase.from("job_applications").update({ status }).eq("id", a.id);
    if (error) return toast.error(error.message);
    await supabase.from("recruitment_audit_log").insert({
      entity_type: "job_application", entity_id: a.id, action: `status:${status}`, payload: { email: a.email },
    });
    setActive({ ...a, status });
    load();
  };

  const addScore = async () => {
    if (!active || !newScore.criterion.trim()) return toast.error("Criterion required");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("application_scores").insert({
      application_id: active.id,
      reviewer_id: u.user?.id,
      reviewer_name: u.user?.email,
      ...newScore,
    });
    if (error) return toast.error(error.message);
    setNewScore({ ...newScore, criterion: "", notes: "" });
    openApp(active);
  };

  const filtered = useMemo(() => apps.filter((a) => {
    if (jobFilter !== "all" && a.job_posting_id !== jobFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search && !`${a.full_name} ${a.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [apps, jobFilter, statusFilter, search]);

  const weightedTotal = useMemo(() => {
    if (!scores.length) return 0;
    const totalW = scores.reduce((s, r) => s + Number(r.weight || 1), 0) || 1;
    return scores.reduce((s, r) => s + (Number(r.score) / Number(r.max_score)) * Number(r.weight || 1), 0) / totalW * 100;
  }, [scores]);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold mr-auto">Applicants</h3>
          <Input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All postings</SelectItem>
              {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Posting</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">Loading applicants…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No applications match.</TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.full_name}</TableCell>
                <TableCell className="text-xs"><div>{a.email}</div>{a.phone && <div className="text-muted-foreground">{a.phone}</div>}</TableCell>
                <TableCell>{jobs.find((j) => j.id === a.job_posting_id)?.title || "—"}</TableCell>
                <TableCell><Badge variant="secondary">{a.status.replace(/_/g, " ")}</Badge></TableCell>
                <TableCell>{new Date(a.submitted_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => openApp(a)}>Open</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{active?.full_name}</DialogTitle></DialogHeader>
            {active && (
              <div className="space-y-5">
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {active.email}</div>
                  {active.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {active.phone}</div>}
                  {active.location && <div>📍 {active.location}</div>}
                  {active.portfolio_url && <div>🔗 <a className="underline" href={active.portfolio_url} target="_blank" rel="noopener noreferrer">Portfolio</a></div>}
                </div>
                {active.cover_letter && (
                  <div>
                    <Label>Cover letter</Label>
                    <div className="mt-1 text-sm whitespace-pre-wrap bg-muted/40 p-3 rounded">{active.cover_letter}</div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => viewResume(active)} disabled={!active.resume_path}>
                    <FileText className="h-4 w-4 mr-1" /> View resume
                  </Button>
                  <Select value={active.status} onValueChange={(v) => setStatus(active, v)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-1"><Star className="h-4 w-4" /> Scorecard</h4>
                    <span className="text-sm text-muted-foreground">Weighted: <b>{weightedTotal.toFixed(1)}%</b></span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-6 mb-3">
                    <Input placeholder="Criterion" value={newScore.criterion} onChange={(e) => setNewScore({ ...newScore, criterion: e.target.value })} className="md:col-span-2" />
                    <Select value={newScore.stage} onValueChange={(v) => setNewScore({ ...newScore, stage: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["shortlist", "interview", "assessment", "final"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" min={0} step="0.5" value={newScore.score} onChange={(e) => setNewScore({ ...newScore, score: Number(e.target.value) })} placeholder="Score" />
                    <Input type="number" min={1} value={newScore.max_score} onChange={(e) => setNewScore({ ...newScore, max_score: Number(e.target.value) })} placeholder="Max" />
                    <Input type="number" min={0} step="0.5" value={newScore.weight} onChange={(e) => setNewScore({ ...newScore, weight: Number(e.target.value) })} placeholder="Weight" />
                  </div>
                  <Textarea rows={2} placeholder="Notes" value={newScore.notes} onChange={(e) => setNewScore({ ...newScore, notes: e.target.value })} />
                  <Button size="sm" className="mt-2" onClick={addScore}>Add score</Button>
                  <div className="mt-3 space-y-1 text-sm">
                    {scores.map((s) => (
                      <div key={s.id} className="flex justify-between border-b py-1">
                        <span><b>{s.criterion}</b> <span className="text-muted-foreground">({s.stage})</span> — {s.reviewer_name}</span>
                        <span>{s.score}/{s.max_score} × {s.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setActive(null)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ApplicantsManager;