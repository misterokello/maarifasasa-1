import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, RotateCcw, Eye, Download, CheckCircle2, Clock } from "lucide-react";
import {
  FieldDef,
  SECTION_ORDER,
  SECTION_TITLE,
  normalizeFieldDefinitions,
} from "@/lib/onboardingFields";

type ProfileRow = Record<string, any> & {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  profile_completed_at: string | null;
  onboarding_responses: Record<string, any> | null;
};

const formatValue = (v: any): string => {
  if (v === undefined || v === null || v === "") return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const OnboardingData: React.FC = () => {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "complete" | "partial" | "empty">("all");
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    const [{ data: defs, error: defsError }, { data: profiles, error }] = await Promise.all([
      supabase.from("profile_field_definitions").select("*").order("sort_order"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    if (defsError) console.error(defsError);
    if (error) toast.error("Failed to load onboarding data");
    setFields(normalizeFieldDefinitions(defs));
    setRows((profiles || []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sections = useMemo(() => {
    const bySection: Record<string, FieldDef[]> = {};
    for (const f of fields) (bySection[f.section] ||= []).push(f);
    return SECTION_ORDER.filter((s) => bySection[s]?.length).map((s) => ({
      key: s as string,
      fields: bySection[s].sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [fields]);

  const valueFor = (row: ProfileRow, f: FieldDef) => {
    const stored = (row.onboarding_responses || {}) as Record<string, any>;
    const raw = row[f.key] ?? stored[f.key];
    return formatValue(raw);
  };

  const completion = (row: ProfileRow) => {
    if (!fields.length) return 0;
    const answered = fields.filter((f) => valueFor(row, f) !== "").length;
    return Math.round((answered / fields.length) * 100);
  };

  const enriched = useMemo(
    () => rows.map((r) => ({ row: r, pct: completion(r) })),
    [rows, fields],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter(({ row, pct }) => {
      if (q) {
        const hay = `${row.email || ""} ${row.full_name || ""} ${row.phone || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status === "complete") return !!row.profile_completed_at;
      if (status === "partial") return !row.profile_completed_at && pct > 0;
      if (status === "empty") return pct === 0;
      return true;
    });
  }, [enriched, query, status]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const exportCsv = () => {
    const headers = ["Email", "Full name", "Joined", "Onboarding completed", ...fields.map((f) => f.label)];
    const lines = [headers];
    for (const { row } of filtered) {
      lines.push([
        row.email || "",
        row.full_name || "",
        new Date(row.created_at).toISOString().slice(0, 10),
        row.profile_completed_at ? new Date(row.profile_completed_at).toISOString().slice(0, 10) : "",
        ...fields.map((f) => valueFor(row, f)),
      ]);
    }
    const csv = lines
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `onboarding-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Loading onboarding data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Onboarding data</h2>
          <p className="text-sm text-muted-foreground">
            Every answer each learner submitted in the onboarding wizard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-9 w-full sm:w-[240px]"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All learners</SelectItem>
              <SelectItem value="complete">Completed</SelectItem>
              <SelectItem value="partial">In progress</SelectItem>
              <SelectItem value="empty">No data</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} title="Refresh">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {paginated.map(({ row, pct }) => (
          <Card key={row.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                </div>
                {row.profile_completed_at ? (
                  <Badge className="gap-1 shrink-0"><CheckCircle2 className="h-3 w-3" />Complete</Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 shrink-0"><Clock className="h-3 w-3" />Pending</Badge>
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Fields answered</span><span>{pct}%</span>
                </div>
                <Progress value={pct} />
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setSelected(row)}>
                <Eye className="h-4 w-4 mr-2" />View responses
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Learner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px]">Completeness</TableHead>
              <TableHead className="hidden lg:table-cell">Country</TableHead>
              <TableHead className="hidden lg:table-cell">Employment</TableHead>
              <TableHead className="hidden xl:table-cell">Source</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[80px] text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(({ row, pct }) => (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelected(row)}>
                <TableCell>
                  <p className="font-medium">{row.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </TableCell>
                <TableCell>
                  {row.profile_completed_at ? (
                    <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Complete</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="w-24" />
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{row.country || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{row.employment_status || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="hidden xl:table-cell text-sm">{row.referral_source || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelected(row); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate">{selected?.full_name || selected?.email}</DialogTitle>
            <DialogDescription>
              Onboarding responses · {selected?.profile_completed_at ? "completed" : "in progress"}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {sections.map((s) => {
                const meta = SECTION_TITLE[s.key] || { title: s.key, subtitle: "" };
                return (
                  <div key={s.key}>
                    <h4 className="text-sm font-semibold mb-2">{meta.title}</h4>
                    <div className="rounded-lg border divide-y">
                      {s.fields.map((f) => {
                        const v = valueFor(selected, f);
                        return (
                          <div key={f.id} className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-3">
                            <p className="text-xs text-muted-foreground sm:col-span-1">{f.label}</p>
                            <p className="text-sm sm:col-span-2 break-words">
                              {v || <span className="text-muted-foreground">Not provided</span>}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingData;
