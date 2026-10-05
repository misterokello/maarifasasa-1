import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, DollarSign, MousePointer, ShoppingCart, TrendingUp, FileText, CreditCard, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { generateAffiliatePDF } from "./affiliatePdfExport";
import { fmtCurrency, fmtMultiCurrency } from "@/lib/currencyFormat";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

interface AffiliateDetailDialogProps {
  affiliateId: string | null;
  onClose: () => void;
}

export function AffiliateDetailDialog({ affiliateId, onClose }: AffiliateDetailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [selectedConversionIds, setSelectedConversionIds] = useState<Set<string>>(new Set());
  const [bulkPaying, setBulkPaying] = useState(false);

  const { data: affiliate, isLoading } = useQuery({
    queryKey: ["admin-affiliate-detail", affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*, profiles(full_name, email, phone, location)")
        .eq("id", affiliateId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateId,
  });

  const { data: links } = useQuery({
    queryKey: ["admin-affiliate-links", affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*, products(name, slug)")
        .eq("affiliate_id", affiliateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateId,
  });

  const { data: conversions } = useQuery({
    queryKey: ["admin-affiliate-conversions", affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_conversions")
        .select("*, products(name)")
        .eq("affiliate_id", affiliateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!affiliateId,
  });

  const { data: clicks } = useQuery({
    queryKey: ["admin-affiliate-clicks", affiliateId],
    queryFn: async () => {
      if (!links || links.length === 0) return [];
      const linkIds = links.map((l: any) => l.id);
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("created_at, link_id")
        .in("link_id", linkIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!links && links.length > 0,
  });

  // Profile edit state
  const [commissionOverride, setCommissionOverride] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("");
  const [payoutDetails, setPayoutDetails] = useState<string>("");

  // Initialize form when data loads
  const initForm = () => {
    if (affiliate && !saving) {
      setCommissionOverride(affiliate.commission_rate_override?.toString() || "");
      setPayoutMethod(affiliate.payout_method || "");
      setPayoutDetails(
        affiliate.payout_details ? JSON.stringify(affiliate.payout_details, null, 2) : ""
      );
    }
  };

  // Effect-like initialization via query
  if (affiliate && commissionOverride === "" && payoutMethod === "" && payoutDetails === "") {
    initForm();
  }

  const saveProfile = async () => {
    if (!affiliateId) return;
    setSaving(true);
    try {
      let parsedDetails = null;
      if (payoutDetails.trim()) {
        try {
          parsedDetails = JSON.parse(payoutDetails);
        } catch {
          parsedDetails = { raw: payoutDetails };
        }
      }

      const { error } = await supabase
        .from("affiliates")
        .update({
          commission_rate_override: commissionOverride ? parseFloat(commissionOverride) : null,
          payout_method: payoutMethod || null,
          payout_details: parsedDetails,
        })
        .eq("id", affiliateId);

      if (error) throw error;
      toast({ title: "Saved", description: "Affiliate profile updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-detail", affiliateId] });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const markConversionPaid = async (convId: string, commissionAmount: number) => {
    const { error: convError } = await supabase
      .from("affiliate_conversions")
      .update({ status: "paid" })
      .eq("id", convId);

    if (convError) {
      toast({ title: "Error", description: convError.message, variant: "destructive" });
      return;
    }

    // Update total_paid on affiliate
    const currentPaid = Number(affiliate?.total_paid || 0);
    const { error: affError } = await supabase
      .from("affiliates")
      .update({ total_paid: currentPaid + commissionAmount })
      .eq("id", affiliateId!);

    if (affError) {
      toast({ title: "Warning", description: "Conversion marked paid but total_paid not updated", variant: "destructive" });
    } else {
      toast({ title: "Paid", description: `$${commissionAmount.toFixed(2)} marked as paid` });
    }

    queryClient.invalidateQueries({ queryKey: ["admin-affiliate-conversions", affiliateId] });
    queryClient.invalidateQueries({ queryKey: ["admin-affiliate-detail", affiliateId] });
    queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
  };

  // Stats - group by currency
  const totalClicks = links?.reduce((s, l: any) => s + (l.clicks || 0), 0) || 0;
  const totalConversions = conversions?.length || 0;
  const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "0.0";
  const pendingConvs = conversions?.filter((c: any) => c.status === "pending") || [];
  const approvedConvs2 = conversions?.filter((c: any) => c.status === "approved") || [];
  const paidConvs = conversions?.filter((c: any) => c.status === "paid") || [];
  const approvedConversions = conversions?.filter((c: any) => c.status === "approved") || [];
  const pendingDisplay = fmtMultiCurrency(pendingConvs);
  const approvedDisplay = fmtMultiCurrency(approvedConvs2);
  const paidDisplay = fmtMultiCurrency(paidConvs);

  const toggleConversion = (id: string) => {
    setSelectedConversionIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllApproved = () => {
    if (selectedConversionIds.size === approvedConversions.length) {
      setSelectedConversionIds(new Set());
    } else {
      setSelectedConversionIds(new Set(approvedConversions.map((c: any) => c.id)));
    }
  };

  const bulkMarkPaid = async () => {
    if (selectedConversionIds.size === 0) return;
    setBulkPaying(true);
    try {
      const selected = conversions?.filter((c: any) => selectedConversionIds.has(c.id)) || [];
      const { error } = await supabase
        .from("affiliate_conversions")
        .update({ status: "paid" })
        .in("id", Array.from(selectedConversionIds));
      if (error) throw error;

      const totalCommission = selected.reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
      const currentPaid = Number(affiliate?.total_paid || 0);
      await supabase
        .from("affiliates")
        .update({ total_paid: currentPaid + totalCommission })
        .eq("id", affiliateId!);

      toast({ title: "Bulk Payout Complete", description: `${selected.length} conversions marked as paid` });
      setSelectedConversionIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-conversions", affiliateId] });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-detail", affiliateId] });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBulkPaying(false);
    }
  };
  const totalEarningsDisplay = fmtMultiCurrency(conversions || []);
  const totalPaidDisplay = fmtMultiCurrency(paidConvs);

  // Chart data: clicks per day (last 30 days)
  const clicksPerDay = (() => {
    if (!clicks) return [];
    const map: Record<string, number> = {};
    clicks.forEach((c: any) => {
      const day = format(new Date(c.created_at), "MMM d");
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([day, count]) => ({ day, clicks: count }));
  })();

  // Chart data: conversions per day
  const conversionsPerDay = (() => {
    if (!conversions) return [];
    const map: Record<string, { count: number; amount: number }> = {};
    conversions.forEach((c: any) => {
      const day = format(new Date(c.created_at), "MMM d");
      if (!map[day]) map[day] = { count: 0, amount: 0 };
      map[day].count += 1;
      map[day].amount += Number(c.commission_amount);
    });
    return Object.entries(map).map(([day, d]) => ({ day, conversions: d.count, earnings: d.amount }));
  })();

  const handleExportPDF = () => {
    if (!affiliate) return;
    generateAffiliatePDF({
      affiliate,
      links: links || [],
      conversions: conversions || [],
      stats: {
        totalClicks,
        totalConversions,
        conversionRate: convRate,
        pendingAmount: pendingDisplay,
        approvedAmount: approvedDisplay,
        paidAmount: paidDisplay,
        totalEarnings: totalEarningsDisplay,
        totalPaid: totalPaidDisplay,
      },
    });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-emerald-100 text-emerald-800",
      paid: "bg-blue-100 text-blue-800",
    };
    return <Badge className={`${colors[status] || "bg-muted"} capitalize`}>{status}</Badge>;
  };

  if (!affiliateId) return null;

  return (
    <Dialog open={!!affiliateId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {isLoading ? "Loading..." : affiliate?.profiles?.full_name || affiliate?.profiles?.email || "Affiliate"}
            </DialogTitle>
            <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={isLoading}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="bg-muted/50 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile">Profile & Payouts</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="conversions">Conversions & Payouts</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total Earnings", value: totalEarningsDisplay, icon: <DollarSign className="h-4 w-4 text-emerald-500" />, bg: "bg-emerald-500/10" },
                  { label: "Total Paid", value: totalPaidDisplay, icon: <CreditCard className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/10" },
                  { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: <MousePointer className="h-4 w-4 text-violet-500" />, bg: "bg-violet-500/10" },
                  { label: "Conversion Rate", value: `${convRate}%`, icon: <ShoppingCart className="h-4 w-4 text-orange-500" />, bg: "bg-orange-500/10" },
                ].map((s) => (
                  <Card key={s.label} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${s.bg}`}>{s.icon}</div>
                        <div>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className="text-lg font-bold">{s.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Earnings breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold text-amber-600">{pendingDisplay}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Approved</p>
                    <p className="text-lg font-bold text-emerald-600">{approvedDisplay}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Paid Out</p>
                    <p className="text-lg font-bold text-blue-600">{paidDisplay}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Click trend chart */}
              {clicksPerDay.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="text-sm">Click Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={clicksPerDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Earnings trend chart */}
              {conversionsPerDay.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="text-sm">Earnings Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={conversionsPerDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* PROFILE & PAYOUTS TAB */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{affiliate?.profiles?.full_name || "—"}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{affiliate?.profiles?.email || "—"}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{affiliate?.profiles?.phone || "—"}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{affiliate?.profiles?.location || "—"}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Motivation:</span> <span className="font-medium">{affiliate?.motivation || "—"}</span></div>
                  <div><span className="text-muted-foreground">Joined:</span> <span className="font-medium">{format(new Date(affiliate?.created_at), "MMM d, yyyy")}</span></div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm">Commission & Payout Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Commission Override (%)</Label>
                      <Input
                        type="number"
                        value={commissionOverride}
                        onChange={(e) => setCommissionOverride(e.target.value)}
                        placeholder="Use product default"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave empty to use per-product rates</p>
                    </div>
                    <div>
                      <Label>Payout Method</Label>
                      <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                        <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="crypto">Crypto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Payout Details</Label>
                    <Textarea
                      value={payoutDetails}
                      onChange={(e) => setPayoutDetails(e.target.value)}
                      placeholder='e.g. {"phone": "+256...", "network": "MTN"}'
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">JSON or free text with account details</p>
                  </div>
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LINKS TAB */}
            <TabsContent value="links">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm">Referral Links ({links?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links?.map((link: any) => (
                        <TableRow key={link.id}>
                          <TableCell className="font-medium">{link.products?.name || "—"}</TableCell>
                          <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{link.code}</code></TableCell>
                          <TableCell>{link.clicks}</TableCell>
                          <TableCell className="text-sm">{format(new Date(link.created_at), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                      {(!links || links.length === 0) && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No links yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONVERSIONS & PAYOUTS TAB */}
            <TabsContent value="conversions">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Conversions ({conversions?.length || 0})</CardTitle>
                    {approvedConversions.length > 0 && (
                      <Button
                        size="sm"
                        onClick={bulkMarkPaid}
                        disabled={selectedConversionIds.size === 0 || bulkPaying}
                      >
                        {bulkPaying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                        Mark Selected Paid ({selectedConversionIds.size})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {approvedConversions.length > 0 && (
                          <TableHead className="w-10">
                            <Checkbox
                              checked={approvedConversions.length > 0 && selectedConversionIds.size === approvedConversions.length}
                              onCheckedChange={toggleAllApproved}
                            />
                          </TableHead>
                        )}
                        <TableHead>Date</TableHead>
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
                          {approvedConversions.length > 0 && (
                            <TableCell>
                              {conv.status === "approved" && (
                                <Checkbox
                                  checked={selectedConversionIds.has(conv.id)}
                                  onCheckedChange={() => toggleConversion(conv.id)}
                                />
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-sm">{format(new Date(conv.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>{conv.products?.name || "—"}</TableCell>
                          <TableCell>{fmtCurrency(Number(conv.order_amount), conv.currency)}</TableCell>
                          <TableCell className="text-emerald-600 font-medium">{fmtCurrency(Number(conv.commission_amount), conv.currency)}</TableCell>
                          <TableCell>{statusBadge(conv.status)}</TableCell>
                          <TableCell>
                            {conv.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markConversionPaid(conv.id, Number(conv.commission_amount))}
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Mark Paid
                              </Button>
                            )}
                            {conv.status === "paid" && (
                              <span className="text-xs text-muted-foreground">Paid ✓</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!conversions || conversions.length === 0) && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No conversions yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
