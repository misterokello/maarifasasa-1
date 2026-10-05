import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AffiliateProductsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [adding, setAdding] = useState(false);

  const { data: affiliateProducts, isLoading } = useQuery({
    queryKey: ["admin-affiliate-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_products")
        .select("*, products(name, slug, price_usd)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Products not yet in affiliate program
  const { data: availableProducts } = useQuery({
    queryKey: ["admin-non-affiliate-products"],
    queryFn: async () => {
      const { data: allProducts, error: pErr } = await supabase
        .from("products")
        .select("id, name, slug")
        .eq("is_active", true);
      if (pErr) throw pErr;

      const { data: affProds } = await supabase
        .from("affiliate_products")
        .select("product_id");

      const usedIds = new Set(affProds?.map(ap => ap.product_id) || []);
      return allProducts?.filter(p => !usedIds.has(p.id)) || [];
    },
  });

  const addProduct = async () => {
    if (!selectedProductId) return;
    setAdding(true);
    try {
      const { error } = await supabase.from("affiliate_products").insert({
        product_id: selectedProductId,
        commission_percent: parseFloat(commissionPercent) || 10,
      });
      if (error) throw error;
      toast({ title: "Added", description: "Product added to affiliate program" });
      setSelectedProductId("");
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-non-affiliate-products"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("affiliate_products")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] });
    }
  };

  const updateCommission = async (id: string, percent: string) => {
    const { error } = await supabase
      .from("affiliate_products")
      .update({ commission_percent: parseFloat(percent) })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] });
      toast({ title: "Updated", description: "Commission rate updated" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add product form */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Add Product to Affiliate Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="w-24"
                min="0"
                max="100"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Button onClick={addProduct} disabled={!selectedProductId || adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing affiliate products */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Affiliate Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliateProducts?.map((ap: any) => (
                  <TableRow key={ap.id}>
                    <TableCell className="font-medium">{ap.products?.name || "—"}</TableCell>
                    <TableCell>${ap.products?.price_usd || 0}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={ap.commission_percent}
                        className="w-20"
                        min="0"
                        max="100"
                        onBlur={(e) => updateCommission(ap.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ap.is_active}
                        onCheckedChange={() => toggleActive(ap.id, ap.is_active)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
