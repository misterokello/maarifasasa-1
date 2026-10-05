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
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

const empty = {
  title: "",
  department: "",
  reports_to: "",
  justification: "",
  is_replacement: false,
  budget_line: "",
  funding_source: "",
  proposed_grade: "",
  proposed_salary_band: "",
  required_start_date: "",
  approver_role: "hr_lead",
};

const RecruitmentRequestsManager = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [decision, setDecision] = useState<{ row: any; status: "approved" | "rejected"; notes: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("recruitment_requests").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.justification.trim()) return toast.error("Title and justification required");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("recruitment_requests").insert({
      ...form,
      required_start_date: form.required_start_date || null,
      requested_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Request submitted for approval");
    setOpen(false); setForm(empty); load();
  };

  const submitDecision = async () => {
    if (!decision) return;
    const { row: r, status, notes } = decision;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("recruitment_requests").update({
      status, decision_notes: notes || null, decided_by: u.user?.id, decided_at: new Date().toISOString(),
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("recruitment_audit_log").insert({
      entity_type: "recruitment_request", entity_id: r.id, action: `decision:${status}`, payload: { notes },
    });
    toast.success(`Request ${status}`);
    setDecision(null);
    load();
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recruitment requests</h3>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New request</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Dept</TableHead>
              <TableHead>Approver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Loading requests…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">No requests yet.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.department || "—"}</TableCell>
                <TableCell className="capitalize">{r.approver_role.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setDecision({ row: r, status: "approved", notes: "" })}><Check className="h-3 w-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => setDecision({ row: r, status: "rejected", notes: "" })}><X className="h-3 w-3 mr-1" /> Reject</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New recruitment request</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>Reports to</Label><Input value={form.reports_to} onChange={(e) => setForm({ ...form, reports_to: e.target.value })} /></div>
              <div><Label>Budget line</Label><Input value={form.budget_line} onChange={(e) => setForm({ ...form, budget_line: e.target.value })} /></div>
              <div><Label>Funding source</Label><Input value={form.funding_source} onChange={(e) => setForm({ ...form, funding_source: e.target.value })} /></div>
              <div><Label>Proposed grade</Label><Input value={form.proposed_grade} onChange={(e) => setForm({ ...form, proposed_grade: e.target.value })} /></div>
              <div><Label>Salary band</Label><Input value={form.proposed_salary_band} onChange={(e) => setForm({ ...form, proposed_salary_band: e.target.value })} /></div>
              <div><Label>Required start date</Label><Input type="date" value={form.required_start_date} onChange={(e) => setForm({ ...form, required_start_date: e.target.value })} /></div>
              <div>
                <Label>Approver</Label>
                <Select value={form.approver_role} onValueChange={(v) => setForm({ ...form, approver_role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr_lead">HR Lead</SelectItem>
                    <SelectItem value="ceo">CEO</SelectItem>
                    <SelectItem value="board">Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Justification *</Label><Textarea rows={4} value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {decision?.status === "approved" ? "Approve" : "Reject"} request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Decision notes (optional)</Label>
              <Textarea
                rows={4}
                value={decision?.notes ?? ""}
                onChange={(e) => decision && setDecision({ ...decision, notes: e.target.value })}
                placeholder="Rationale, conditions, or next steps"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
              <Button onClick={submitDecision}>
                Confirm {decision?.status === "approved" ? "approval" : "rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RecruitmentRequestsManager;