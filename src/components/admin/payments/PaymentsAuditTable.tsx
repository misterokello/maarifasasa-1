import React, { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Loader2, Search } from "lucide-react";
import { downloadCSV, convertToCSV } from "@/lib/exportUtils";
import PaymentAuditDetailSheet from "./PaymentAuditDetailSheet";
import {
  docState,
  emailState,
  firstEmailError,
  firstError,
  learnerLabel,
  STATE_LABEL,
  STATE_TONE,
  type AuditRow,
} from "./paymentAuditTypes";

const PAGE_SIZE = 15;

const SELECT = `
  id, amount, currency, status, payment_method, provider_reference, external_id,
  payer_name, payer_email, created_at, completed_at,
  products ( name, category ),
  payment_documents (
    doc_type, doc_number, storage_path, issued_at, emailed_at,
    generation_attempts, last_attempt_at, last_error,
    email_status, email_attempts, email_error, email_message_id, email_to
  )
`;

const StateChip = ({ state, error }: { state: string; error?: string | null }) => {
  const chip = (
    <Badge variant="outline" className={`${STATE_TONE[state]} whitespace-nowrap`}>
      {STATE_LABEL[state] ?? state}
    </Badge>
  );
  if (!error) return chip;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{chip}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-words">{error}</TooltipContent>
    </Tooltip>
  );
};

const PaymentsAuditTable = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const filters = { statusFilter, methodFilter, from, to, search };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["payments-audit", filters, page],
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select(SELECT, { count: "exact" })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (methodFilter !== "all") q = q.eq("payment_method", methodFilter);
      if (from) q = q.gte("created_at", new Date(`${from}T00:00:00`).toISOString());
      if (to) q = q.lte("created_at", new Date(`${to}T23:59:59`).toISOString());
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(
          `payer_name.ilike.${term},payer_email.ilike.${term},provider_reference.ilike.${term},external_id.ilike.${term}`,
        );
      }

      const start = (page - 1) * PAGE_SIZE;
      const { data: rows, count, error } = await q.range(start, start + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: (rows || []) as unknown as AuditRow[], count: count || 0 };
    },
  });

  const rows = useMemo(() => {
    const list = data?.rows || [];
    if (outcomeFilter === "all") return list;
    return list.filter((r) => {
      if (outcomeFilter === "doc_failed")
        return docState(r, "invoice") === "failed" || docState(r, "receipt") === "failed";
      if (outcomeFilter === "doc_pending")
        return docState(r, "invoice") === "pending" || docState(r, "receipt") === "pending";
      if (outcomeFilter === "email_failed") return emailState(r) === "failed";
      if (outcomeFilter === "email_not_sent") return emailState(r) === "not_attempted";
      return true;
    });
  }, [data?.rows, outcomeFilter]);

  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const exportCsv = () => {
    const flat = rows.map((r) => ({
      learner: learnerLabel(r),
      email: r.payer_email || "",
      product: r.products?.name || "",
      amount: `${(r.currency || "").toUpperCase()} ${r.amount}`,
      payment_status: r.status,
      method: r.payment_method,
      invoice: STATE_LABEL[docState(r, "invoice")],
      receipt: STATE_LABEL[docState(r, "receipt")],
      email_delivery: STATE_LABEL[emailState(r)],
      generation_error: firstError(r) || "",
      email_error: firstEmailError(r) || "",
      created_at: format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
    }));
    downloadCSV(
      convertToCSV(flat, [
        { key: "learner", header: "Learner" },
        { key: "email", header: "Email" },
        { key: "product", header: "Product" },
        { key: "amount", header: "Amount" },
        { key: "payment_status", header: "Payment status" },
        { key: "method", header: "Method" },
        { key: "invoice", header: "Invoice" },
        { key: "receipt", header: "Receipt" },
        { key: "email_delivery", header: "Email delivery" },
        { key: "generation_error", header: "Generation error" },
        { key: "email_error", header: "Email error" },
        { key: "created_at", header: "Created" },
      ]),
      `payments-audit-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
  };

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base">Payment audit trail</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Learner, email or reference"
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={methodFilter}
              onValueChange={(v) => {
                setMethodFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                <SelectItem value="stripe">Card (Stripe)</SelectItem>
                <SelectItem value="mobile_money">Mobile money</SelectItem>
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                <SelectItem value="doc_failed">Generation failed</SelectItem>
                <SelectItem value="doc_pending">Documents pending</SelectItem>
                <SelectItem value="email_failed">Email failed</SelectItem>
                <SelectItem value="email_not_sent">Email not sent</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-[150px]"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
            <Input
              type="date"
              className="w-[150px]"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No payments match these filters.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(row)}
                      >
                        <TableCell className="max-w-[200px]">
                          <p className="truncate font-medium">{learnerLabel(row)}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.payer_email || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">
                          {row.products?.name || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm font-medium">
                          {(row.currency || "").toUpperCase()}{" "}
                          {Number(row.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm capitalize">{row.status}</TableCell>
                        <TableCell>
                          <StateChip state={docState(row, "invoice")} error={firstError(row)} />
                        </TableCell>
                        <TableCell>
                          <StateChip state={docState(row, "receipt")} error={firstError(row)} />
                        </TableCell>
                        <TableCell>
                          <StateChip state={emailState(row)} error={firstEmailError(row)} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(row.created_at), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelected(row)}
                    className="w-full rounded-lg border border-border p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{learnerLabel(row)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.products?.name || "—"}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-semibold">
                        {(row.currency || "").toUpperCase()}{" "}
                        {Number(row.amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="capitalize">
                        {row.status}
                      </Badge>
                      <StateChip state={docState(row, "invoice")} error={firstError(row)} />
                      <StateChip state={docState(row, "receipt")} error={firstError(row)} />
                      <StateChip state={emailState(row)} error={firstEmailError(row)} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {data?.count || 0} payments
                  {isFetching ? " · refreshing…" : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PaymentAuditDetailSheet
        row={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onChanged={() => {
          void refetch();
          setSelected(null);
        }}
      />
    </TooltipProvider>
  );
};

export default PaymentsAuditTable;
