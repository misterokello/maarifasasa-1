import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Pencil, Copy, FileDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const empty = {
  id: undefined as string | undefined,
  slug: "",
  title: "",
  department: "",
  location: "Kampala, Uganda",
  employment_type: "permanent",
  reports_to: "",
  salary_band: "",
  salary_visible: false,
  safeguarding_level: "none",
  application_mode: "internal_form",
  external_apply_url: "",
  summary: "",
  description: "",
  responsibilities: "",
  essential_criteria: "",
  desirable_criteria: "",
  status: "draft",
  internal_only: false,
  closes_at: "",
  jd_pdf_path: "" as string | null | "",
  jd_pdf_name: "" as string | null | "",
};

const JobPostingsManager = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [jdUploading, setJdUploading] = useState(false);

  const uploadJd = async (file: File) => {
    if (file.type !== "application/pdf") return toast.error("Job description must be a PDF");
    if (file.size > 10 * 1024 * 1024) return toast.error("PDF must be 10 MB or less");
    setJdUploading(true);
    try {
      const path = `job-descriptions/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage
        .from("recruitment")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (error) throw error;
      setForm((f) => ({ ...f, jd_pdf_path: path, jd_pdf_name: file.name }));
      toast.success("Job description attached — remember to save");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setJdUploading(false);
    }
  };

  const removeJd = async () => {
    if (form.jd_pdf_path) {
      await supabase.storage.from("recruitment").remove([form.jd_pdf_path]);
    }
    setForm((f) => ({ ...f, jd_pdf_path: "", jd_pdf_name: "" }));
  };

  const previewJd = async (path: string) => {
    const { data, error } = await supabase.storage.from("recruitment").createSignedUrl(path, 600);
    if (error || !data?.signedUrl) return toast.error("Could not open the PDF");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).rpc("hr_job_postings");
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const newJob = () => { setForm(empty); setOpen(true); };
  const editJob = (r: any) => { setForm({ ...empty, ...r, closes_at: r.closes_at ? r.closes_at.slice(0, 10) : "" }); setOpen(true); };
  const duplicateJob = (r: any) => {
    setForm({ ...empty, ...r, id: undefined, slug: slugify(r.title + "-copy"), title: r.title + " (copy)", status: "draft", closes_at: "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const payload: any = {
      ...form,
      slug: form.slug || slugify(form.title),
      closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
      posted_at: form.status === "published" ? new Date().toISOString() : null,
      jd_pdf_path: form.jd_pdf_path || null,
      jd_pdf_name: form.jd_pdf_name || null,
    };
    const { id, ...row } = payload;
    const { error } = id
      ? await supabase.from("job_postings").update(row).eq("id", id)
      : await supabase.from("job_postings").insert(row);
    if (error) return toast.error(error.message);
    await supabase.from("recruitment_audit_log").insert({
      entity_type: "job_posting",
      entity_id: id ?? null,
      action: id ? "updated" : "created",
      payload: { title: form.title, status: form.status },
    });
    toast.success(id ? "Posting updated" : "Posting created");
    setOpen(false);
    load();
  };

  const setStatus = async (r: any, status: string) => {
    const patch: any = { status };
    if (status === "published" && !r.posted_at) patch.posted_at = new Date().toISOString();
    const { error } = await supabase.from("job_postings").update(patch).eq("id", r.id);
    if (error) return toast.error(error.message);
    await supabase.from("recruitment_audit_log").insert({
      entity_type: "job_posting", entity_id: r.id, action: `status:${status}`, payload: {},
    });
    load();
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Job postings</h3>
          <Button onClick={newJob}><Plus className="h-4 w-4 mr-1" /> New posting</Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">No postings yet.</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.department || "—"}</TableCell>
                  <TableCell className="capitalize">{r.employment_type.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["draft", "pending_approval", "approved", "published", "closed", "archived"].map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{r.closes_at ? new Date(r.closes_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => editJob(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => duplicateJob(r)}><Copy className="h-4 w-4" /></Button>
                    {r.jd_pdf_path && (
                      <Button size="icon" variant="ghost" title="View job description" onClick={() => previewJd(r.jd_pdf_path)}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                    )}
                    {r.status === "published" && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={`/careers/${r.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit posting" : "New posting"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>Employment type</Label>
                <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["permanent", "fixed_term", "part_time", "contract", "consultant", "internship"].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reports to</Label>
                <Input value={form.reports_to} onChange={(e) => setForm({ ...form, reports_to: e.target.value })} />
              </div>
              <div>
                <Label>Salary band</Label>
                <Input value={form.salary_band} onChange={(e) => setForm({ ...form, salary_band: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.salary_visible} onCheckedChange={(v) => setForm({ ...form, salary_visible: v })} />
                <Label>Show salary publicly</Label>
              </div>
              <div>
                <Label>Safeguarding level</Label>
                <Select value={form.safeguarding_level} onValueChange={(v) => setForm({ ...form, safeguarding_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["none", "low", "high"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Application mode</Label>
                <Select value={form.application_mode} onValueChange={(v) => setForm({ ...form, application_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal_form">On-site form</SelectItem>
                    <SelectItem value="external_link">External link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.application_mode === "external_link" && (
                <div className="md:col-span-2">
                  <Label>External apply URL</Label>
                  <Input value={form.external_apply_url} onChange={(e) => setForm({ ...form, external_apply_url: e.target.value })} placeholder="https://" />
                </div>
              )}
              <div>
                <Label>Closes at</Label>
                <Input type="date" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.internal_only} onCheckedChange={(v) => setForm({ ...form, internal_only: v })} />
                <Label>Internal only</Label>
              </div>
              <div className="md:col-span-2">
                <Label>Summary</Label>
                <Textarea rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Description (job purpose)</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Key responsibilities (one per line)</Label>
                <Textarea rows={4} value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Essential criteria</Label>
                <Textarea rows={3} value={form.essential_criteria} onChange={(e) => setForm({ ...form, essential_criteria: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Desirable criteria</Label>
                <Textarea rows={3} value={form.desirable_criteria} onChange={(e) => setForm({ ...form, desirable_criteria: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Job description PDF</Label>
                {form.jd_pdf_path ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[240px]">{form.jd_pdf_name || "job-description.pdf"}</span>
                    <Button size="sm" variant="outline" onClick={() => previewJd(form.jd_pdf_path as string)}>Preview</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={removeJd}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="application/pdf"
                      disabled={jdUploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadJd(f); }}
                    />
                    {jdUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Applicants on published, externally visible roles can download this PDF.
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft", "pending_approval", "approved", "published", "closed", "archived"].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 text-xs text-muted-foreground">
                Published postings are visible at <code>/careers/{form.slug || "slug"}</code>.
              </div>
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

export default JobPostingsManager;