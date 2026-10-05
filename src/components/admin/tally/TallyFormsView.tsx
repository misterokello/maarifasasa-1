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
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  ClipboardList,
  Database,
  Zap,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import TallySubmissionsView from "./TallySubmissionsView";
import TallyAnalyticsChart from "./TallyAnalyticsChart";

interface FormWithSubmissions {
  form_id: string;
  form_name: string;
  submission_count: number;
  latest_submission: string;
}

interface TallyApiForm {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  numberOfSubmissions: number;
}

interface TallyApiSubmission {
  id: string;
  createdAt: string;
  fields: Array<{
    key: string;
    label: string;
    value: unknown;
    type: string;
  }>;
}

const TallyFormsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormName, setSelectedFormName] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch forms from database (aggregated from submissions)
  const { data: dbForms, isLoading: dbLoading, refetch: refetchDb } = useQuery({
    queryKey: ["tally-forms-db"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tally_submissions")
        .select("form_id, form_name, submitted_at")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Group by form_id
      const formsMap = new Map<string, FormWithSubmissions>();
      data?.forEach((sub) => {
        const existing = formsMap.get(sub.form_id);
        if (!existing) {
          formsMap.set(sub.form_id, {
            form_id: sub.form_id,
            form_name: sub.form_name || "Unknown Form",
            submission_count: 1,
            latest_submission: sub.submitted_at,
          });
        } else {
          existing.submission_count++;
        }
      });

      return Array.from(formsMap.values());
    },
  });

  // Also fetch from Tally API for forms without submissions yet
  const { data: apiForms, isLoading: apiLoading, refetch: refetchApi, isFetching } = useQuery({
    queryKey: ["tally-forms-api"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("tally-api", {
        body: { action: "list-forms" },
      });

      if (error) throw error;
      return (data.forms || data.items || []) as TallyApiForm[];
    },
  });

  // Submission data can contain PII, so it is not broadcast over realtime.
  // Poll for updates instead (admin-only RLS still applies).
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["tally-forms-db"] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Merge API forms with DB counts
  const mergedForms = React.useMemo(() => {
    if (!apiForms) return [];

    const dbCountsMap = new Map(dbForms?.map((f) => [f.form_id, f]) || []);

    return apiForms.map((apiForm) => {
      const dbForm = dbCountsMap.get(apiForm.id);
      return {
        id: apiForm.id,
        name: apiForm.name,
        status: apiForm.status,
        createdAt: apiForm.createdAt,
        apiSubmissions: apiForm.numberOfSubmissions,
        dbSubmissions: dbForm?.submission_count || 0,
        latestSubmission: dbForm?.latest_submission,
      };
    });
  }, [apiForms, dbForms]);

  const filteredForms = mergedForms.filter((form) =>
    (form.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewSubmissions = (formId: string, formName: string) => {
    setSelectedFormId(formId);
    setSelectedFormName(formName);
  };

  const handleBackToForms = () => {
    setSelectedFormId(null);
    setSelectedFormName("");
  };

  const handleRefresh = () => {
    refetchDb();
    refetchApi();
  };

  // Sync all forms mutation
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const formsToSync = mergedForms.filter((f) => f.dbSubmissions < f.apiSubmissions && f.apiSubmissions > 0);
      let totalSynced = 0;

      for (const form of formsToSync) {
        // Fetch all submissions (Tally API returns all at once, no limit param)
        const { data, error } = await supabase.functions.invoke("tally-api", {
          body: {
            action: "get-submissions",
            data: { formId: form.id },
          },
        });

        if (error) throw error;

        // Handle case where data might be undefined or not have expected structure
        const allSubmissions = (data?.submissions || data?.items || []) as TallyApiSubmission[];

        for (const submission of allSubmissions) {
          if (!submission.id) continue; // Skip invalid submissions
          
          await supabase.from("tally_submissions").upsert(
            [{
              tally_submission_id: submission.id,
              form_id: form.id,
              form_name: form.name || "Unknown Form",
              submitted_at: submission.createdAt,
              fields: JSON.parse(JSON.stringify(submission.fields || [])),
            }],
            { onConflict: "tally_submission_id" }
          );
        }

        totalSynced += allSubmissions.length;
      }

      return { formsCount: formsToSync.length, totalSynced };
    },
    onSuccess: (result) => {
      toast.success(`Synced ${result.formsCount} forms`, {
        description: `Imported ${result.totalSynced} submissions total.`,
      });
      queryClient.invalidateQueries({ queryKey: ["tally-forms-db"] });
    },
    onError: (error: Error) => {
      toast.error("Sync all failed", { description: error.message });
    },
  });

  // Sync historical submissions mutation
  const syncMutation = useMutation({
    mutationFn: async (formId: string) => {
      // Fetch all submissions (Tally API returns all at once, no limit param)
      const { data, error } = await supabase.functions.invoke("tally-api", {
        body: {
          action: "get-submissions",
          data: { formId },
        },
      });

      if (error) throw error;

      const allSubmissions: TallyApiSubmission[] = data.submissions || data.items || [];

      // Get the form name
      const form = mergedForms.find((f) => f.id === formId);
      const formName = form?.name || "Unknown Form";

      // Upsert each submission to the database
      let inserted = 0;
      for (const submission of allSubmissions) {
        if (!submission.id) continue; // Skip invalid submissions
        
        const { error: upsertError } = await supabase.from("tally_submissions").upsert(
          [{
            tally_submission_id: submission.id,
            form_id: formId,
            form_name: formName,
            submitted_at: submission.createdAt,
            fields: JSON.parse(JSON.stringify(submission.fields || [])),
          }],
          { onConflict: "tally_submission_id" }
        );

        if (!upsertError) inserted++;
      }

      return { total: allSubmissions.length, inserted };
    },
    onSuccess: (result, formId) => {
      const form = mergedForms.find((f) => f.id === formId);
      toast.success(`Synced ${result.total} submissions`, {
        description: `${form?.name || "Form"} is now up to date.`,
      });
      queryClient.invalidateQueries({ queryKey: ["tally-forms-db"] });
      queryClient.invalidateQueries({ queryKey: ["tally-db-submissions", formId] });
    },
    onError: (error: Error) => {
      toast.error("Sync failed", { description: error.message });
    },
  });

  const handleSync = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    syncMutation.mutate(formId);
  };

  const isLoading = dbLoading || apiLoading;

  if (selectedFormId) {
    return (
      <TallySubmissionsView
        formId={selectedFormId}
        formName={selectedFormName}
        onBack={handleBackToForms}
      />
    );
  }

  const totalDbSubmissions = dbForms?.reduce((sum, f) => sum + f.submission_count, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tally Forms</h2>
          <p className="text-muted-foreground">
            View and manage form submissions with real-time updates
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <Zap className="h-3 w-3 text-emerald-500" />
            Real-time
          </Badge>
          {mergedForms.some((f) => f.dbSubmissions < f.apiSubmissions) && (
            <Button
              variant="default"
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="w-full sm:w-auto"
            >
              {syncAllMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sync All
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Chart */}
      <TallyAnalyticsChart />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mergedForms.length}</p>
                <p className="text-sm text-muted-foreground">Total Forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Database className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDbSubmissions}</p>
                <p className="text-sm text-muted-foreground">Stored Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mergedForms.filter((f) => f.dbSubmissions > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Active Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            All Forms
            {mergedForms.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {mergedForms.length}
              </Badge>
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
          ) : filteredForms.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-center">
                      <span className="hidden md:inline">Stored / </span>Total
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Latest</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{form.name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {form.status === "PUBLISHED" ? "Published" : form.status}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={form.status === "PUBLISHED" ? "default" : "secondary"}
                            className={
                              form.status === "PUBLISHED"
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                : ""
                            }
                          >
                            {form.status === "PUBLISHED" ? "Published" : form.status}
                          </Badge>
                          {form.dbSubmissions > 0 && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Database className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Badge
                            variant={form.dbSubmissions > 0 ? "default" : "outline"}
                            className={form.dbSubmissions > 0 ? "bg-emerald-500/10 text-emerald-600" : ""}
                          >
                            {form.dbSubmissions}
                          </Badge>
                          <span className="text-muted-foreground hidden md:inline">/</span>
                          <span className="text-muted-foreground hidden md:inline text-sm">
                            {form.apiSubmissions}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {form.latestSubmission
                          ? format(new Date(form.latestSubmission), "MMM d, h:mm a")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {form.dbSubmissions < form.apiSubmissions && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleSync(form.id, e)}
                              disabled={syncMutation.isPending && syncMutation.variables === form.id}
                              className="text-primary"
                            >
                              {syncMutation.isPending && syncMutation.variables === form.id ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-1" />
                              )}
                              <span className="hidden sm:inline">Sync</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSubmissions(form.id, form.name)}
                          >
                            View
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              window.open(`https://tally.so/forms/${form.id}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No forms found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search query</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TallyFormsView;
