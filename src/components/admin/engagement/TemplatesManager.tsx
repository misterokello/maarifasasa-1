import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listTemplates, type EmailTemplate } from "@/lib/engagement/api";
import { toast } from "sonner";

const CATS = ["engagement", "success", "announcement", "onboarding", "re_engagement", "custom"];

const TemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EmailTemplate> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await listTemplates();
    setTemplates((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name,
      description: editing.description ?? null,
      category: editing.category || "custom",
      subject: editing.subject,
      preheader: editing.preheader ?? null,
      body_html: editing.body_html,
      body_text: editing.body_text ?? null,
      variables: editing.variables ?? [],
    };
    if (!payload.name || !payload.subject || !payload.body_html) {
      toast.error("Name, subject and body are required");
      return;
    }
    let res;
    if (editing.id) {
      res = await supabase.from("email_templates").update(payload).eq("id", editing.id);
    } else {
      res = await supabase.from("email_templates").insert(payload);
    }
    if (res.error) toast.error(res.error.message);
    else { toast.success("Template saved"); setEditing(null); load(); }
  };

  const duplicate = async (t: EmailTemplate) => {
    const { error } = await supabase.from("email_templates").insert({
      name: `${t.name} (copy)`,
      description: t.description,
      category: t.category,
      subject: t.subject,
      preheader: t.preheader,
      body_html: t.body_html,
      body_text: t.body_text,
      variables: t.variables,
    });
    if (error) toast.error(error.message);
    else { toast.success("Duplicated"); load(); }
  };

  const archive = async (t: EmailTemplate) => {
    if (!confirm(`Archive "${t.name}"?`)) return;
    const { error } = await supabase.from("email_templates").update({ archived: true }).eq("id", t.id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Templates</h2>
          <p className="text-sm text-muted-foreground">Reusable email layouts. System templates can be duplicated and customised.</p>
        </div>
        <Button onClick={() => setEditing({ category: "custom", body_html: "", subject: "" })}>
          <Plus className="h-4 w-4 mr-2" /> New template
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                      {t.is_system && <Badge variant="secondary" className="gap-1 text-[10px]"><Sparkles className="h-2.5 w-2.5" /> System</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{t.category.replace("_", " ")}</Badge>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-xs">
                  <div className="font-medium truncate">{t.subject}</div>
                  {t.preheader && <div className="text-muted-foreground truncate">{t.preheader}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)} className="flex-1">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicate(t)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {!t.is_system && (
                    <Button size="sm" variant="ghost" onClick={() => archive(t)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit template" : "New template"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={editing.category || "custom"} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace("_"," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input value={editing.subject ?? ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Use {{first_name}} for merge vars" />
                </div>
                <div>
                  <Label>Preheader</Label>
                  <Input value={editing.preheader ?? ""} onChange={(e) => setEditing({ ...editing, preheader: e.target.value })} />
                </div>
                <div>
                  <Label>HTML body</Label>
                  <Textarea rows={12} value={editing.body_html ?? ""} onChange={(e) => setEditing({ ...editing, body_html: e.target.value })} className="font-mono text-xs" />
                  <p className="text-[10px] text-muted-foreground mt-1">Merge vars: {`{{first_name}} {{course_name}} {{cta_url}}`}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Live preview</Label>
                <div className="rounded border bg-white max-h-[500px] overflow-auto">
                  <iframe
                    title="preview"
                    className="w-full min-h-[500px]"
                    srcDoc={(editing.body_html ?? "").replace(/\{\{first_name\}\}/g, "Sarah").replace(/\{\{course_name\}\}/g, "Digital Marketing").replace(/\{\{cta_url\}\}/g, "#")}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesManager;