import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, RotateCcw, Eye, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LearnerDetails from "./LearnerDetails";

interface LearnerRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  profile_completed_at: string | null;
  thinkific_user_id: number | null;
  thinkific_synced_at: string | null;
  age_range: string | null;
  employment_status: string | null;
  interests: string[] | null;
  referral_source: string | null;
}

const AllLearners: React.FC = () => {
  const [rows, setRows] = useState<LearnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "onboarded" | "pending_onboarding" | "unsynced">("all");
  const [selected, setSelected] = useState<LearnerRow | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,phone,location,created_at,profile_completed_at,thinkific_user_id,thinkific_synced_at,age_range,employment_status,interests,referral_source")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load learners");
    } else {
      setRows((data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.email || ""} ${r.full_name || ""} ${r.phone || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === "onboarded") return !!r.profile_completed_at;
      if (filter === "pending_onboarding") return !r.profile_completed_at;
      if (filter === "unsynced") return !r.thinkific_user_id;
      return true;
    });
  }, [rows, query, filter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const syncOne = async (userId: string) => {
    setSyncingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-admin-provision", {
        body: { user_id: userId },
      });
      if (error) throw error;
      const first = data?.results?.[0];
      if (first?.ok) toast.success(first.is_new ? "Thinkific account created" : "Linked existing Thinkific account");
      else toast.error(first?.error || "Sync failed");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const syncAllMissing = async () => {
    setBulkSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-admin-provision", { body: {} });
      if (error) throw error;
      const ok = (data?.results || []).filter((r: any) => r.ok).length;
      const fail = (data?.results || []).length - ok;
      toast.success(`Synced ${ok} learner${ok === 1 ? "" : "s"}${fail ? ` · ${fail} failed` : ""}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Bulk sync failed");
    } finally {
      setBulkSyncing(false);
    }
  };

  const stats = useMemo(() => ({
    total: rows.length,
    onboarded: rows.filter((r) => r.profile_completed_at).length,
    unsynced: rows.filter((r) => !r.thinkific_user_id).length,
  }), [rows]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Loading all learners…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Learners</h2>
          <p className="text-muted-foreground">Every signup with onboarding progress and Thinkific sync status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-9 w-[260px]"
            />
          </div>
          <Button variant="outline" onClick={load}><RotateCcw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button onClick={syncAllMissing} disabled={bulkSyncing || stats.unsynced === 0}>
            {bulkSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync all missing ({stats.unsynced})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {([
          { key: "all", label: "Total learners", value: stats.total },
          { key: "onboarded", label: "Completed onboarding", value: stats.onboarded },
          { key: "pending_onboarding", label: "Pending onboarding", value: stats.total - stats.onboarded },
          { key: "unsynced", label: "Not on Thinkific", value: stats.unsynced },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => { setFilter(s.key as any); setPage(1); }}
            className={`text-left rounded-lg p-4 border transition ${filter === s.key ? "border-primary bg-primary/5" : "bg-muted/50 border-transparent"}`}
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Learner</TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead>Thinkific</TableHead>
              <TableHead>Employment</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[130px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{r.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                  {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                </TableCell>
                <TableCell>
                  {r.profile_completed_at ? (
                    <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Complete</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {r.thinkific_user_id ? (
                    <div>
                      <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Synced</Badge>
                      <p className="text-xs text-muted-foreground mt-1">ID {r.thinkific_user_id}</p>
                    </div>
                  ) : (
                    <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Not synced</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{r.employment_status || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm max-w-[200px]">
                  {r.interests && r.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.interests.slice(0, 3).map((i) => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}
                      {r.interests.length > 3 && <span className="text-xs text-muted-foreground">+{r.interests.length - 3}</span>}
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm">{r.referral_source || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSelected(r)} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => syncOne(r.id)}
                      disabled={syncingId === r.id}
                      title={r.thinkific_user_id ? "Re-sync Thinkific" : "Sync to Thinkific"}
                    >
                      {syncingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No learners match this filter.</div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Learner Details</DialogTitle>
            <DialogDescription>Complete profile, onboarding, and payment history.</DialogDescription>
          </DialogHeader>
          {selected && <LearnerDetails learner={selected as any} onClose={() => setSelected(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllLearners;