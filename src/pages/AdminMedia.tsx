import React, { useEffect, useState } from "react";
import {
  Loader2,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wand2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/blog/ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import HeroSlideOrder from "@/components/admin/HeroSlideOrder";
import { supabase } from "@/integrations/supabase/client";
import type { MediaFeature } from "@/hooks/useMediaFeatures";
import { toast } from "sonner";
import { format } from "date-fns";

type FormState = {
  title: string;
  article_url: string;
  outlet_name: string;
  outlet_logo_url: string;
  image_url: string;
  excerpt: string;
  published_at: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  article_url: "",
  outlet_name: "",
  outlet_logo_url: "",
  image_url: "",
  excerpt: "",
  published_at: "",
  sort_order: 0,
  is_active: true,
};

const AdminMedia = () => {
  const [features, setFeatures] = useState<MediaFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaFeature | null>(null);
  const [imageError, setImageError] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media_features")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load media features:", error);
      toast.error("Failed to load media features");
    } else {
      setFeatures((data as MediaFeature[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: features.length });
    setImageError(false);
    setUploadedImageUrl(null);
    setDialogOpen(true);
  };

  const openEdit = (feature: MediaFeature) => {
    setEditingId(feature.id);
    setForm({
      title: feature.title,
      article_url: feature.article_url,
      outlet_name: feature.outlet_name ?? "",
      outlet_logo_url: feature.outlet_logo_url ?? "",
      image_url: feature.image_url ?? "",
      excerpt: feature.excerpt ?? "",
      published_at: feature.published_at ?? "",
      sort_order: feature.sort_order,
      is_active: feature.is_active,
    });
    setImageError(false);
    setUploadedImageUrl(null);
    setDialogOpen(true);
  };

  // A manual upload already lives in storage, so it becomes the authoritative
  // image: persist it right away when editing so the record never falls back
  // to the unreachable article URL.
  const applyUploadedImage = async (url: string) => {
    setImageError(false);
    setUploadedImageUrl(url);
    setForm((prev) => ({ ...prev, image_url: url }));

    if (!editingId) return;
    const { error } = await supabase
      .from("media_features")
      .update({ image_url: url })
      .eq("id", editingId);
    if (error) {
      console.error("Failed to save uploaded image:", error);
      toast.error("Image uploaded but not saved — hit Save to retry");
      return;
    }
    toast.success("Feature image saved");
    load();
  };

  const extractMetadata = async () => {
    const url = form.article_url.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Paste a full article link starting with https://");
      return;
    }
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("media-metadata", {
        body: { url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setForm((prev) => ({
        ...prev,
        article_url: data.article_url ?? prev.article_url,
        title: data.title || prev.title,
        outlet_name: data.outlet_name || prev.outlet_name,
        outlet_logo_url: data.outlet_logo_url || prev.outlet_logo_url,
        image_url: data.image_url || prev.image_url,
        excerpt: data.excerpt || prev.excerpt,
        published_at: data.published_at || prev.published_at,
      }));
      toast.success("Details pulled from the article");
    } catch (err) {
      console.error("Metadata extraction failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Could not read that article — fill the fields manually"
      );
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.article_url.trim()) {
      toast.error("Title and article link are required");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      article_url: form.article_url.trim(),
      outlet_name: form.outlet_name.trim() || null,
      outlet_logo_url: form.outlet_logo_url.trim() || null,
      image_url: uploadedImageUrl || form.image_url.trim() || null,
      excerpt: form.excerpt.trim() || null,
      published_at: form.published_at || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };

    const { error } = editingId
      ? await supabase.from("media_features").update(payload).eq("id", editingId)
      : await supabase.from("media_features").insert(payload);

    setSaving(false);
    if (error) {
      console.error("Failed to save media feature:", error);
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Feature updated" : "Feature added");
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (feature: MediaFeature) => {
    const { error } = await supabase
      .from("media_features")
      .update({ is_active: !feature.is_active })
      .eq("id", feature.id);
    if (error) {
      toast.error("Could not update visibility");
      return;
    }
    setFeatures((prev) =>
      prev.map((f) => (f.id === feature.id ? { ...f, is_active: !f.is_active } : f))
    );
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("media_features").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Could not delete feature");
      return;
    }
    toast.success("Feature removed");
    setDeleteTarget(null);
    load();
  };

  const filtered = features.filter((f) =>
    `${f.title} ${f.outlet_name ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminDashboardLayout
      title="Media features"
      subtitle="Share a media link and we pull the outlet logo, image and headline automatically"
    >
      <div className="mb-6">
        <HeroSlideOrder />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add media feature
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No media features yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste an article link and we'll fetch the logo, image and headline for you.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Story</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell className="max-w-[340px]">
                      <div className="flex items-center gap-3">
                        {feature.image_url ? (
                          <img
                            src={feature.image_url}
                            alt=""
                            className="h-10 w-16 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-muted">
                            <Newspaper className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{feature.title}</p>
                          <a
                            href={feature.article_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 truncate text-xs text-primary hover:underline"
                          >
                            View article <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {feature.outlet_logo_url && (
                          <img
                            src={feature.outlet_logo_url}
                            alt=""
                            className="h-5 w-auto max-w-[70px] object-contain"
                          />
                        )}
                        <span className="text-sm">{feature.outlet_name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {feature.published_at
                        ? format(new Date(feature.published_at), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{feature.sort_order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={feature.is_active}
                        onCheckedChange={() => toggleActive(feature)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(feature)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(feature)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((feature) => (
              <div key={feature.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">{feature.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {feature.outlet_name ?? "—"}
                      {feature.published_at &&
                        ` · ${format(new Date(feature.published_at), "dd MMM yyyy")}`}
                    </p>
                  </div>
                  <Badge variant={feature.is_active ? "default" : "secondary"}>
                    {feature.is_active ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(feature)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(feature)}>
                    {feature.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(feature)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit media feature" : "Add media feature"}</DialogTitle>
            <DialogDescription>
              Paste the article link, then fetch details to pull the outlet logo, feature image and
              headline automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="article_url">Article link</Label>
              <div className="flex gap-2">
                <Input
                  id="article_url"
                  value={form.article_url}
                  onChange={(e) => setForm({ ...form, article_url: e.target.value })}
                  placeholder="https://newsoutlet.com/story"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={extractMetadata}
                  disabled={fetching}
                >
                  {fetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Fetch</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Headline</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="outlet_name">Outlet name</Label>
                <Input
                  id="outlet_name"
                  value={form.outlet_name}
                  onChange={(e) => setForm({ ...form, outlet_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="published_at">Published date</Label>
                <Input
                  id="published_at"
                  type="date"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outlet_logo_url">Outlet logo URL</Label>
              <Input
                id="outlet_logo_url"
                value={form.outlet_logo_url}
                onChange={(e) => setForm({ ...form, outlet_logo_url: e.target.value })}
              />
              {form.outlet_logo_url && (
                <img
                  src={form.outlet_logo_url}
                  alt="Outlet logo preview"
                  className="mt-1 h-8 w-auto max-w-[140px] object-contain"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Feature image URL</Label>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => {
                  setImageError(false);
                  setUploadedImageUrl(null);
                  setForm({ ...form, image_url: e.target.value });
                }}
              />
              {form.image_url && (!imageError || uploadedImageUrl === form.image_url) && (
                <img
                  src={form.image_url}
                  alt="Feature image preview"
                  className="mt-1 aspect-[16/9] w-full rounded-lg object-cover"
                  onError={() => {
                    if (uploadedImageUrl !== form.image_url) setImageError(true);
                  }}
                />
              )}
              {uploadedImageUrl && uploadedImageUrl === form.image_url && (
                <p className="text-xs text-muted-foreground">
                  Stored in Maarifasasa media storage — this upload is used instead of the article image.
                </p>
              )}
              {(!form.image_url || (imageError && uploadedImageUrl !== form.image_url)) && (
                <div className="rounded-lg border border-dashed p-3">
                  {imageError && (
                    <p className="mb-2 text-xs text-destructive">
                      That image link couldn't be previewed — upload the feature image manually instead.
                    </p>
                  )}
                  <ImageUpload
                    label="Upload feature image"
                    recommendedWidth={1200}
                    recommendedHeight={675}
                    maxWidth={1200}
                    maxHeight={675}
                    onChange={applyUploadedImage}
                  />
                </div>
              )}
            </div>


            <div className="space-y-2">
              <Label htmlFor="excerpt">Short excerpt</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>

            <div className="flex items-end gap-6">
              <div className="w-28 space-y-2">
                <Label htmlFor="sort_order">Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label htmlFor="is_active">Show on homepage</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save changes" : "Add feature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this media feature?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.title}” will no longer appear on the homepage. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDashboardLayout>
  );
};

export default AdminMedia;
