import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CreditCard, Smartphone, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { downloadCSV, convertToCSV, formatDateForCSV, formatAmountForCSV } from "@/lib/exportUtils";
import { toast } from "sonner";

type PaymentStatus = "pending" | "success" | "failed" | "cancelled" | "all";
type PaymentMethod = "stripe" | "mobile_money" | "all";

const PAGE_SIZE = 10;

const AdminPaymentsView = () => {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>("all");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const applyFilters = <T,>(query: T): T => {
    let q: any = query;

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (methodFilter !== "all") q = q.eq("payment_method", methodFilter);

    if (dateFilter) {
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);

      q = q
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());
    }

    return q as T;
  };


  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments", statusFilter, methodFilter, dateFilter, currentPage],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const query = applyFilters(
        supabase
          .from("payments")
          .select("*, products(name, slug)")
          .order("created_at", { ascending: false })
          .range(from, to),
      );

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Single aggregate query powers both the stat cards and the pagination count.
  const { data: stats } = useQuery({
    queryKey: ["admin-payments-stats", statusFilter, methodFilter, dateFilter],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      const query = applyFilters(
        supabase.from("payments").select("status, amount, currency"),
      );

      const { data, error } = await query;
      if (error) throw error;

      const base = {
        successCount: 0,
        pendingCount: 0,
        failedCount: 0,
        totalUSD: 0,
        totalUGX: 0,
        totalRows: data?.length || 0,
      };

      return (
        data?.reduce((acc, p) => {
          if (p.status === "success") {
            acc.successCount++;
            if (p.currency === "USD") {
              acc.totalUSD += p.amount;
            } else {
              acc.totalUGX += p.amount;
            }
          }
          if (p.status === "pending") acc.pendingCount++;
          if (p.status === "failed") acc.failedCount++;
          return acc;
        }, base) || base
      );
    },
  });

  const totalCount = stats?.totalRows ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);


  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Export all payments (not just current page)
  const handleExportCSV = async () => {
    try {
      let query = supabase
        .from("payments")
        .select("*, products(name)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (methodFilter !== "all") {
        query = query.eq("payment_method", methodFilter);
      }

      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("No payments to export");
        return;
      }

      const columns = [
        { key: "created_at" as const, header: "Date", formatter: formatDateForCSV },
        { key: "products" as const, header: "Product", formatter: (v: unknown) => (v as { name?: string })?.name || "Unknown" },
        { key: "payment_method" as const, header: "Method", formatter: (v: unknown) => v === "mobile_money" ? "Mobile Money" : "Card" },
        { key: "amount" as const, header: "Amount", formatter: (v: unknown, row?: Record<string, unknown>) => {
          // We need to handle this specially since we need currency
          return String(v);
        }},
        { key: "currency" as const, header: "Currency" },
        { key: "status" as const, header: "Status" },
        { key: "payer_name" as const, header: "Payer Name" },
        { key: "payer_email" as const, header: "Payer Email" },
        { key: "payer_phone" as const, header: "Payer Phone" },
        { key: "provider_reference" as const, header: "Reference" },
      ];

      // Format amount with currency for export
      const formattedData = data.map(row => ({
        ...row,
        amount: formatAmountForCSV(row.amount, row.currency),
      }));

      const csv = convertToCSV(formattedData, columns);
      const filename = `payments-export-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
      downloadCSV(csv, filename);
      toast.success(`Exported ${data.length} payments`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export payments");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "stripe":
        return <CreditCard className="h-4 w-4 text-primary" />;
      case "mobile_money":
        return <Smartphone className="h-4 w-4 text-primary" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "UGX") {
      return `UGX ${amount.toLocaleString()}`;
    }
    return `$${(amount / 100).toFixed(2)}`;
  };

  const displayStats = stats || { successCount: 0, pendingCount: 0, failedCount: 0, totalUSD: 0, totalUGX: 0 };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Successful Payments</p>
                <h3 className="text-2xl font-bold text-emerald-600">{displayStats.successCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <h3 className="text-2xl font-bold text-amber-600">{displayStats.pendingCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total USD</p>
                <h3 className="text-2xl font-bold">${(displayStats.totalUSD / 100).toFixed(2)}</h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total UGX</p>
                <h3 className="text-2xl font-bold">UGX {displayStats.totalUGX.toLocaleString()}</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <CreditCard className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-40">
            <Select 
              value={statusFilter} 
              onValueChange={(v) => {
                setStatusFilter(v as PaymentStatus);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select 
              value={methodFilter} 
              onValueChange={(v) => {
                setMethodFilter(v as PaymentMethod);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="stripe">Stripe (Card)</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                handleFilterChange();
              }}
              placeholder="Filter by date"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => {
                setDateFilter("");
                handleFilterChange();
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Clear date
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Payments Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading payments...</div>
          ) : !payments?.length ? (
            <div className="p-8 text-center text-muted-foreground">No payments found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {payment.products?.name || "Unknown Product"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.payment_method)}
                        <span className="capitalize">
                          {payment.payment_method === "mobile_money" ? "Mobile Money" : "Card"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.payer_name && <div>{payment.payer_name}</div>}
                        {payment.payer_email && (
                          <div className="text-muted-foreground">{payment.payer_email}</div>
                        )}
                        {payment.payer_phone && (
                          <div className="text-muted-foreground">{payment.payer_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {payment.provider_reference || payment.external_id || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminPaymentsView;
