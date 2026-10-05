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

const TYPES = ["reference", "qualification", "identity", "right_to_work", "criminal_record", "safeguarding", "medical"];

const ChecksManager = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    application_id: "", type: "reference", referee_name: "", referee_role: "",
    referee_email: "", referee_phone: "", status: "pending", notes: "",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from("reference_checks").select("*").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("id, full_name, email"),
    ]);
    setRows(r || []); setApps(a || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.application_id) return toast.error("Pick applicant");
    const { error } = await supabase.from("reference_checks").insert({ ...form, requested_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    toast.success("Check recorded");
    setOpen(false); load();
  };

  const setStatus = async (r: any, status: string) => {
    const patch: any = { status };
    if (status === "completed" || status === "failed") {
      patch.completed_at = new Date().toISOString();
      const { data: u } = await supabase.auth.getUser();
      patch.completed_by = u.user?.id;
    }
    const { error } = await supabase.from("reference_checks").update(patch).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Background & reference checks</h3>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New check</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Referee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Loading checks…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">No checks yet.</TableCell></TableRow>
            ) : rows.map((r) => {
              const ap = apps.find((a) => a.id === r.application_id);
              return (
                <TableRow key={r.id}>
                  <TableCell>{ap?.full_name || "—"}</TableCell>
                  <TableCell className="capitalize">{r.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-xs">{r.referee_name}{r.referee_email && <div className="text-muted-foreground">{r.referee_email}</div>}</TableCell>
                  <TableCell><Badge variant={r.status === "completed" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["pending", "requested", "in_progress", "completed", "failed", "waived"].map((s) =>
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
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
            <DialogHeader><DialogTitle>New background check</DialogTitle></DialogHeader>
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
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Referee name</Label><Input value={form.referee_name} onChange={(e) => setForm({ ...form, referee_name: e.target.value })} /></div>
              <div><Label>Referee role</Label><Input value={form.referee_role} onChange={(e) => setForm({ ...form, referee_role: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.referee_email} onChange={(e) => setForm({ ...form, referee_email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.referee_phone} onChange={(e) => setForm({ ...form, referee_phone: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ChecksManager;