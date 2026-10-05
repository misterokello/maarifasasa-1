import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";

type Field = {
  id: string;
  key: string;
  label: string;
  section: string;
  input_type: string;
  options: any;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  visible: boolean;
  sort_order: number;
};

const INPUT_TYPES = ["text", "email", "tel", "url", "textarea", "select", "multiselect", "checkbox", "file"];
const SECTIONS = ["personal", "professional", "learning", "demographics", "marketing"];

const emptyField = (): Partial<Field> => ({
  key: "",
  label: "",
  section: "personal",
  input_type: "text",
  options: [],
  placeholder: "",
  help_text: "",
  required: false,
  visible: true,
  sort_order: 100,
});

const AdminProfileFields = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Field> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("profile_field_definitions").select("*").order("section").order("sort_order");
    setFields((data || []) as Field[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.key || !editing?.label) {
      toast.error("Key and label are required");
      return;
    }
    setSaving(true);
    const payload: any = {
      key: editing.key,
      label: editing.label,
      section: editing.section,
      input_type: editing.input_type,
      options: typeof editing.options === "string"
        ? (editing.options as string).split(",").map((s) => s.trim()).filter(Boolean)
        : editing.options || [],
      placeholder: editing.placeholder || null,
      help_text: editing.help_text || null,
      required: !!editing.required,
      visible: editing.visible !== false,
      sort_order: Number(editing.sort_order || 100),
    };
    const q = editing.id
      ? supabase.from("profile_field_definitions").update(payload).eq("id", editing.id)
      : supabase.from("profile_field_definitions").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this field? Existing learner data in this column is preserved.")) return;
    const { error } = await supabase.from("profile_field_definitions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggle = async (f: Field, patch: Partial<Field>) => {
    const { error } = await supabase.from("profile_field_definitions").update(patch).eq("id", f.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AdminDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile fields</h1>
            <p className="text-muted-foreground text-sm">Configure fields collected during onboarding and shown on learner profiles.</p>
          </div>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(emptyField())}><Plus className="h-4 w-4 mr-2" /> Add field</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing?.id ? "Edit field" : "New field"}</DialogTitle></DialogHeader>
              {editing && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Key</Label>
                      <Input value={editing.key || ""} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="e.g. occupation" />
                    </div>
                    <div className="space-y-1">
                      <Label>Label</Label>
                      <Input value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Section</Label>
                      <Select value={editing.section} onValueChange={(v) => setEditing({ ...editing, section: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Input type</Label>
                      <Select value={editing.input_type} onValueChange={(v) => setEditing({ ...editing, input_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INPUT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Options (comma-separated, for select/multiselect)</Label>
                      <Input
                        value={Array.isArray(editing.options) ? editing.options.join(", ") : (editing.options as any) || ""}
                        onChange={(e) => setEditing({ ...editing, options: e.target.value as any })}
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Placeholder</Label>
                      <Input value={editing.placeholder || ""} onChange={(e) => setEditing({ ...editing, placeholder: e.target.value })} />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Help text</Label>
                      <Textarea value={editing.help_text || ""} onChange={(e) => setEditing({ ...editing, help_text: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Sort order</Label>
                      <Input type="number" value={editing.sort_order ?? 100} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                    </div>
                    <div className="flex items-end gap-4">
                      <div className="flex items-center gap-2"><Switch checked={!!editing.required} onCheckedChange={(v) => setEditing({ ...editing, required: v })} /><span className="text-sm">Required</span></div>
                      <div className="flex items-center gap-2"><Switch checked={editing.visible !== false} onCheckedChange={(v) => setEditing({ ...editing, visible: v })} /><span className="text-sm">Visible</span></div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Fields ({fields.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="capitalize">{f.section}</TableCell>
                      <TableCell className="font-mono text-xs">{f.key}</TableCell>
                      <TableCell>{f.label}</TableCell>
                      <TableCell>{f.input_type}</TableCell>
                      <TableCell><Switch checked={f.required} onCheckedChange={(v) => toggle(f, { required: v })} /></TableCell>
                      <TableCell><Switch checked={f.visible} onCheckedChange={(v) => toggle(f, { visible: v })} /></TableCell>
                      <TableCell>{f.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(f)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminProfileFields;