import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, Package, DollarSign, Eye, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AffiliateProductsManager } from "./AffiliateProductsManager";
import { AffiliateDetailDialog } from "./AffiliateDetailDialog";
import { fmtCurrency, fmtMultiCurrency } from "@/lib/currencyFormat";
import { LivePlatformPanel } from "./LivePlatformPanel";

export function AffiliateManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set());
  const [bulkPaying, setBulkPaying] = useState(false);

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: conversions } = useQuery({
    queryKey: ["admin-conversions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_conversions")
        .select("*, affiliates(profiles(full_name, email)), products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateAffiliateStatus = async (affiliateId: string, status: string) => {
    const { error } = await supabase
      .from("affiliates")
      .update({ status })
      .eq("id", affiliateId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Affiliate status changed to ${status}` });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });

      if (status === "approved") {
        const affiliate = affiliates?.find((a: any) => a.id === affiliateId);
        if (affiliate?.profiles?.email) {
          supabase.functions.invoke("affiliate-notify", {
            body: {
              type: "application_approved",
              affiliate_email: affiliate.profiles.email,
              affiliate_name: affiliate.profiles.full_name || "Affiliate",
            },
          }).catch(console.error);
        }
      }
    }
  };

  const updateConversionStatus = async (conversionId: string, status: string) => {
    const { error } = await supabase
      .from("affiliate_conversions")
      .update({ status })
      .eq("id", conversionId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Conversion status changed to ${status}` });
      queryClient.invalidateQueries({ queryKey: ["admin-conversions"] });
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-emerald-100 text-emerald-800",
      rejected: "bg-red-100 text-red-800",
      suspended: "bg-red-100 text-red-800",
      paid: "bg-blue-100 text-blue-800",
    };
    return <Badge className={`${colors[status] || "bg-muted"} capitalize`}>{status}</Badge>;
  };

  // Bulk payout for main conversions tab
  const approvedConvs = useMemo(
    () => conversions?.filter((c: any) => c.status === "approved") || [],
    [conversions]
  );

  const toggleConv = (id: string) => {
    setSelectedConvIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllConvs = () => {
    if (selectedConvIds.size === approvedConvs.length) {
      setSelectedConvIds(new Set());
    } else {
      setSelectedConvIds(new Set(approvedConvs.map((c: any) => c.id)));
    }
  };

  const bulkMarkPaid = async () => {
    if (selectedConvIds.size === 0) return;
    setBulkPaying(true);
    try {
      const selected = conversions?.filter((c: any) => selectedConvIds.has(c.id)) || [];

      const { error } = await supabase
        .from("affiliate_conversions")
        .update({ status: "paid" })
        .in("id", Array.from(selectedConvIds));

      if (error) throw error;

      // Group by affiliate and update total_paid for each
      const byAffiliate: Record<string, number> = {};
      selected.forEach((c: any) => {
        byAffiliate[c.affiliate_id] = (byAffiliate[c.affiliate_id] || 0) + Number(c.commission_amount);
      });

      for (const [affId, amount] of Object.entries(byAffiliate)) {
        const aff = affiliates?.find((a: any) => a.id === affId);
        if (aff) {
          await supabase
            .from("affiliates")
            .update({ total_paid: Number(aff.total_paid || 0) + amount })
            .eq("id", affId);
        }
      }

      toast({ title: "Bulk Payout Complete", description: `${selected.length} conversions marked as paid` });
      setSelectedConvIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-conversions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBulkPaying(false);
    }
  };

  // Summary stats
  const totalAffiliates = affiliates?.length || 0;
  const approvedAffiliates = affiliates?.filter((a: any) => a.status === "approved").length || 0;
  const totalEarningsAll = affiliates?.reduce((s, a: any) => s + Number(a.total_earnings || 0), 0) || 0;
  const totalPaidAll = affiliates?.reduce((s, a: any) => s + Number(a.total_paid || 0), 0) || 0;

  return (
    <>
      {/* Live data from external affiliate platform */}
      <LivePlatformPanel />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-violet-500/10"><Users className="h-4 w-4 text-violet-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Affiliates</p>
              <p className="text-lg font-bold">{totalAffiliates}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/10"><Users className="h-4 w-4 text-emerald-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-lg font-bold">{approvedAffiliates}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10"><DollarSign className="h-4 w-4 text-amber-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
              <p className="text-lg font-bold">${totalEarningsAll.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10"><CreditCard className="h-4 w-4 text-blue-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Paid Out</p>
              <p className="text-lg font-bold">${totalPaidAll.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates">
        <TabsList className="bg-muted/50 mb-6">
          <TabsTrigger value="affiliates"><Users className="h-4 w-4 mr-2" />Affiliates</TabsTrigger>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-2" />Products</TabsTrigger>
          <TabsTrigger value="conversions"><DollarSign className="h-4 w-4 mr-2" />Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Affiliate Applications & Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status Action</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates?.map((aff: any) => (
                      <TableRow key={aff.id}>
                        <TableCell className="font-medium">{aff.profiles?.full_name || "—"}</TableCell>
                        <TableCell>{aff.profiles?.email || "—"}</TableCell>
                        <TableCell>{statusBadge(aff.status)}</TableCell>
                        <TableCell>${Number(aff.total_earnings || 0).toFixed(2)}</TableCell>
                        <TableCell>${Number(aff.total_paid || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{format(new Date(aff.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Select
                            value={aff.status}
                            onValueChange={(val) => updateAffiliateStatus(aff.id, val)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedAffiliateId(aff.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <AffiliateProductsManager />
        </TabsContent>

        <TabsContent value="conversions">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Conversions</CardTitle>
                {approvedConvs.length > 0 && (
                  <Button
                    size="sm"
                    onClick={bulkMarkPaid}
                    disabled={selectedConvIds.size === 0 || bulkPaying}
                  >
                    {bulkPaying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Mark Selected Paid ({selectedConvIds.size})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {approvedConvs.length > 0 && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={approvedConvs.length > 0 && selectedConvIds.size === approvedConvs.length}
                          onCheckedChange={toggleAllConvs}
                        />
                      </TableHead>
                    )}
                    <TableHead>Date</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions?.map((conv: any) => (
                    <TableRow key={conv.id}>
                      {approvedConvs.length > 0 && (
                        <TableCell>
                          {conv.status === "approved" && (
                            <Checkbox
                              checked={selectedConvIds.has(conv.id)}
                              onCheckedChange={() => toggleConv(conv.id)}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-sm">{format(new Date(conv.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{conv.affiliates?.profiles?.full_name || conv.affiliates?.profiles?.email || "—"}</TableCell>
                      <TableCell>{conv.products?.name || "—"}</TableCell>
                      <TableCell>{fmtCurrency(Number(conv.order_amount), conv.currency)}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{fmtCurrency(Number(conv.commission_amount), conv.currency)}</TableCell>
                      <TableCell>{statusBadge(conv.status)}</TableCell>
                      <TableCell>
                        <Select
                          value={conv.status}
                          onValueChange={(val) => updateConversionStatus(conv.id, val)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AffiliateDetailDialog
        affiliateId={selectedAffiliateId}
        onClose={() => setSelectedAffiliateId(null)}
      />
    </>
  );
}
