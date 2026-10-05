import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Route, Pencil, X } from "lucide-react";
import { toast } from "sonner";

type Pathway = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type Product = { id: string; name: string; slug: string; category: string; is_active: boolean | null };

type PathwayProduct = { id: string; pathway_id: string; product_id: string; sort_order: number };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PathwaysManager = () => {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [links, setLinks] = useState<PathwayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Pathway> | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, pr, l] = await Promise.all([
      supabase.from("learning_pathways").select("*").order("sort_order"),
      supabase.from("products").select("id, name, slug, category, is_active").order("name"),
      supabase.from("pathway_products").select("*").order("sort_order"),
    ]);
    if (p.error) toast.error(p.error.message);
    if (pr.error) toast.error(pr.error.message);
    if (l.error) toast.error(l.error.message);
    setPathways((p.data as Pathway[]) || []);
    setProducts((pr.data as Product[]) || []);
    setLinks((l.data as PathwayProduct[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const productsById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const linksByPathway = useMemo(() => {
    const m: Record<string, PathwayProduct[]> = {};
    links.forEach((l) => {
      (m[l.pathway_id] ||= []).push(l);
    });
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.sort_order - b.sort_order));
    return m;
  }, [links]);

  const savePathway = async () => {
    if (!editing?.title) return toast.error("Title is required");
    setSaving(true);
    const payload = {
      title: editing.title,
      slug: editing.slug || slugify(editing.title),
      description: editing.description ?? null,
      is_active: editing.is_active ?? true,
      sort_order: editing.sort_order ?? pathways.length,
    };
    const q = editing.id
      ? supabase.from("learning_pathways").update(payload).eq("id", editing.id)
      : supabase.from("learning_pathways").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const deletePathway = async (id: string) => {
    if (!confirm("Delete this pathway? Products will be unlinked.")) return;
    const { error } = await supabase.from("learning_pathways").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const addProduct = async (pathwayId: string, productId: string) => {
    if (!productId) return;
    const existing = linksByPathway[pathwayId] || [];
    if (existing.find((l) => l.product_id === productId)) return toast.error("Already added");
    const { error } = await supabase.from("pathway_products").insert({
      pathway_id: pathwayId,
      product_id: productId,
      sort_order: existing.length,
    });
    if (error) return toast.error(error.message);
    load();
  };

  const removeProduct = async (linkId: string) => {
    const { error } = await supabase.from("pathway_products").delete().eq("id", linkId);
    if (error) return toast.error(error.message);
    load();
  };

  const moveProduct = async (pathwayId: string, linkId: string, dir: -1 | 1) => {
    const arr = [...(linksByPathway[pathwayId] || [])];
    const idx = arr.findIndex((l) => l.id === linkId);
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    const a = arr[idx];
    const b = arr[swap];
    await Promise.all([
      supabase.from("pathway_products").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("pathway_products").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Learning Pathways
            </CardTitle>
            <CardDescription>Curate ordered sets of products that make up a career pathway.</CardDescription>
          </div>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing({ is_active: true, sort_order: pathways.length })}>
                <Plus className="h-4 w-4 mr-1" /> New pathway
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing?.id ? "Edit pathway" : "New pathway"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editing?.title || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={editing?.slug || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, slug: e.target.value }))}
                    placeholder={editing?.title ? slugify(editing.title) : ""}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editing?.description || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={editing?.is_active ?? true}
                    onCheckedChange={(v) => setEditing((p) => ({ ...p, is_active: v }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={savePathway} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pathways.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No pathways yet. Create one to group products into a guided journey.
          </div>
        ) : (
          <div className="space-y-6">
            {pathways.map((pw) => {
              const included = linksByPathway[pw.id] || [];
              const availableProducts = products.filter(
                (p) => !included.find((l) => l.product_id === p.id),
              );
              return (
                <div key={pw.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{pw.title}</h3>
                        {pw.is_active ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Hidden</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">/{pw.slug}</p>
                      {pw.description && (
                        <p className="text-sm text-muted-foreground mt-1">{pw.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditing(pw)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePathway(pw.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Products ({included.length})
                    </div>
                    {included.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No products yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {included.map((l, i) => {
                          const prod = productsById[l.product_id];
                          return (
                            <li
                              key={l.id}
                              className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 bg-muted/30"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-mono w-6 text-muted-foreground">{i + 1}.</span>
                                <span className="text-sm truncate">
                                  {prod ? prod.name : <em className="text-muted-foreground">missing product</em>}
                                </span>
                                {prod && (
                                  <Badge variant="outline" className="text-[10px]">{prod.category}</Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => moveProduct(pw.id, l.id, -1)}>
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => moveProduct(pw.id, l.id, 1)}>
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => removeProduct(l.id)}>
                                  <X className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {availableProducts.length > 0 && (
                      <div className="mt-2">
                        <select
                          className="text-sm border rounded px-2 py-1 bg-background"
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value;
                            e.target.value = "";
                            addProduct(pw.id, val);
                          }}
                        >
                          <option value="">+ Add product…</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} · {p.category}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PathwaysManager;