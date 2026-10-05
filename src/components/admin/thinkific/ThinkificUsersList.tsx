import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, ChevronLeft, ChevronRight, RefreshCw, Users, ArrowUp, ArrowDown, ArrowUpDown, UserPlus, CalendarClock, Download, TrendingUp, TrendingDown, Minus, Info, AlertTriangle, X, Mail } from "lucide-react";
import BulkEmailDialog from "@/components/admin/BulkEmailDialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ThinkificUser {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  roles?: string[];
  created_at?: string;
  last_sign_in?: string;
  affiliate_code?: string;
  company?: string;
}

const SORT_KEYS = ["name", "email", "roles", "created_at", "last_sign_in"] as const;
type SortKey = typeof SORT_KEYS[number];

const DATE_KEYS: SortKey[] = ["created_at", "last_sign_in"];
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500] as const;

type RangeOption = "7d" | "30d" | "90d" | "180d" | "365d" | "custom";
const RANGE_LABELS: Record<RangeOption, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last quarter",
  "180d": "Last 6 months",
  "365d": "Last year",
  "custom": "Custom range",
};
const RANGE_DAYS: Record<Exclude<RangeOption, "custom">, number> = {
  "7d": 7, "30d": 30, "90d": 90, "180d": 180, "365d": 365,
};

const ThinkificUsersList = () => {
  const navigate = useNavigate();
  // We fetch the entire user set once per search/refresh and then sort +
  // paginate locally. The Thinkific /users endpoint ignores `order_by` /
  // `direction`, so server-side sorting only ever reorders the current page.
  // Keeping the full set in memory lets sort apply to the entire dataset.
  const [allUsers, setAllUsers] = useState<ThinkificUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<{ error: string; thinkificStatus: number | null; details: string | null } | null>(null);
  // When true, the next fetch busts the server-side cache.
  const forceRefreshRef = useRef(false);
  // SWR state: which payload we're currently showing.
  const [cacheStatus, setCacheStatus] = useState<"fresh" | "stale" | "revalidating" | "live" | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  // Guard so a single stale response triggers at most one background refetch.
  const revalidatingRef = useRef(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [meta, setMeta] = useState<{ total_pages?: number; current_page?: number; total_items?: number }>({});

  // Analytics stats
  const [range, setRange] = useState<RangeOption>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const computeRange = (): { from: Date; to: Date; label: string } | null => {
    const now = new Date();
    if (range === "custom") {
      if (!customFrom || !customTo) return null;
      return { from: customFrom, to: customTo, label: `${format(customFrom, "MMM d, yyyy")} – ${format(customTo, "MMM d, yyyy")}` };
    }
    const days = RANGE_DAYS[range];
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    return { from, to: now, label: RANGE_LABELS[range] };
  };

  // Stats are computed locally from the already-cached `allUsers` dataset.
  // We avoid a separate edge-function call (which previously assumed the
  // Thinkific API returns users sorted by created_at desc — it doesn't,
  // so that function early-stopped and returned 0).
  const statsLoading = loading && allUsers.length === 0;
  const { stats, prevStats } = React.useMemo(() => {
    const r = computeRange();
    const total_users = allUsers.length;
    if (!r) {
      return {
        stats: { total_users, in_range: 0, series: [] as { date: string; count: number }[] },
        prevStats: null as null | { in_range: number; series: { date: string; count: number }[]; from: string; to: string },
      };
    }
    const fromMs = r.from.getTime();
    const toMs = r.to.getTime();
    const durationMs = toMs - fromMs;
    const prevTo = new Date(fromMs);
    const prevFrom = new Date(fromMs - durationMs);
    const prevFromMs = prevFrom.getTime();
    const prevToMs = prevTo.getTime();

    // Initialise daily buckets for the current period.
    const series: Record<string, number> = {};
    const prevSeries: Record<string, number> = {};
    const startDay = new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate());
    const endDay = new Date(r.to.getFullYear(), r.to.getMonth(), r.to.getDate());
    for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
      series[format(d, "yyyy-MM-dd")] = 0;
    }
    const prevStartDay = new Date(prevFrom.getFullYear(), prevFrom.getMonth(), prevFrom.getDate());
    const prevEndDay = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate());
    for (let d = new Date(prevStartDay); d <= prevEndDay; d.setDate(d.getDate() + 1)) {
      prevSeries[format(d, "yyyy-MM-dd")] = 0;
    }

    let in_range = 0;
    let prev_in_range = 0;
    for (const u of allUsers) {
      if (!u.created_at) continue;
      const t = new Date(u.created_at).getTime();
      if (Number.isNaN(t)) continue;
      if (t >= fromMs && t <= toMs) {
        in_range++;
        const key = format(new Date(t), "yyyy-MM-dd");
        series[key] = (series[key] ?? 0) + 1;
      } else if (t >= prevFromMs && t < prevToMs) {
        prev_in_range++;
        const key = format(new Date(t), "yyyy-MM-dd");
        prevSeries[key] = (prevSeries[key] ?? 0) + 1;
      }
    }

    const toSorted = (m: Record<string, number>) =>
      Object.entries(m)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => ({ date, count }));

    return {
      stats: { total_users, in_range, series: toSorted(series) },
      prevStats: {
        in_range: prev_in_range,
        series: toSorted(prevSeries),
        from: prevFrom.toISOString(),
        to: prevTo.toISOString(),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, range, customFrom, customTo]);

  // Sort + page size kept in local state so the page always opens
  // with newest users first (Joined desc), regardless of prior URL state.
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState<number>(50);

  const updateSort = (key: SortKey, dir: "asc" | "desc") => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      updateSort(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      // Date columns default to newest-first; text columns default to A→Z
      updateSort(key, DATE_KEYS.includes(key) ? "desc" : "asc");
    }
  };

  const updateLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const getSortValue = (u: ThinkificUser, key: SortKey): string | number => {
    switch (key) {
      case "name":
        return (u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "").toLowerCase();
      case "email":
        return (u.email || "").toLowerCase();
      case "roles":
        return (u.roles || []).join(",").toLowerCase();
      case "created_at":
        return u.created_at ? new Date(u.created_at).getTime() : 0;
      case "last_sign_in":
        return u.last_sign_in ? new Date(u.last_sign_in).getTime() : 0;
    }
  };

  // Globally sort the entire dataset, then slice the current page locally.
  const sortedAllUsers = React.useMemo(() => {
    const arr = [...allUsers];
    arr.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [allUsers, sortKey, sortDir]);

  const totalItems = allUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const sortedUsers = React.useMemo(
    () => sortedAllUsers.slice((currentPage - 1) * limit, currentPage * limit),
    [sortedAllUsers, currentPage, limit]
  );

  const SortableHead = ({ k, label }: { k: SortKey; label: string }) => {
    const active = sortKey === k;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    const dirLabel = sortDir === "asc" ? "A→Z" : "Z→A";
    return (
      <TableHead
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        className={active ? "bg-primary/5" : undefined}
      >
        <button
          type="button"
          onClick={() => toggleSort(k)}
          title={active ? `Sorted ${dirLabel}` : `Sort by ${label}`}
          className={
            "inline-flex items-center gap-1.5 transition-colors " +
            (active
              ? "font-semibold text-primary"
              : "font-medium text-muted-foreground hover:text-foreground")
          }
        >
          {label}
          <Icon className={"h-3.5 w-3.5 " + (active ? "" : "opacity-40")} />
          {active && (
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {dirLabel}
            </span>
          )}
        </button>
      </TableHead>
    );
  };

  const fetchUsers = useCallback(async (opts?: { background?: boolean }) => {
    const background = !!opts?.background;
    if (!background) setLoading(true);
    setApiError(null);
    try {
      // Single call to the cached server-side aggregator. The edge function
      // implements stale-while-revalidate: fresh hits return immediately,
      // stale hits return cached data AND trigger a background refresh,
      // and a follow-up call (scheduled below) picks up the fresh data.
      const params = new URLSearchParams({ all: "true" });
      if (search) params.set("query", search);
      if (forceRefreshRef.current) {
        params.set("refresh", "true");
        forceRefreshRef.current = false;
      }
      const { data, error } = await supabase.functions.invoke(
        `thinkific-users?${params.toString()}`,
        { method: "GET" }
      );
      if (error) throw error;
      if (data?.error) {
        setApiError({
          error: data.error,
          thinkificStatus: data.thinkificStatus ?? null,
          details: data.details ?? null,
        });
        if (!background) {
          setAllUsers([]);
          setMeta({});
        }
        return;
      }
      const items: ThinkificUser[] = data?.items ?? [];
      setAllUsers(items);
      setMeta({
        total_items: data?.meta?.pagination?.total_items ?? items.length,
      });
      setCachedAt(data?.cached_at ?? null);
      if (data?.stale) {
        setCacheStatus("stale");
        // Schedule a single background refetch to pick up the revalidated
        // payload the server is now generating. Short delay gives the
        // background job time to complete; no loading spinner shown.
        if (!revalidatingRef.current) {
          revalidatingRef.current = true;
          setCacheStatus("revalidating");
          setTimeout(() => {
            fetchUsers({ background: true }).finally(() => {
              revalidatingRef.current = false;
            });
          }, 3000);
        }
      } else if (data?.cached) {
        setCacheStatus("fresh");
      } else {
        setCacheStatus("live");
      }
    } catch (e: any) {
      console.error(e);
      if (!background) {
        toast.error(e.message || "Failed to load academy users");
        setAllUsers([]);
      } else {
        console.warn("background revalidation failed", e);
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Safety net: any change to sort, direction, page size, or search resets to page 1
  // (covers URL/back-forward navigation as well as direct handler updates).
  useEffect(() => {
    setPage(1);
  }, [sortKey, sortDir, limit, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const rangeInfo = computeRange();

  // Period-over-period delta
  const periodDelta = (() => {
    if (stats?.in_range == null || prevStats?.in_range == null) return null;
    const cur = stats.in_range;
    const prev = prevStats.in_range;
    if (prev === 0) return { pct: cur > 0 ? Infinity : 0, cur, prev };
    return { pct: ((cur - prev) / prev) * 100, cur, prev };
  })();

  const toCsv = (rows: (string | number)[][]) =>
    rows
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const logExport = async (entry: {
    export_type: string;
    filename: string;
    row_count: number;
    range_from?: string | null;
    range_to?: string | null;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await (supabase.from("admin_export_log" as any) as any).insert({
        user_id: user.id,
        user_email: user.email,
        ...entry,
      });
    } catch (e) {
      console.warn("Failed to log export", e);
    }
  };

  const exportSeriesCsv = async () => {
    if (!stats?.series || stats.series.length === 0) {
      toast.error("No data to export");
      return;
    }
    // Combined dataset: current period + previous (comparison) period
    const prevMap = new Map((prevStats?.series ?? []).map((d) => [d.date, d.count]));
    const curMap = new Map(stats.series.map((d) => [d.date, d.count]));
    const header = ["period", "date", "signups"];
    const rows: (string | number)[][] = [header];
    stats.series.forEach((d) => rows.push(["current", d.date, d.count]));
    (prevStats?.series ?? []).forEach((d) => rows.push(["previous", d.date, d.count]));

    const fromStr = rangeInfo ? format(rangeInfo.from, "yyyy-MM-dd") : "from";
    const toStr = rangeInfo ? format(rangeInfo.to, "yyyy-MM-dd") : "to";
    const filename = `signup-trend_${fromStr}_to_${toStr}.csv`;
    downloadCsv(toCsv(rows), filename);
    await logExport({
      export_type: "signup_trend",
      filename,
      row_count: curMap.size + prevMap.size,
      range_from: rangeInfo?.from.toISOString() ?? null,
      range_to: rangeInfo?.to.toISOString() ?? null,
      metadata: {
        current_period: { from: rangeInfo?.from, to: rangeInfo?.to, total: stats.in_range },
        previous_period: { from: prevStats?.from, to: prevStats?.to, total: prevStats?.in_range },
        label: rangeInfo?.label,
      },
    });
    toast.success("Signup trend exported");
  };

  const exportAllUsersCsv = async () => {
    setExporting(true);
    const all: ThinkificUser[] = [];
    try {
      const limit = 100;
      let p = 1;
      const maxPages = 100; // safety cap (10k users)
      while (p <= maxPages) {
        const params = new URLSearchParams({ page: String(p), limit: String(limit) });
        params.set("order_by", "created_at");
        params.set("direction", "desc");
        const { data, error } = await supabase.functions.invoke(
          `thinkific-users?${params.toString()}`,
          { method: "GET" }
        );
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const items: ThinkificUser[] = data?.items ?? [];
        all.push(...items);
        const totalPagesResp = data?.meta?.pagination?.total_pages ?? 1;
        if (p >= totalPagesResp || items.length < limit) break;
        p++;
      }

      const header = ["id", "full_name", "first_name", "last_name", "email", "roles", "company", "affiliate_code", "created_at", "last_sign_in"];
      const rows: (string | number)[][] = [header];
      for (const u of all) {
        rows.push([
          u.id,
          u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim(),
          u.first_name || "",
          u.last_name || "",
          u.email,
          (u.roles || []).join("|"),
          u.company || "",
          u.affiliate_code || "",
          u.created_at || "",
          u.last_sign_in || "",
        ]);
      }
      const filename = `academy-users_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
      downloadCsv(toCsv(rows), filename);
      await logExport({
        export_type: "academy_users_all",
        filename,
        row_count: all.length,
        metadata: { source: "thinkific", contains_pii: true, fields: header },
      });
      toast.success(`Exported ${all.length} users`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to export users");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg">Users Analytics</CardTitle>
              <CardDescription>
                Overview of academy users{rangeInfo ? ` • ${rangeInfo.label}` : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={range} onValueChange={(v) => setRange(v as RangeOption)}>
                <SelectTrigger className="w-[170px] h-9">
                  <CalendarClock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RANGE_LABELS) as RangeOption[]).map((k) => (
                    <SelectItem key={k} value={k}>{RANGE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {range === "custom" && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        {customFrom ? format(customFrom, "MMM d, yyyy") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        {customTo ? format(customTo, "MMM d, yyyy") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus />
                    </PopoverContent>
                  </Popover>
                </>
              )}
              <Button
                onClick={() => { forceRefreshRef.current = true; fetchUsers(); }}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-9"
                title="Refresh (bypasses server cache)"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total users</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold tracking-tight mt-2">
                {statsLoading && stats?.total_users == null ? "—" : (stats?.total_users ?? meta.total_items ?? "—")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">All-time on the academy</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">New in {rangeInfo?.label ?? "range"}</p>
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold tracking-tight mt-2 text-primary">
                {statsLoading ? "…" : (stats?.in_range ?? "—")}
              </p>
              {!statsLoading && periodDelta ? (
                <div className="flex items-center gap-1.5 mt-1">
                  {periodDelta.pct === Infinity ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                      <TrendingUp className="h-3 w-3" /> New
                    </span>
                  ) : periodDelta.pct > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                      <TrendingUp className="h-3 w-3" /> +{periodDelta.pct.toFixed(1)}%
                    </span>
                  ) : periodDelta.pct < 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600">
                      <TrendingDown className="h-3 w-3" /> {periodDelta.pct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
                      <Minus className="h-3 w-3" /> 0%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    vs. previous period ({periodDelta.prev})
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Signups within the selected window
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">% growth</p>
                {periodDelta == null || periodDelta.pct === 0 ? (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                ) : periodDelta.pct > 0 ? (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p
                className={
                  "text-3xl font-bold tracking-tight mt-2 " +
                  (periodDelta == null
                    ? ""
                    : periodDelta.pct === Infinity || periodDelta.pct > 0
                    ? "text-emerald-600"
                    : periodDelta.pct < 0
                    ? "text-red-600"
                    : "")
                }
              >
                {statsLoading || periodDelta == null
                  ? "—"
                  : periodDelta.pct === Infinity
                  ? "New"
                  : `${periodDelta.pct >= 0 ? "+" : ""}${periodDelta.pct.toFixed(1)}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {rangeInfo ? `${rangeInfo.label} vs. previous period` : "vs. previous period"}
                {periodDelta != null && periodDelta.pct !== Infinity && (
                  <span className="ml-1">({periodDelta.cur} vs {periodDelta.prev})</span>
                )}
              </p>
            </div>
          </div>

          {/* Signup trend chart */}
          <div className="mt-4 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Signup trend</p>
                <p className="text-xs text-muted-foreground">
                  New users per day {rangeInfo ? `• ${rangeInfo.label}` : ""}
                </p>
              </div>
              <Button
                onClick={exportSeriesCsv}
                variant="outline"
                size="sm"
                className="h-8"
                disabled={statsLoading || !stats?.series || stats.series.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export CSV
              </Button>
            </div>
            {statsLoading ? (
              <div className="flex items-center justify-center h-[180px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !stats?.series || stats.series.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No signups in this range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.series} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval={Math.max(0, Math.floor(stats.series.length / 8))}
                    tickFormatter={(d) => {
                      const dt = new Date(d);
                      return stats.series && stats.series.length > 60
                        ? format(dt, "MMM d")
                        : format(dt, "MMM d");
                    }}
                    className="text-muted-foreground"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    labelFormatter={(d) => format(new Date(d as string), "EEE, MMM d, yyyy")}
                    formatter={(v: number) => [v, "Signups"]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Academy Users</CardTitle>
              <CardDescription>
                {meta.total_items ? `${meta.total_items} total users` : "Live data from the academy"}
                {cacheStatus && (
                  <span className="ml-2 inline-flex items-center gap-1 align-middle">
                    {cacheStatus === "fresh" && (
                      <Badge variant="secondary" className="text-[10px] font-medium">Cached</Badge>
                    )}
                    {cacheStatus === "stale" && (
                      <Badge variant="outline" className="text-[10px] font-medium text-amber-700 border-amber-300">Stale</Badge>
                    )}
                    {cacheStatus === "revalidating" && (
                      <Badge variant="outline" className="text-[10px] font-medium text-blue-700 border-blue-300">
                        <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                        Refreshing…
                      </Badge>
                    )}
                    {cacheStatus === "live" && (
                      <Badge variant="outline" className="text-[10px] font-medium text-emerald-700 border-emerald-300">Live</Badge>
                    )}
                    {cachedAt && cacheStatus !== "live" && (
                      <span className="text-[10px] text-muted-foreground">
                        as of {new Date(cachedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 w-64"
                  placeholder="Search by email…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">Search</Button>
            </form>
            <Button
              onClick={() => { forceRefreshRef.current = true; fetchUsers(); }}
              variant="outline"
              size="sm"
              disabled={loading}
              title="Refresh (bypasses server cache)"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={() => {
                if (window.confirm(
                  "This will export ALL academy users (including names, emails, and other personal data) to a CSV file. The export will be logged for audit. Continue?"
                )) {
                  exportAllUsersCsv();
                }
              }}
              variant="outline"
              size="sm"
              disabled={exporting}
              title="Export all users (PII — logged for audit)"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Export users
            </Button>
            <Button
              onClick={() => setEmailDialogOpen(true)}
              variant="outline"
              size="sm"
              disabled={loading || sortedUsers.length === 0}
              title="Send an email to the users matching the current search"
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Email users
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {apiError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Thinkific API Error {apiError.thinkificStatus ? `(HTTP ${apiError.thinkificStatus})` : ""}
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      {apiError.error}
                    </p>
                    {apiError.details && (
                      <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-white/60 dark:bg-black/30 rounded p-2 overflow-auto max-h-32">
                        {apiError.details}
                      </pre>
                    )}
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-2">
                      This usually means the Thinkific API token is invalid or expired. Check your Cloud secrets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApiError(null)}
                    className="shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead k="name" label="Name" />
                    <SortableHead k="email" label="Email" />
                    <SortableHead k="roles" label="Roles" />
                    <SortableHead k="created_at" label="Joined" />
                    <SortableHead k="last_sign_in" label="Last sign-in" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : sortedUsers.map((u) => {
                    const name = u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—";
                    return (
                      <TableRow
                        key={u.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin-users/${u.id}`)}
                      >
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(u.roles || []).map((r) => (
                              <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : "Never"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {meta.current_page ?? page}{totalPages ? ` of ${totalPages}` : ""}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows:</span>
                  <Select value={String(limit)} onValueChange={(v) => updateLimit(parseInt(v, 10))}>
                    <SelectTrigger className="h-8 w-[88px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
    <BulkEmailDialog
      open={emailDialogOpen}
      onOpenChange={setEmailDialogOpen}
      audienceLabel={search ? `academy users matching "${search}"` : "all academy users"}
      recipients={sortedUsers.map((u) => ({
        email: u.email,
        name: u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
      }))}
    />
    </div>
  );
};

export default ThinkificUsersList;