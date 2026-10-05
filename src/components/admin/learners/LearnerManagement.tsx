import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, RotateCcw, Eye, Mail, CreditCard, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LearnerDetails from "./LearnerDetails";

interface Learner {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  payment_count: number;
  total_spent_ugx: number;
  total_spent_usd: number;
}

const LearnerManagement = () => {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [filteredLearners, setFilteredLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const loadLearners = async () => {
    setLoading(true);
    try {
      // Fetch profiles with payment aggregation
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, location, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch payment summaries for all users
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("user_id, amount, currency, status")
        .eq("status", "success");

      if (paymentError) throw paymentError;

      // Aggregate payments per user
      const paymentsByUser = paymentData?.reduce((acc, payment) => {
        if (!payment.user_id) return acc;
        if (!acc[payment.user_id]) {
          acc[payment.user_id] = { count: 0, ugx: 0, usd: 0 };
        }
        acc[payment.user_id].count++;
        if (payment.currency === "UGX") {
          acc[payment.user_id].ugx += payment.amount;
        } else if (payment.currency === "USD") {
          acc[payment.user_id].usd += payment.amount;
        }
        return acc;
      }, {} as Record<string, { count: number; ugx: number; usd: number }>) || {};

      // Combine profiles with payment data
      const learnersWithPayments: Learner[] = (profiles || []).map((profile) => ({
        ...profile,
        payment_count: paymentsByUser[profile.id]?.count || 0,
        total_spent_ugx: paymentsByUser[profile.id]?.ugx || 0,
        total_spent_usd: paymentsByUser[profile.id]?.usd || 0,
      }));

      setLearners(learnersWithPayments);
      setFilteredLearners(learnersWithPayments);
    } catch (error) {
      console.error("Error loading learners:", error);
      toast.error("Failed to load learners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearners();
  }, []);

  useEffect(() => {
    const filtered = learners.filter(
      (learner) =>
        learner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        learner.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        learner.phone?.includes(searchQuery)
    );
    setFilteredLearners(filtered);
    setPage(1);
  }, [searchQuery, learners]);

  const paginatedLearners = filteredLearners.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalPages = Math.ceil(filteredLearners.length / pageSize);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "UGX") {
      return new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Loading learners...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Learner Management
          </h2>
          <p className="text-muted-foreground">
            View and manage learner accounts, payment history, and communications
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[280px]"
            />
          </div>
          <Button variant="outline" onClick={loadLearners}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Learners</p>
          <p className="text-2xl font-bold">{learners.length}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">With Payments</p>
          <p className="text-2xl font-bold">
            {learners.filter((l) => l.payment_count > 0).length}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">New This Month</p>
          <p className="text-2xl font-bold">
            {learners.filter((l) => {
              const created = new Date(l.created_at);
              const now = new Date();
              return (
                created.getMonth() === now.getMonth() &&
                created.getFullYear() === now.getFullYear()
              );
            }).length}
          </p>
        </div>
      </div>

      {filteredLearners.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            {searchQuery ? "No learners match your search." : "No learners found."}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Learner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Payments</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLearners.map((learner) => (
                  <TableRow key={learner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {learner.full_name || "No name"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {learner.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {learner.phone || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {learner.location || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {learner.payment_count > 0 ? (
                        <Badge variant="secondary">{learner.payment_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        {learner.total_spent_ugx > 0 && (
                          <p>{formatCurrency(learner.total_spent_ugx, "UGX")}</p>
                        )}
                        {learner.total_spent_usd > 0 && (
                          <p>{formatCurrency(learner.total_spent_usd, "USD")}</p>
                        )}
                        {learner.total_spent_ugx === 0 && learner.total_spent_usd === 0 && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(learner.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLearner(learner)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Send email"
                        >
                          <a href={`mailto:${learner.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filteredLearners.length)} of{" "}
                {filteredLearners.length} learners
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Learner Details Dialog */}
      <Dialog open={!!selectedLearner} onOpenChange={() => setSelectedLearner(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Learner Details</DialogTitle>
            <DialogDescription>
              View complete learner profile and payment history
            </DialogDescription>
          </DialogHeader>
          {selectedLearner && (
            <LearnerDetails learner={selectedLearner} onClose={() => setSelectedLearner(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearnerManagement;
