import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, GraduationCap, Loader2, Mail, Phone, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type Enquiry = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  notes: string | null;
  admin_notes: string | null;
  preferred_date: string;
  preferred_time: string;
  timezone: string;
  status: string;
  scheduled_at: string | null;
  meet_link: string | null;
  created_at: string;
};

const STATUSES = ["pending", "scheduled", "completed", "cancelled"] as const;

const LearnerEnquiriesTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Enquiry | null>(null);
  const [notes, setNotes] = React.useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-learner-enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_call_requests")
        .select(
          "id, full_name, email, phone, topic, notes, admin_notes, preferred_date, preferred_time, timezone, status, scheduled_at, meet_link, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Enquiry[];
    },
    staleTime: 60_000,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Enquiry> }) => {
      const { error } = await supabase.from("mentor_call_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learner-enquiries"] });
      toast({ title: "Enquiry updated" });
    },
    onError: (err) =>
      toast({
        title: "Could not update enquiry",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      }),
  });

  const rows = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!term) return true;
      return [row.full_name, row.email, row.topic ?? ""].join(" ").toLowerCase().includes(term);
    });
  }, [data, search, statusFilter]);

  const openDetails = (row: Enquiry) => {
    setSelected(row);
    setNotes(row.admin_notes ?? "");
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Learner enquiries
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
              placeholder="Search name, email, topic…"
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
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading enquiries…
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load enquiries."}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No learner enquiries match your filters.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Preferred call</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="cursor-pointer" onClick={() => openDetails(row)}>
                      <TableCell>
                        <div className="font-medium">{row.full_name}</div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{row.topic ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {row.preferred_date} · {row.preferred_time}
                        <div className="text-xs text-muted-foreground">{row.timezone}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(row.created_at), "d MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={row.status}
                          onValueChange={(status) => update.mutate({ id: row.id, patch: { status } })}
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

            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <div key={row.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-xs text-muted-foreground">{row.topic ?? "General enquiry"}</p>
                    </div>
                    <Badge variant="outline">{row.status}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {row.email}
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
                      onValueChange={(status) => update.mutate({ id: row.id, patch: { status } })}
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
                    <Button variant="outline" size="sm" onClick={() => openDetails(row)}>
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
                <DialogDescription>{selected.topic ?? "General enquiry"}</DialogDescription>
              </DialogHeader>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                  <dd>
                    <a className="text-primary underline" href={`mailto:${selected.email}`}>
                      {selected.email}
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
                    Preferred call
                  </dt>
                  <dd>
                    {selected.preferred_date} at {selected.preferred_time} ({selected.timezone})
                  </dd>
                </div>
                {selected.scheduled_at && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Scheduled
                    </dt>
                    <dd>{format(new Date(selected.scheduled_at), "d MMM yyyy HH:mm")}</dd>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Learner notes
                    </dt>
                    <dd className="whitespace-pre-line">{selected.notes}</dd>
                  </div>
                )}
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Internal notes
                  </dt>
                  <dd>
                    <Textarea
                      rows={3}
                      maxLength={2000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </dd>
                </div>
              </dl>
              <Button
                className="mt-4 w-full"
                disabled={update.isPending}
                onClick={() =>
                  update.mutate(
                    { id: selected.id, patch: { admin_notes: notes } },
                    { onSuccess: () => setSelected(null) }
                  )
                }
              >
                {update.isPending ? "Saving…" : "Save notes"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LearnerEnquiriesTable;
