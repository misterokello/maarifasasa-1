import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Database,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import TallySubmissionDetails from "./TallySubmissionDetails";

interface SubmissionField {
  key: string;
  label: string;
  value: unknown;
  type: string;
}

interface DbSubmission {
  id: string;
  tally_submission_id: string;
  form_id: string;
  form_name: string | null;
  submitted_at: string;
  fields: SubmissionField[];
  created_at: string;
}

interface TallySubmissionsViewProps {
  formId: string;
  formName: string;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 10;

const TallySubmissionsView = ({ formId, formName, onBack }: TallySubmissionsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<DbSubmission | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch submissions from database
  const { data: submissions, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["tally-db-submissions", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tally_submissions")
        .select("*")
        .eq("form_id", formId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map((item) => ({
        ...item,
        fields: (item.fields as unknown as SubmissionField[]) || [],
      })) as DbSubmission[];
    },
  });

  // Submission data can contain PII, so it is not broadcast over realtime.
  // Poll for updates instead (admin-only RLS still applies).
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["tally-db-submissions", formId] });
      queryClient.invalidateQueries({ queryKey: ["tally-forms-db"] });
    }, 30000);

    return () => clearInterval(interval);
  }, [formId, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tally_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submission deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tally-db-submissions", formId] });
      queryClient.invalidateQueries({ queryKey: ["tally-forms-db"] });
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
      if (selectedSubmission) {
        setSelectedSubmission(null);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete submission: ${error.message}`);
    },
  });

  const handleDeleteClick = (id: string) => {
    setSubmissionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (submissionToDelete) {
      deleteMutation.mutate(submissionToDelete);
    }
  };

  const getPreviewText = (submission: DbSubmission): string => {
    const fields = submission.fields || [];
    
    const emailField = fields.find(
      (f) => f.type === "INPUT_EMAIL" || f.key.toLowerCase().includes("email")
    );
    if (emailField?.value) return String(emailField.value);

    const nameField = fields.find(
      (f) =>
        f.type === "INPUT_TEXT" &&
        (f.key.toLowerCase().includes("name") || f.label.toLowerCase().includes("name"))
    );
    if (nameField?.value) return String(nameField.value);

    const firstTextField = fields.find(
      (f) => f.type === "INPUT_TEXT" && f.value
    );
    return firstTextField?.value ? String(firstTextField.value) : "No preview available";
  };

  // Filter submissions
  const filteredSubmissions = submissions?.filter((submission) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return submission.fields.some(
      (field) =>
        String(field.value || "").toLowerCase().includes(searchLower) ||
        field.label.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Paginate
  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Transform for details view
  const transformForDetails = (sub: DbSubmission) => ({
    id: sub.id,
    createdAt: sub.submitted_at,
    fields: sub.fields,
  });

  if (selectedSubmission) {
    return (
      <TallySubmissionDetails
        submission={transformForDetails(selectedSubmission)}
        formName={formName}
        onBack={() => setSelectedSubmission(null)}
        onDelete={() => handleDeleteClick(selectedSubmission.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{formName}</h2>
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3 text-emerald-500" />
                Live
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              {submissions?.length || 0} stored submissions
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5" />
            Submissions
            {filteredSubmissions.length > 0 && (
              <Badge variant="secondary">{filteredSubmissions.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load submissions.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : paginatedSubmissions.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                      <TableHead className="hidden md:table-cell">Fields</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubmissions.map((submission) => (
                      <TableRow key={submission.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
                              {getPreviewText(submission)}
                            </p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {format(new Date(submission.submitted_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(submission.submitted_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{submission.fields.length} fields</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(submission.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No submissions found</p>
              {searchQuery ? (
                <p className="text-sm mt-1">Try adjusting your search query</p>
              ) : (
                <p className="text-sm mt-1">
                  Submissions will appear here when received via webhook
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission from the database? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TallySubmissionsView;
