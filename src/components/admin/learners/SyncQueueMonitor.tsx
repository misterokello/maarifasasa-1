import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, RotateCw, Ban, Cog } from "lucide-react";
import { toast } from "sonner";

type Job = {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_attempt_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  related_user_id: string | null;
  related_enrollment_id: string | null;
};

const STATUS_TABS = ["pending", "failed", "processing", "done", "all"] as const;
type Status = (typeof STATUS_TABS)[number];

const statusColor: Record<string, string> = {
  pending: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  processing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/15 text-red-700 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const SyncQueueMonitor = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("failed");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("thinkific_sync_queue")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setJobs((data as Job[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [status]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    jobs.forEach((j) => (c[j.status] = (c[j.status] || 0) + 1));
    return c;
  }, [jobs]);

  const retry = async (job: Job) => {
    setBusy(job.id);
    const { error } = await supabase
      .from("thinkific_sync_queue")
      .update({
        status: "pending",
        next_attempt_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", job.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Requeued");
      load();
    }
  };

  const cancel = async (job: Job) => {
    setBusy(job.id);
    const { error } = await supabase
      .from("thinkific_sync_queue")
      .update({ status: "cancelled" })
      .eq("id", job.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Cancelled");
      load();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-primary" />
              Academy Sync Queue
            </CardTitle>
            <CardDescription>
              Retry or dead-letter Thinkific sync jobs. The worker drains pending jobs on cron.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
          <TabsList>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s}
                {counts[s] ? <Badge variant="secondary" className="ml-2">{counts[s]}</Badge> : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No jobs in this state.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Next attempt</TableHead>
                  <TableHead className="min-w-[280px]">Last error</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-mono text-xs">{j.kind}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs ${statusColor[j.status] || ""}`}>
                        {j.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {j.attempts}/{j.max_attempts}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(j.next_attempt_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-red-600 dark:text-red-400 max-w-md truncate" title={j.last_error || ""}>
                      {j.last_error || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === j.id || j.status === "done"}
                          onClick={() => retry(j)}
                        >
                          {busy === j.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCw className="h-3 w-3 mr-1" />
                          )}
                          Retry
                        </Button>
                        {j.status !== "cancelled" && j.status !== "done" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === j.id}
                            onClick={() => cancel(j)}
                          >
                            <Ban className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncQueueMonitor;