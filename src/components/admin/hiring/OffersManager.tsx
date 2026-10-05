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

const STATUSES = ["draft", "approved", "sent", "accepted", "declined", "withdrawn"];

const OffersManager = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    application_id: "", job_title: "", salary: "", benefits: "",
    start_date: "", probation_months: 6, contract_type: "permanent",
    reports_to: "", conditions: "", content: "", status: "draft",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from("offer_letters").select("*").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("id, full_name, email"),
    ]);
    setRows(r || []); setApps(a || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.application_id || !form.job_title) return toast.error("Applicant and job title required");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("offer_letters").insert({
      ...form,
      start_date: form.start_date || null,
      created_by: u.user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Offer created");
    setOpen(false); load();
  };

  const setStatus = async (r: any, status: string) => {
    const patch: any = { status };
    if (status === "sent") patch.sent_at = new Date().toISOString();
    if (status === "accepted") patch.accepted_at = new Date().toISOString();
    const { error } = await supabase.from("offer_letters").update(patch).eq("id", r.id);
    if (error) return toast.error(error.message);
    await supabase.from("recruitment_audit_log").insert({
      entity_type: "offer_letter", entity_id: r.id, action: `status:${status}`, payload: {},
    });
    load();
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Offer letters</h3>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Draft offer</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">Loading offers…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No offers yet.</TableCell></TableRow>
            ) : rows.map((r) => {
              const ap = apps.find((a) => a.id === r.application_id);
              return (
                <TableRow key={r.id}>
                  <TableCell>{ap?.full_name || "—"}</TableCell>
                  <TableCell>{r.job_title}</TableCell>
                  <TableCell>{r.salary || "—"}</TableCell>
                  <TableCell>{r.start_date ? new Date(r.start_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Draft offer</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Applicant</Label>
                <Select value={form.application_id} onValueChange={(v) => setForm({ ...form, application_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name} — {a.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Job title</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
              <div><Label>Salary</Label><Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
              <div>
                <Label>Contract type</Label>
                <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["permanent", "fixed_term", "part_time", "consultant", "internship"].map((s) =>
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>Probation (months)</Label><Input type="number" value={form.probation_months} onChange={(e) => setForm({ ...form, probation_months: Number(e.target.value) })} /></div>
              <div className="md:col-span-2"><Label>Reports to</Label><Input value={form.reports_to} onChange={(e) => setForm({ ...form, reports_to: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Benefits</Label><Textarea rows={2} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Conditions / contingencies</Label><Textarea rows={2} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Letter content</Label><Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Body of the offer letter" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save draft</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OffersManager;