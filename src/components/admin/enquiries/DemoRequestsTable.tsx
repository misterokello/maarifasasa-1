import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2, CalendarClock, Loader2, Mail, Phone, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type DemoRequest = {
  id: string;
  full_name: string;
  work_email: string;
  organisation: string;
  role: string | null;
  phone: string | null;
  interest: string | null;
  message: string | null;
  preferred_date: string;
  preferred_time: string;
  timezone: string | null;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string;
};

const STATUSES = ["new", "contacted", "scheduled", "completed", "won", "lost"] as const;

const statusTone: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  contacted: "bg-accent/15 text-accent-foreground border-accent/30",
  scheduled: "bg-secondary text-secondary-foreground border-border",
  completed: "bg-muted text-muted-foreground border-border",
  won: "bg-primary text-primary-foreground border-primary",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
};

const DemoRequestsTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<DemoRequest | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-demo-requests"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("demo_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as DemoRequest[];
    },
    staleTime: 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("demo_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-demo-requests"] });
      toast({ title: "Status updated" });
    },
    onError: (err) =>
      toast({
        title: "Could not update status",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      }),
  });

  const rows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!term) return true;
      return [row.full_name, row.work_email, row.organisation, row.interest ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [data, search, statusFilter]);

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    (data ?? []).forEach((row) => {
      map[row.status] = (map[row.status] ?? 0) + 1;
    });
    return map;
  }, [data]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Enterprise demo requests
            {data && <Badge variant="secondary">{data.length}</Badge>}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, organisation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} {counts[s] ? `(${counts[s]})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading demo requests…
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load demo requests."}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No demo requests match your filters yet.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Requested slot</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(row)}
                    >
                      <TableCell>
                        <div className="font-medium">{row.full_name}</div>
                        <div className="text-xs text-muted-foreground">{row.work_email}</div>
                      </TableCell>
                      <TableCell>
                        <div>{row.organisation}</div>
                        {row.role && (
                          <div className="text-xs text-muted-foreground">{row.role}</div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {row.preferred_date} · {row.preferred_time}
                        {row.timezone && (
                          <div className="text-xs text-muted-foreground">{row.timezone}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{row.interest ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(row.created_at), "d MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={row.status}
                          onValueChange={(status) => updateStatus.mutate({ id: row.id, status })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <div key={row.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-xs text-muted-foreground">{row.organisation}</p>
                    </div>
                    <Badge variant="outline" className={statusTone[row.status] ?? ""}>
                      {row.status}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {row.work_email}
                    </p>
                    {row.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" /> {row.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5" /> {row.preferred_date} ·{" "}
                      {row.preferred_time}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Select
                      value={row.status}
                      onValueChange={(status) => updateStatus.mutate({ id: row.id, status })}
                    >
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.full_name}</DialogTitle>
                <DialogDescription>
                  {selected.organisation}
                  {selected.role ? ` · ${selected.role}` : ""}
                </DialogDescription>
              </DialogHeader>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                  <dd>
                    <a className="text-primary underline" href={`mailto:${selected.work_email}`}>
                      {selected.work_email}
                    </a>
                  </dd>
                </div>
                {selected.phone && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phone</dt>
                    <dd>{selected.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Requested slot
                  </dt>
                  <dd>
                    {selected.preferred_date} at {selected.preferred_time}
                    {selected.timezone ? ` (${selected.timezone})` : ""}
                  </dd>
                </div>
                {selected.interest && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Interest
                    </dt>
                    <dd>{selected.interest}</dd>
                  </div>
                )}
                {selected.message && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Notes</dt>
                    <dd className="whitespace-pre-line">{selected.message}</dd>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Received
                    </dt>
                    <dd>{format(new Date(selected.created_at), "d MMM yyyy HH:mm")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Last updated
                    </dt>
                    <dd>{format(new Date(selected.updated_at), "d MMM yyyy HH:mm")}</dd>
                  </div>
                </div>
                {selected.source && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Source</dt>
                    <dd>{selected.source}</dd>
                  </div>
                )}
              </dl>
              <Button asChild className="mt-4 w-full">
                <a href={`mailto:${selected.work_email}?subject=Your%20Maarifasasa%20demo`}>
                  Reply by email
                </a>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DemoRequestsTable;
