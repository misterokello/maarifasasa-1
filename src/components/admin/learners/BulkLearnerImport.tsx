import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, Users, Trash2, FolderPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TemplateColumn = {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
};

const COLUMNS: TemplateColumn[] = [
  { key: "email", label: "Email", required: true, hint: "Unique. Used as the login." },
  { key: "first_name", label: "First name", required: true },
  { key: "last_name", label: "Last name", required: true },
  { key: "phone", label: "Phone / WhatsApp", hint: "e.g. 256700000000" },
  { key: "country", label: "Country" },
  { key: "district", label: "District" },
  { key: "city", label: "City" },
  { key: "gender", label: "Gender", hint: "Female / Male / Non-binary / Prefer not to say" },
  { key: "age_range", label: "Age range", hint: "Under 18 / 18-24 / 25-34 / 35-44 / 45+" },
  { key: "employment_status", label: "Employment status", hint: "Student / Employed / Self-employed / Unemployed / Other" },
  { key: "occupation", label: "Occupation" },
  { key: "employer", label: "Employer" },
  { key: "highest_education", label: "Highest education", hint: "Certificate / Diploma / Degree ..." },
  { key: "current_skill_level", label: "Current skill level", hint: "Beginner / Intermediate / Advanced" },
  { key: "desired_career_path", label: "Desired career path" },
  { key: "career_interests", label: "Career interests", hint: "Separate several with a semicolon" },
  { key: "learning_goals", label: "Learning goals", hint: "Separate several with a semicolon" },
  { key: "preferred_schedule", label: "Preferred schedule", hint: "Weekdays / Weekends / Evenings / Flexible" },
  { key: "preferred_language", label: "Preferred language" },
  { key: "disability_status", label: "Disability status" },
  { key: "refugee_status", label: "Refugee status" },
  { key: "organization", label: "Organization / Sponsor" },
  { key: "scholarship_program", label: "Scholarship program" },
  { key: "referral_source", label: "How they heard about us" },
];

const EXAMPLE_ROW: Record<string, string> = {
  email: "jane.doe@example.com",
  first_name: "Jane",
  last_name: "Doe",
  phone: "256700123456",
  country: "Uganda",
  district: "Wakiso",
  city: "Kampala",
  gender: "Female",
  age_range: "18-24",
  employment_status: "Student",
  occupation: "Intern",
  employer: "",
  highest_education: "Certificate",
  current_skill_level: "Beginner",
  desired_career_path: "Digital marketing",
  career_interests: "Digital marketing; AI tools",
  learning_goals: "Get my first digital job",
  preferred_schedule: "Evenings",
  preferred_language: "English",
  disability_status: "No",
  refugee_status: "No",
  organization: "BRAC Uganda",
  scholarship_program: "Youth Skills 2026",
  referral_source: "Event",
};

type ParsedRow = {
  row: number;
  values: Record<string, string>;
  errors: string[];
};

type ImportResult = {
  row?: number | null;
  email: string;
  status: "created" | "updated" | "failed";
  detail?: string;
  invited?: boolean;
  thinkific_user_id?: number | null;
  group?: string | null;
};

type AcademyGroup = { id: number; name: string; users_count?: number | null };

const normaliseHeader = (value: string) =>
  value.toString().trim().toLowerCase().replace(/[\s/&-]+/g, "_").replace(/[^a-z0-9_]/g, "");

const HEADER_LOOKUP: Record<string, string> = COLUMNS.reduce((acc, col) => {
  acc[normaliseHeader(col.label)] = col.key;
  acc[col.key] = col.key;
  return acc;
}, {} as Record<string, string>);

const BulkLearnerImport: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [sendInvites, setSendInvites] = useState(true);
  const [provisionThinkific, setProvisionThinkific] = useState(true);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  // Group step (shown right after a template is uploaded).
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupMode, setGroupMode] = useState<"none" | "existing" | "new">("existing");
  const [groups, setGroups] = useState<AcademyGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [groupName, setGroupName] = useState<string | null>(null);

  const loadGroups = async () => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const { data, error } = await supabase.functions.invoke("thinkific-groups", { method: "GET" });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      setGroups(((data as any)?.groups ?? []) as AcademyGroup[]);
    } catch (e) {
      console.error(e);
      setGroupsError((e as Error).message || "Could not load the academy groups");
    } finally {
      setGroupsLoading(false);
    }
  };

  const confirmGroupChoice = () => {
    if (groupMode === "none") setGroupName(null);
    else if (groupMode === "existing") {
      if (!selectedGroup) {
        toast.error("Choose a group or pick another option");
        return;
      }
      setGroupName(selectedGroup);
    } else {
      const name = newGroupName.trim();
      if (name.length < 2) {
        toast.error("Give the new group a name");
        return;
      }
      setGroupName(name);
    }
    setGroupDialogOpen(false);
  };


  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalidRows = useMemo(() => rows.filter((r) => r.errors.length > 0), [rows]);

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();

    const sheet = XLSX.utils.aoa_to_sheet([
      COLUMNS.map((c) => c.label),
      COLUMNS.map((c) => EXAMPLE_ROW[c.key] ?? ""),
    ]);
    sheet["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(c.label.length + 4, 16) }));
    XLSX.utils.book_append_sheet(workbook, sheet, "Learners");

    const guide = XLSX.utils.aoa_to_sheet([
      ["Maarifasasa — bulk learner onboarding template"],
      [],
      ["1. Fill one learner per row on the 'Learners' sheet."],
      ["2. Delete the example row before uploading."],
      ["3. Email, First name and Last name are required. Everything else is optional."],
      ["4. For fields that accept several answers, separate them with a semicolon."],
      ["5. Save the file and upload it back on the Bulk onboarding tab (.xlsx or .csv)."],
      [],
      ["Column", "Required", "Notes"],
      ...COLUMNS.map((c) => [c.label, c.required ? "Yes" : "No", c.hint ?? ""]),
    ]);
    guide["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, guide, "How to use");

    XLSX.writeFile(workbook, "maarifasasa-learner-onboarding-template.xlsx");
    toast.success("Template downloaded");
  };

  const handleFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames.find((n) => n.toLowerCase().includes("learner")) || workbook.SheetNames[0];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });

      const seen = new Set<string>();
      const parsed: ParsedRow[] = [];

      raw.forEach((entry, index) => {
        const values: Record<string, string> = {};
        Object.entries(entry).forEach(([header, value]) => {
          const key = HEADER_LOOKUP[normaliseHeader(header)];
          if (key) values[key] = String(value ?? "").trim();
        });

        const hasAny = Object.values(values).some((v) => v !== "");
        if (!hasAny) return;

        const errors: string[] = [];
        const email = (values.email || "").toLowerCase();
        values.email = email;
        if (!email) errors.push("Email is missing");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email looks invalid");
        else if (seen.has(email)) errors.push("Duplicate email in this file");
        if (!values.first_name) errors.push("First name is missing");
        if (!values.last_name) errors.push("Last name is missing");
        if (email) seen.add(email);

        // Skip the untouched example row.
        if (email === EXAMPLE_ROW.email) return;

        parsed.push({ row: index + 2, values, errors });
      });

      if (parsed.length === 0) {
        toast.error("No learner rows found in that file");
        return;
      }

      setRows(parsed);
      setResults(null);
      setFileName(file.name);
      toast.success(`${parsed.length} row${parsed.length === 1 ? "" : "s"} loaded`);
      setGroupDialogOpen(true);
      loadGroups();
    } catch (e) {
      console.error(e);
      toast.error("Could not read that file. Use the downloaded template.");
    }
  };

  const clearFile = () => {
    setRows([]);
    setResults(null);
    setFileName(null);
    setGroupName(null);
    setSelectedGroup("");
    setNewGroupName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const runImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setResults(null);
    const collected: ImportResult[] = [];
    const batchSize = 25;

    try {
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        const { data, error } = await supabase.functions.invoke("admin-bulk-learners", {
          body: {
            learners: batch.map((r) => ({ row: r.row, ...r.values })),
            send_invites: sendInvites,
            provision_thinkific: provisionThinkific,
            group_name: groupName ?? undefined,
          },
        });
        if (error) throw new Error(error.message);
        if ((data as any)?.error) throw new Error((data as any).error);
        collected.push(...(((data as any)?.results ?? []) as ImportResult[]));
        setResults([...collected]);
      }

      const failed = collected.filter((r) => r.status === "failed").length;
      const created = collected.filter((r) => r.status === "created").length;
      if (failed === 0) toast.success(`${created} learner${created === 1 ? "" : "s"} onboarded`);
      else toast.warning(`${collected.length - failed} succeeded, ${failed} failed`);
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || "Bulk onboarding failed");
    } finally {
      setImporting(false);
    }
  };

  const exportResults = () => {
    if (!results?.length) return;
    const sheet = XLSX.utils.json_to_sheet(
      results.map((r) => ({
        Row: r.row ?? "",
        Email: r.email,
        Status: r.status,
        "Invite email sent": r.invited ? "Yes" : "No",
        "Academy account": r.thinkific_user_id ?? "",
        Group: r.group ?? "",
        Notes: r.detail ?? "",
      })),
    );
    sheet["!cols"] = [{ wch: 8 }, { wch: 32 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 24 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Results");
    XLSX.writeFile(wb, "bulk-learner-onboarding-results.xlsx");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bulk sign up &amp; onboard learners
          </CardTitle>
          <CardDescription>
            Download the template, fill in one learner per row, then upload it here. Accounts are created with their
            onboarding details, an academy account, and an email inviting them to set a password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Download template
            </Button>
            <Button onClick={() => fileRef.current?.click()} className="gap-2" disabled={importing}>
              <Upload className="h-4 w-4" />
              {fileName ? "Choose another file" : "Upload filled template"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate max-w-[220px]">{fileName}</span>
                <Button variant="ghost" size="icon" onClick={clearFile} disabled={importing}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div>
                <Label htmlFor="bulk-invites" className="font-medium">Email a password setup link</Label>
                <p className="text-xs text-muted-foreground mt-1">Each learner gets a branded welcome email.</p>
              </div>
              <Switch id="bulk-invites" checked={sendInvites} onCheckedChange={setSendInvites} disabled={importing} />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div>
                <Label htmlFor="bulk-thinkific" className="font-medium">Create academy accounts</Label>
                <p className="text-xs text-muted-foreground mt-1">Sets up their learning account right away.</p>
              </div>
              <Switch id="bulk-thinkific" checked={provisionThinkific} onCheckedChange={setProvisionThinkific} disabled={importing} />
            </div>
          </div>

          {rows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {groupName ? `Group: ${groupName}` : "No group selected"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {groupName
                      ? "Every learner in this upload joins this academy group."
                      : "Learners will be onboarded without joining an academy group."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={importing}
                onClick={() => { setGroupDialogOpen(true); if (groups.length === 0) loadGroups(); }}
              >
                {groupName ? "Change group" : "Choose group"}
              </Button>
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{rows.length} rows</Badge>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{validRows.length} ready</Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive">{invalidRows.length} need fixing</Badge>
                )}
              </div>

              {invalidRows.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Some rows will be skipped</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 space-y-1 text-sm">
                      {invalidRows.slice(0, 6).map((r) => (
                        <li key={r.row}>Row {r.row}: {r.errors.join(", ")}</li>
                      ))}
                      {invalidRows.length > 6 && <li>…and {invalidRows.length - 6} more</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg border overflow-x-auto max-h-[360px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Row</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 100).map((r) => (
                      <TableRow key={r.row}>
                        <TableCell className="text-muted-foreground">{r.row}</TableCell>
                        <TableCell className="font-medium">{r.values.email || "—"}</TableCell>
                        <TableCell>{[r.values.first_name, r.values.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                        <TableCell>{r.values.phone || "—"}</TableCell>
                        <TableCell>{[r.values.city, r.values.country].filter(Boolean).join(", ") || "—"}</TableCell>
                        <TableCell>
                          {r.errors.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                              <CheckCircle2 className="h-4 w-4" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive text-sm">
                              <XCircle className="h-4 w-4" /> {r.errors[0]}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 100 && (
                <p className="text-xs text-muted-foreground">Showing the first 100 rows — all {rows.length} will be processed.</p>
              )}

              <Button onClick={runImport} disabled={importing || validRows.length === 0} className="gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {importing ? "Onboarding…" : `Onboard ${validRows.length} learner${validRows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add these learners to a group?</DialogTitle>
            <DialogDescription>
              Groups keep each intake together in the academy. Pick an existing group, create a new one, or skip.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={groupMode} onValueChange={(v) => setGroupMode(v as typeof groupMode)} className="space-y-3">
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="existing" id="group-existing" />
                <Label htmlFor="group-existing" className="font-medium">Use an existing group</Label>
              </div>
              {groupMode === "existing" && (
                <div className="space-y-2">
                  {groupsLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading groups…
                    </p>
                  ) : groupsError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{groupsError}</p>
                      <Button variant="outline" size="sm" onClick={loadGroups}>Try again</Button>
                    </div>
                  ) : groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No groups yet — create one below.</p>
                  ) : (
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.name}>
                            {g.name}
                            {typeof g.users_count === "number" ? ` (${g.users_count})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="new" id="group-new" />
                <Label htmlFor="group-new" className="font-medium flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" /> Create a new group
                </Label>
              </div>
              {groupMode === "new" && (
                <Input
                  placeholder="e.g. BRAC Cohort — September 2026"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={120}
                />
              )}
            </div>

            <div className="rounded-lg border p-3 flex items-center gap-2">
              <RadioGroupItem value="none" id="group-none" />
              <Label htmlFor="group-none" className="font-medium">Skip — no group</Label>
            </div>
          </RadioGroup>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setGroupMode("none"); setGroupName(null); setGroupDialogOpen(false); }}>
              Skip
            </Button>
            <Button onClick={confirmGroupChoice}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {results && results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {results.filter((r) => r.status === "created").length} created ·{" "}
                {results.filter((r) => r.status === "updated").length} updated ·{" "}
                {results.filter((r) => r.status === "failed").length} failed ·{" "}
                {results.filter((r) => r.invited).length} invited
                {results.some((r) => r.group) ? ` · ${results.filter((r) => r.group).length} added to group` : ""}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportResults} className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Invite</TableHead>
                    <TableHead>Academy</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={`${r.email}-${i}`}>
                      <TableCell className="font-medium">{r.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "failed" ? "destructive" : "secondary"}
                          className={r.status === "created" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.invited ? "Sent" : "—"}</TableCell>
                      <TableCell>{r.thinkific_user_id ?? "—"}</TableCell>
                      <TableCell className="text-sm">{r.group ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{r.detail ?? ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkLearnerImport;
