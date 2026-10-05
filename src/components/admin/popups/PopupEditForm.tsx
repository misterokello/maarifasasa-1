import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X, Eye } from "lucide-react";
import type { Popup } from "@/pages/AdminPopups";

const PAGE_OPTIONS = [
  { value: "/", label: "Homepage" },
  { value: "/programs", label: "Programs" },
  { value: "/programs/talent-accelerator", label: "Talent Accelerator" },
  { value: "/programs/bootcamps", label: "Bootcamps" },
  { value: "/programs/certificates", label: "Certificates" },
  { value: "/programs/digital-field-agents", label: "Digital Field Agents" },
  { value: "/blog", label: "Blog" },
  { value: "/about", label: "About" },
  { value: "/contact", label: "Contact" },
  { value: "/checkout", label: "Checkout" },
  { value: "/learning", label: "Learning" },
  { value: "/learn-and-earn", label: "Learn & Earn" },
];

interface PopupEditFormProps {
  popup: Popup;
  onSave: (popup: Popup) => void;
  onCancel: () => void;
  saving: boolean;
}

const PopupEditForm = ({ popup, onSave, onCancel, saving }: PopupEditFormProps) => {
  const [form, setForm] = useState<Popup>({ ...popup });
  const [pageInput, setPageInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const update = (field: keyof Popup, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addPage = (page: string) => {
    if (!page) return;
    const current = form.target_pages || [];
    if (!current.includes(page)) {
      update("target_pages", [...current, page]);
    }
    setPageInput("");
  };

  const removePage = (page: string) => {
    const current = form.target_pages || [];
    const updated = current.filter((p) => p !== page);
    update("target_pages", updated.length > 0 ? updated : null);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Internal Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g., Spring Sale Popup"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={form.popup_type}
            onValueChange={(v) => update("popup_type", v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promotional">Promotional Popup</SelectItem>
              <SelectItem value="banner">Announcement Banner</SelectItem>
              <SelectItem value="tally_embed">Tally Form Embed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Content</h3>

        {form.popup_type === "promotional" ? (
          <>
            <div>
              <Label>Heading</Label>
              <Input
                value={form.heading || ""}
                onChange={(e) => update("heading", e.target.value)}
                placeholder="Popup headline"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Body Text</Label>
              <Textarea
                value={form.body_text || ""}
                onChange={(e) => update("body_text", e.target.value)}
                placeholder="Popup body content..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.image_url || ""}
                onChange={(e) => update("image_url", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
              {form.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border max-h-40">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={form.button_text || ""}
                  onChange={(e) => update("button_text", e.target.value)}
                  placeholder="Learn More"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={form.button_link || ""}
                  onChange={(e) => update("button_link", e.target.value)}
                  placeholder="/programs or https://..."
                  className="mt-1"
                />
              </div>
            </div>
          </>
        ) : form.popup_type === "tally_embed" ? (
          <>
            <div>
              <Label>Tally Form ID *</Label>
              <Input
                value={form.tally_form_id || ""}
                onChange={(e) => update("tally_form_id", e.target.value)}
                placeholder="e.g., wQgeqY"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The form ID from your Tally.so form URL (e.g., tally.so/r/<strong>wQgeqY</strong>)
              </p>
            </div>
            <div>
              <Label>Popup Heading (optional)</Label>
              <Input
                value={form.heading || ""}
                onChange={(e) => update("heading", e.target.value)}
                placeholder="Optional title above the form"
                className="mt-1"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Banner Text</Label>
              <Input
                value={form.heading || ""}
                onChange={(e) => update("heading", e.target.value)}
                placeholder="📢 Important announcement here"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banner Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={form.banner_color || "#3b82f6"}
                    onChange={(e) => update("banner_color", e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={form.banner_color || "#3b82f6"}
                    onChange={(e) => update("banner_color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Link (optional)</Label>
                <Input
                  value={form.button_link || ""}
                  onChange={(e) => update("button_link", e.target.value)}
                  placeholder="/programs"
                  className="mt-1"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Display Rules */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Display Rules</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Delay (seconds)</Label>
            <Input
              type="number"
              min="0"
              value={form.display_delay_seconds}
              onChange={(e) => update("display_delay_seconds", parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">0 = show immediately</p>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Switch
              checked={form.show_once_per_session}
              onCheckedChange={(v) => update("show_once_per_session", v)}
            />
            <Label>Show once per session</Label>
          </div>
        </div>
      </div>

      {/* Scheduling */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="datetime-local"
              value={form.start_date ? form.start_date.slice(0, 16) : ""}
              onChange={(e) =>
                update("start_date", e.target.value ? new Date(e.target.value).toISOString() : null)
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="datetime-local"
              value={form.end_date ? form.end_date.slice(0, 16) : ""}
              onChange={(e) =>
                update("end_date", e.target.value ? new Date(e.target.value).toISOString() : null)
              }
              className="mt-1"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Leave empty for no time restrictions.</p>
      </div>

      {/* Page Targeting */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Page Targeting</h3>
        <div>
          <Label>Target Pages</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Leave empty to show on all pages. Select specific pages to limit visibility.
          </p>
          <Select value="" onValueChange={addPage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add a page..." />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.filter(
                (opt) => !(form.target_pages || []).includes(opt.value)
              ).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.target_pages && form.target_pages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.target_pages.map((page) => {
              const pageLabel = PAGE_OPTIONS.find((o) => o.value === page)?.label || page;
              return (
                <Badge key={page} variant="secondary" className="gap-1">
                  {pageLabel}
                  <button onClick={() => removePage(page)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {(!form.target_pages || form.target_pages.length === 0) && (
          <Badge variant="outline" className="text-muted-foreground">
            Showing on all pages
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setShowPreview(true)} type="button">
          <Eye className="h-4 w-4 mr-2" /> Preview
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {form.id ? "Save Changes" : "Create Popup"}
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>Popup Preview</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {form.popup_type === "banner" ? (
              <div className="rounded-lg overflow-hidden border">
                <div
                  className="relative w-full text-white text-center py-3 px-12 text-sm font-medium"
                  style={{ backgroundColor: form.banner_color || "#3b82f6" }}
                >
                  {form.button_link ? (
                    <span className="underline cursor-pointer">{form.heading || "Banner text..."}</span>
                  ) : (
                    <span>{form.heading || "Banner text..."}</span>
                  )}
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : form.popup_type === "tally_embed" ? (
              <div className="relative rounded-2xl border shadow-2xl max-w-lg mx-auto overflow-hidden bg-background">
                <button className="absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 shadow-sm">
                  <X className="h-5 w-5" />
                </button>
                <div className="p-6 space-y-4">
                  {form.heading && (
                    <h2 className="text-2xl font-bold text-foreground">{form.heading}</h2>
                  )}
                  {form.tally_form_id ? (
                    <iframe
                      src={`https://tally.so/embed/${form.tally_form_id}?alignLeft=1&hideTitle=1&transparentBackground=1`}
                      width="100%"
                      height="400"
                      frameBorder="0"
                      title="Tally Form Preview"
                      className="rounded-lg"
                    />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Enter a Tally Form ID to see a preview
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl border shadow-2xl max-w-lg mx-auto overflow-hidden bg-background">
                <button className="absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 shadow-sm">
                  <X className="h-5 w-5" />
                </button>

                {form.image_url && (
                  <div className="w-full max-h-56 overflow-hidden">
                    <img
                      src={form.image_url}
                      alt=""
                      className="w-full h-56 object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {form.heading && (
                    <h2 className="text-2xl font-bold text-foreground">
                      {form.heading}
                    </h2>
                  )}
                  {form.body_text && (
                    <p className="text-muted-foreground leading-relaxed">
                      {form.body_text}
                    </p>
                  )}
                  {form.button_text && (
                    <div className="pt-2">
                      <Button className="w-full" disabled>
                        {form.button_text}
                      </Button>
                    </div>
                  )}

                  {!form.heading && !form.body_text && !form.image_url && (
                    <p className="text-center text-muted-foreground py-8">
                      Add content to see a preview
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PopupEditForm;
