import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const PLATFORM_URL = "https://affiliates.maarifasasa.com";
const REFRESH_MS = 60_000;

type RestResp = {
  rows: any[];
  table: string | null;
  total: number | null;
  error: any | null;
};

async function fetchResource(
  resource: "affiliates" | "links" | "clicks" | "conversions",
  payload: Record<string, any>,
): Promise<RestResp> {
  const { data, error } = await supabase.functions.invoke("affiliate-proxy", {
    body: { action: "rest", payload: { resource, ...payload } },
  });
  if (error) throw error;
  return data as RestResp;
}

function fmtUSD(n: number) {
  return `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function LivePlatformPanel() {
  const qc = useQueryClient();

  const affiliatesQ = useQuery({
    queryKey: ["aff-live", "affiliates"],
    queryFn: () =>
      fetchResource("affiliates", {
        select: "*",
        order: "created_at.desc",
        limit: 1000,
        count: true,
      }),
    refetchInterval: REFRESH_MS,
    retry: 1,
  });

  const linksQ = useQuery({
    queryKey: ["aff-live", "links"],
    queryFn: () =>
      fetchResource("links", {
        select: "*",
        order: "created_at.desc",
        limit: 200,
        count: true,
      }),
    refetchInterval: REFRESH_MS,
    retry: 1,
  });

  const clicksQ = useQuery({
    queryKey: ["aff-live", "clicks"],
    queryFn: () =>
      fetchResource("clicks", {
        select: "*",
        order: "created_at.desc",
        limit: 10,
        count: true,
      }),
    refetchInterval: REFRESH_MS,
    retry: 1,
  });

  const convQ = useQuery({
    queryKey: ["aff-live", "conversions"],
    queryFn: () =>
      fetchResource("conversions", {
        select: "*",
        order: "created_at.desc",
        limit: 10,
        count: true,
      }),
    refetchInterval: REFRESH_MS,
    retry: 1,
  });

  const queries = [affiliatesQ, linksQ, clicksQ, convQ];
  const isLoading = queries.some((q) => q.isLoading);
  const errors = queries
    .map((q, i) => {
      const labels = ["affiliates", "links", "clicks", "conversions"];
      const errMsg =
        q.error instanceof Error
          ? q.error.message
          : q.data?.error
            ? JSON.stringify(q.data.error)
            : null;
      return errMsg ? { label: labels[i], err: errMsg } : null;
    })
    .filter(Boolean) as { label: string; err: string }[];

  const liveStatus: "online" | "degraded" | "offline" =
    errors.length === queries.length
      ? "offline"
      : errors.length > 0
        ? "degraded"
        : "online";

  const affiliates = affiliatesQ.data?.rows || [];
  const affiliateCount = affiliatesQ.data?.total ?? affiliates.length;
  const approvedCount = affiliates.filter((a: any) => a.status === "approved").length;
  const pendingCount = affiliates.filter((a: any) => a.status === "pending").length;
  // Schema-tolerant: pick whichever earnings field exists
  const pickNum = (o: any, keys: string[]) => {
    for (const k of keys) if (o?.[k] != null) return Number(o[k]) || 0;
    return 0;
  };
  const totalEarnings = affiliates.reduce(
    (s: number, a: any) =>
      s + pickNum(a, ["total_earnings", "earnings", "total_commission", "commission_total"]),
    0,
  );
  const totalPaid = affiliates.reduce(
    (s: number, a: any) => s + pickNum(a, ["total_paid", "paid", "payouts_total"]),
    0,
  );

  const totalClicks = clicksQ.data?.total ?? clicksQ.data?.rows?.length ?? 0;
  const totalConversions = convQ.data?.total ?? convQ.data?.rows?.length ?? 0;
  const conversions = convQ.data?.rows || [];

  const conversionRate = useMemo(() => {
    if (!totalClicks) return 0;
    return Math.round((totalConversions / totalClicks) * 1000) / 10;
  }, [totalClicks, totalConversions]);

  const platformRevenue = conversions.reduce(
    (s: number, c: any) =>
      s + pickNum(c, ["order_amount", "amount", "gross_amount", "total"]),
    0,
  );

  // Build affiliate_id → code lookup from links (since conversions store affiliate_id)
  const codeByAffiliateId = useMemo(() => {
    const m: Record<string, string> = {};
    (linksQ.data?.rows || []).forEach((l: any) => {
      const aid = l.affiliate_id || l.affiliateId;
      if (aid && l.code && !m[aid]) m[aid] = l.code;
    });
    return m;
  }, [linksQ.data]);

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["aff-live"] });
  };

  return (
    <Card className="mb-6 border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                Live from Affiliate Platform
                {liveStatus === "online" && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </Badge>
                )}
                {liveStatus === "degraded" && (
                  <Badge className="bg-amber-500/15 text-amber-600 border-0 gap-1">
                    <AlertTriangle className="h-3 w-3" /> Partial
                  </Badge>
                )}
                {liveStatus === "offline" && (
                  <Badge className="bg-destructive/15 text-destructive border-0 gap-1">
                    <AlertTriangle className="h-3 w-3" /> Offline
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate">
                affiliates.maarifasasa.com · auto-refresh every 60s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={PLATFORM_URL} target="_blank" rel="noopener noreferrer">
                Open <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {errors.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1">
            <p className="font-semibold text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Some live feeds did not respond
            </p>
            <ul className="text-muted-foreground list-disc pl-5">
              {errors.map((e) => (
                <li key={e.label}>
                  <span className="font-medium capitalize">{e.label}</span>: {e.err}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground/80">
              Check that platform RLS allows anon read or that the table name matches.
            </p>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <StatTile
            icon={<Users className="h-4 w-4" />}
            label="Affiliates"
            value={affiliateCount.toLocaleString()}
            sub={`${approvedCount} approved · ${pendingCount} pending`}
            color="text-violet-500"
            bg="bg-violet-500/10"
          />
          <StatTile
            icon={<LinkIcon className="h-4 w-4" />}
            label="Active Links"
            value={(linksQ.data?.total ?? linksQ.data?.rows?.length ?? 0).toLocaleString()}
            sub="Referral links"
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StatTile
            icon={<MousePointerClick className="h-4 w-4" />}
            label="Total Clicks"
            value={totalClicks.toLocaleString()}
            sub="All-time"
            color="text-cyan-500"
            bg="bg-cyan-500/10"
          />
          <StatTile
            icon={<TrendingUp className="h-4 w-4" />}
            label="Conversions"
            value={totalConversions.toLocaleString()}
            sub={`${conversionRate}% CVR`}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <StatTile
            icon={<Wallet className="h-4 w-4" />}
            label="Earnings (commissions)"
            value={fmtUSD(totalEarnings)}
            sub={`${fmtUSD(totalPaid)} paid out`}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
          <StatTile
            icon={<Wallet className="h-4 w-4" />}
            label="Platform Revenue (sample)"
            value={fmtUSD(platformRevenue)}
            sub="From recent conversions"
            color="text-success"
            bg="bg-success/10"
          />
        </div>

        {/* Recent conversions + top links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-2 bg-muted/40 border-b flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent Conversions
              </p>
              <span className="text-[10px] text-muted-foreground">
                {convQ.data?.table ?? "—"}
              </span>
            </div>
            {conversions.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No conversions returned yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Order</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {c.created_at
                          ? formatDistanceToNow(new Date(c.created_at), {
                              addSuffix: true,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono truncate max-w-[120px]">
                        {c.affiliate_code ||
                          codeByAffiliateId[c.affiliate_id] ||
                          (c.affiliate_id ? c.affiliate_id.slice(0, 8) : "—")}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {c.currency || "USD"} {pickNum(c, ["order_amount", "amount", "gross_amount"]).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {c.currency || "USD"}{" "}
                        {pickNum(c, ["commission_amount", "commission", "payout_amount"]).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {c.status || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-2 bg-muted/40 border-b flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top Referral Links
              </p>
              <span className="text-[10px] text-muted-foreground">
                {linksQ.data?.table ?? "—"}
              </span>
            </div>
            {(linksQ.data?.rows?.length ?? 0) === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No link data returned.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(linksQ.data?.rows || [])
                    .slice()
                    .sort((a: any, b: any) => Number(b.clicks || 0) - Number(a.clicks || 0))
                    .slice(0, 10)
                    .map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs font-mono truncate max-w-[180px]">
                        {l.code || l.id}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {Number(l.clicks || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {l.created_at
                          ? formatDistanceToNow(new Date(l.created_at), {
                              addSuffix: true,
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 flex items-start gap-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color} ${bg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-lg font-bold leading-tight truncate">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default LivePlatformPanel;