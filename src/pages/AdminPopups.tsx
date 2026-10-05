import React, { useState, useEffect } from "react";
import { Plus, Loader2, Megaphone, PanelTop, RotateCcw, Search, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import PopupEditForm from "@/components/admin/popups/PopupEditForm";
import { PopupStatsInline, usePopupAnalytics } from "@/components/admin/popups/PopupAnalytics";
import PopupAnalyticsChart from "@/components/admin/popups/PopupAnalyticsChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface Popup {
  id: string;
  title: string;
  popup_type: "promotional" | "banner" | "tally_embed";
  heading: string | null;
  body_text: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  banner_color: string | null;
  tally_form_id: string | null;
  display_delay_seconds: number;
  show_once_per_session: boolean;
  start_date: string | null;
  end_date: string | null;
  target_pages: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminPopups = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chartPopup, setChartPopup] = useState<Popup | null>(null);

  const loadPopups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("popups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading popups:", error);
      toast.error("Failed to load popups");
    } else {
      setPopups((data as Popup[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPopups();
  }, []);

  const filteredPopups = popups.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popupIds = popups.map((p) => p.id).filter(Boolean);
  const { stats: analyticsStats } = usePopupAnalytics(popupIds);

  const handleToggleActive = async (popup: Popup) => {
    const { error } = await supabase
      .from("popups")
      .update({ is_active: !popup.is_active, updated_at: new Date().toISOString() })
      .eq("id", popup.id);

    if (error) {
      toast.error("Failed to update popup status");
    } else {
      setPopups((prev) =>
        prev.map((p) => (p.id === popup.id ? { ...p, is_active: !p.is_active } : p))
      );
      toast.success(`Popup ${!popup.is_active ? "activated" : "deactivated"}`);
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setEditingPopup({
      id: "",
      title: "",
      popup_type: "promotional",
      heading: "",
      body_text: "",
      image_url: "",
      button_text: "",
      button_link: "",
      banner_color: "#3b82f6",
      tally_form_id: null,
      display_delay_seconds: 0,
      show_once_per_session: true,
      start_date: null,
      end_date: null,
      target_pages: null,
      is_active: false,
      created_at: "",
      updated_at: "",
    });
  };

  const handleSave = async (popup: Popup) => {
    setSaving(true);
    try {
      if (creating) {
        const { id, created_at, updated_at, ...insertData } = popup;
        const { data, error } = await supabase
          .from("popups")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        setPopups((prev) => [data as Popup, ...prev]);
        toast.success("Popup created successfully");
      } else {
        const { created_at, ...updateData } = popup;
        const { error } = await supabase
          .from("popups")
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq("id", popup.id);

        if (error) throw error;
        setPopups((prev) =>
          prev.map((p) => (p.id === popup.id ? { ...popup, updated_at: new Date().toISOString() } : p))
        );
        toast.success("Popup saved successfully");
      }
      setEditingPopup(null);
      setCreating(false);
    } catch (error) {
      console.error("Error saving popup:", error);
      toast.error("Failed to save popup");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this popup? This cannot be undone.")) return;

    const { error } = await supabase.from("popups").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete popup");
    } else {
      setPopups((prev) => prev.filter((p) => p.id !== id));
      toast.success("Popup deleted");
    }
  };

  const getScheduleStatus = (popup: Popup) => {
    const now = new Date();
    if (popup.start_date && new Date(popup.start_date) > now) return "Scheduled";
    if (popup.end_date && new Date(popup.end_date) < now) return "Expired";
    return popup.is_active ? "Live" : "Draft";
  };

  if (loading) {
    return (
      <AdminDashboardLayout title="Popup Management" subtitle="Create and manage site popups and banners">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading popups...</h2>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title="Popup Management" subtitle="Create and manage site popups and banners">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search popups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Button variant="outline" onClick={loadPopups}>
            <RotateCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Popup
          </Button>
        </div>
      </div>

      {filteredPopups.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No popups match your search." : "No popups created yet."}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Popup
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">Active</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Analytics</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPopups.map((popup) => {
                const status = getScheduleStatus(popup);
                return (
                  <TableRow key={popup.id}>
                    <TableCell>
                      <Switch
                        checked={popup.is_active}
                        onCheckedChange={() => handleToggleActive(popup)}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{popup.title}</p>
                      {popup.heading && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{popup.heading}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={popup.popup_type === "tally_embed" ? "outline" : popup.popup_type === "promotional" ? "default" : "secondary"}>
                        {popup.popup_type === "promotional" ? (
                          <><Megaphone className="h-3 w-3 mr-1" /> Popup</>
                        ) : popup.popup_type === "tally_embed" ? (
                          <><PanelTop className="h-3 w-3 mr-1" /> Tally Embed</>
                        ) : (
                          <><PanelTop className="h-3 w-3 mr-1" /> Banner</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status === "Live" ? "default" : status === "Scheduled" ? "secondary" : "outline"
                        }
                        className={status === "Live" ? "bg-green-600 hover:bg-green-700" : status === "Expired" ? "text-muted-foreground" : ""}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PopupStatsInline popupId={popup.id} stats={analyticsStats} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {popup.target_pages && popup.target_pages.length > 0
                          ? `${popup.target_pages.length} page(s)`
                          : "All pages"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{popup.display_delay_seconds}s</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setChartPopup(popup)}
                          title="View analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCreating(false);
                            setEditingPopup(popup);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(popup.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!editingPopup}
        onOpenChange={() => {
          setEditingPopup(null);
          setCreating(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{creating ? "Create Popup" : "Edit Popup"}</DialogTitle>
            <DialogDescription>
              Configure the popup content, display rules, and targeting.
            </DialogDescription>
          </DialogHeader>
          {editingPopup && (
            <PopupEditForm
              popup={editingPopup}
              onSave={handleSave}
              onCancel={() => {
                setEditingPopup(null);
                setCreating(false);
              }}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>

      {chartPopup && (
        <PopupAnalyticsChart
          popupId={chartPopup.id}
          popupTitle={chartPopup.title}
          open={!!chartPopup}
          onOpenChange={(open) => { if (!open) setChartPopup(null); }}
        />
      )}
    </AdminDashboardLayout>
  );
};

export default AdminPopups;
