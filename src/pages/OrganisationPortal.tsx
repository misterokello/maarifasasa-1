import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface PartnerGroup {
  id: string;
  organization_name: string;
  thinkific_group_name: string;
  thinkific_group_id: number | null;
  contact_email: string | null;
  active: boolean;
  created_at: string;
}

interface RosterRow {
  email: string;
  full_name: string | null;
  user_id: string | null;
  joined_at: string | null;
  has_account: boolean;
  account_confirmed: boolean;
  last_invited_at: string | null;
  invite_count: number;
  thinkific_user_id: number | null;
  courses_enrolled: number;
  courses_completed: number;
  avg_progress: number;
  last_activity: string | null;
}

interface PartnerProfile {
  full_name: string;
  organisation_name: string;
  role_title: string;
  contact_email: string;
  contact_phone: string;
  website: string;
}

const emptyProfile: PartnerProfile = {
  full_name: "",
  organisation_name: "",
  role_title: "",
  contact_email: "",
  contact_phone: "",
  website: "",
};

const fmtDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";

type Status = { label: string; variant: "default" | "secondary" | "outline" | "destructive" };

const enrolmentStatus = (row: RosterRow): Status => {
  if (row.courses_completed > 0 && row.courses_completed >= row.courses_enrolled) {
    return { label: "Completed", variant: "default" };
  }
  if (Number(row.avg_progress) > 0) return { label: "Learning", variant: "secondary" };
  if (row.courses_enrolled > 0) return { label: "Enrolled", variant: "outline" };
  if (row.account_confirmed) return { label: "Signed up", variant: "outline" };
  if (row.last_invited_at) return { label: "Invite sent", variant: "outline" };
  return { label: "Not started", variant: "destructive" };
};

const OrganisationPortal = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<PartnerGroup[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState<PartnerProfile>(emptyProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const selected = useMemo(() => groups.find((g) => g.id === groupId) ?? null, [groups, groupId]);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    const { data, error } = await (supabase as any)
      .from("partner_groups")
      .select(
        "id, organization_name, thinkific_group_name, thinkific_group_id, contact_email, active, created_at",
      )
      .order("organization_name");
    if (error) {
      toast.error("Could not load your organisation groups");
    } else {
      const list = (data ?? []) as PartnerGroup[];
      setGroups(list);
      setGroupId((current) => current || list[0]?.id || "");
    }
    setLoadingGroups(false);
  }, []);

  const loadRoster = useCallback(async (groupName: string) => {
    setLoadingRoster(true);
    const { data, error } = await (supabase as any).rpc("partner_group_roster", {
      _group_name: groupName,
    });
    if (error) {
      toast.error(error.message || "Could not load learners for this group");
      setRoster([]);
    } else {
      setRoster((data ?? []) as RosterRow[]);
    }
    setSelectedEmails([]);
    setLoadingRoster(false);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    const { data } = await (supabase as any)
      .from("partner_profiles")
      .select("full_name, organisation_name, role_title, contact_email, contact_phone, website")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setProfile({
        full_name: data.full_name ?? "",
        organisation_name: data.organisation_name ?? "",
        role_title: data.role_title ?? "",
        contact_email: data.contact_email ?? user.email ?? "",
        contact_phone: data.contact_phone ?? "",
        website: data.website ?? "",
      });
    } else {
      setProfile({ ...emptyProfile, contact_email: user.email ?? "" });
    }
    setLoadingProfile(false);
  }, [user]);

  useEffect(() => {
    loadGroups();
    loadProfile();
  }, [loadGroups, loadProfile]);

  useEffect(() => {
    if (selected?.thinkific_group_name) loadRoster(selected.thinkific_group_name);
  }, [selected?.thinkific_group_name, loadRoster]);

  const saveProfile = async () => {
    if (!user) return;
    if (!profile.full_name.trim() || !profile.organisation_name.trim()) {
      toast.error("Please add your name and organisation");
      return;
    }
    setSavingProfile(true);
    const { error } = await (supabase as any).from("partner_profiles").upsert(
      {
        user_id: user.id,
        full_name: profile.full_name.trim(),
        organisation_name: profile.organisation_name.trim(),
        role_title: profile.role_title.trim() || null,
        contact_email: profile.contact_email.trim() || null,
        contact_phone: profile.contact_phone.trim() || null,
        website: profile.website.trim() || null,
      },
      { onConflict: "user_id" },
    );
    setSavingProfile(false);
    if (error) toast.error(error.message || "Could not save your profile");
    else toast.success("Profile saved");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (l) => (l.full_name || "").toLowerCase().includes(q) || l.email.toLowerCase().includes(q),
    );
  }, [roster, search]);

  const pendingEmails = useMemo(
    () => roster.filter((l) => !l.account_confirmed).map((l) => l.email),
    [roster],
  );

  const stats = useMemo(() => {
    const total = roster.length;
    const active = roster.filter((l) => l.courses_enrolled > 0).length;
    const completions = roster.reduce((sum, l) => sum + (l.courses_completed || 0), 0);
    const avg = total
      ? Math.round(roster.reduce((sum, l) => sum + Number(l.avg_progress || 0), 0) / total)
      : 0;
    return { total, active, completions, avg, pending: pendingEmails.length };
  }, [roster, pendingEmails]);

  const resendInvites = async (emails: string[]) => {
    if (!selected || emails.length === 0) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("partner-resend-invite", {
      body: { group_name: selected.thinkific_group_name, emails },
    });
    setSending(false);
    if (error) {
      toast.error("Could not send the invites. Please try again.");
      return;
    }
    const sent = (data as any)?.sent ?? 0;
    const failed = (data as any)?.failed ?? 0;
    if (sent > 0) toast.success(`${sent} invite${sent === 1 ? "" : "s"} sent`);
    if (failed > 0) toast.error(`${failed} invite${failed === 1 ? "" : "s"} could not be sent`);
    loadRoster(selected.thinkific_group_name);
  };

  const toggleEmail = (email: string, checked: boolean) =>
    setSelectedEmails((prev) => (checked ? [...prev, email] : prev.filter((e) => e !== email)));

  const exportCsv = () => {
    const rows = [
      [
        "Name",
        "Email",
        "Added",
        "Account",
        "Status",
        "Courses",
        "Completed",
        "Average progress %",
        "Invites sent",
        "Last invite",
        "Last activity",
      ],
      ...filtered.map((l) => [
        l.full_name || "",
        l.email,
        l.joined_at ? new Date(l.joined_at).toISOString().slice(0, 10) : "",
        l.account_confirmed ? "Active" : l.has_account ? "Invited" : "No account",
        enrolmentStatus(l).label,
        String(l.courses_enrolled ?? 0),
        String(l.courses_completed ?? 0),
        String(l.avg_progress ?? 0),
        String(l.invite_count ?? 0),
        l.last_invited_at ? new Date(l.last_invited_at).toISOString().slice(0, 10) : "",
        l.last_activity ? new Date(l.last_activity).toISOString().slice(0, 10) : "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected?.organization_name || "learners"}-progress.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>Partner Dashboard | Maarifasasa Academy</title>
        <meta
          name="description"
          content="Track your organisation's sponsored learners, their groups, enrolment status and completion progress in the Maarifasasa Academy."
        />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-muted/30 pt-28 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Button variant="ghost" size="sm" className="mb-2 px-0" asChild>
                <Link to="/academy">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to the academy
                </Link>
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                Partner dashboard
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {profile.organisation_name
                  ? `${profile.organisation_name} — follow your groups, learners and their progress.`
                  : "Follow your learner groups, who has started learning and who still needs a nudge."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {groups.length > 1 && (
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.organization_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                onClick={() => selected && loadRoster(selected.thinkific_group_name)}
                disabled={!selected || loadingRoster}
              >
                {loadingRoster ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="learners" className="space-y-6">
            <TabsList>
              <TabsTrigger value="learners">Groups &amp; learners</TabsTrigger>
              <TabsTrigger value="profile">My profile</TabsTrigger>
            </TabsList>

            <TabsContent value="learners" className="space-y-6">
              {loadingGroups ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : groups.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No group linked yet</CardTitle>
                    <CardDescription>
                      Your account ({user?.email}) is not linked to an organisation group yet. Our team
                      links your group as soon as your learners are onboarded — reach out and we will
                      set it up.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <Link to="/contact">Contact the team</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      { label: "Learners", value: stats.total, icon: Users },
                      { label: "Started learning", value: stats.active, icon: GraduationCap },
                      { label: "Course completions", value: stats.completions, icon: CheckCircle2 },
                      { label: "Average progress", value: `${stats.avg}%`, icon: GraduationCap },
                      { label: "Awaiting sign-in", value: stats.pending, icon: Clock },
                    ].map((s) => (
                      <Card key={s.label}>
                        <CardHeader className="pb-2">
                          <CardDescription className="flex items-center gap-2">
                            <s.icon className="h-4 w-4 text-primary" /> {s.label}
                          </CardDescription>
                          <CardTitle className="text-3xl">{s.value}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {selected?.organization_name}
                          {selected && !selected.active && <Badge variant="secondary">Paused</Badge>}
                        </CardTitle>
                        <CardDescription>
                          Academy group “{selected?.thinkific_group_name}” · linked{" "}
                          {fmtDate(selected?.created_at ?? null)}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          placeholder="Search learners…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="sm:max-w-[220px]"
                        />
                        <Button
                          variant="outline"
                          disabled={sending || pendingEmails.length === 0}
                          onClick={() => resendInvites(pendingEmails)}
                        >
                          {sending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="mr-2 h-4 w-4" />
                          )}
                          Remind all pending ({pendingEmails.length})
                        </Button>
                        <Button
                          disabled={sending || selectedEmails.length === 0}
                          onClick={() => resendInvites(selectedEmails)}
                        >
                          <Mail className="mr-2 h-4 w-4" /> Resend selected ({selectedEmails.length})
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingRoster ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : filtered.length === 0 ? (
                        <p className="py-12 text-center text-muted-foreground">
                          No learners in this group yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10">
                                  <Checkbox
                                    checked={
                                      selectedEmails.length > 0 &&
                                      selectedEmails.length === filtered.length
                                    }
                                    onCheckedChange={(checked) =>
                                      setSelectedEmails(checked ? filtered.map((l) => l.email) : [])
                                    }
                                    aria-label="Select all learners"
                                  />
                                </TableHead>
                                <TableHead>Learner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Courses</TableHead>
                                <TableHead className="text-center">Completed</TableHead>
                                <TableHead className="min-w-[160px]">Progress</TableHead>
                                <TableHead>Invite</TableHead>
                                <TableHead>Last activity</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map((l) => {
                                const status = enrolmentStatus(l);
                                return (
                                  <TableRow key={l.email}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedEmails.includes(l.email)}
                                        onCheckedChange={(checked) =>
                                          toggleEmail(l.email, Boolean(checked))
                                        }
                                        aria-label={`Select ${l.email}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">{l.full_name || "—"}</div>
                                      <div className="text-xs text-muted-foreground">{l.email}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Added {fmtDate(l.joined_at)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={status.variant}>{status.label}</Badge>
                                      {!l.account_confirmed && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Password not set
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {l.courses_enrolled ?? 0}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {(l.courses_completed ?? 0) > 0 ? (
                                        <Badge variant="secondary">{l.courses_completed}</Badge>
                                      ) : (
                                        "0"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Progress
                                          value={Number(l.avg_progress || 0)}
                                          className="h-2"
                                        />
                                        <span className="text-xs text-muted-foreground w-10 text-right">
                                          {Math.round(Number(l.avg_progress || 0))}%
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {l.invite_count > 0
                                        ? `${l.invite_count} sent · ${fmtDate(l.last_invited_at)}`
                                        : "—"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {fmtDate(l.last_activity)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={sending}
                                        onClick={() => resendInvites([l.email])}
                                      >
                                        <Mail className="mr-2 h-4 w-4" /> Resend
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="profile">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>My partner profile</CardTitle>
                  <CardDescription>
                    Your details appear on reports and help our team reach the right person at your
                    organisation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProfile ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pp-name">Full name *</Label>
                        <Input
                          id="pp-name"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          placeholder="Jane Achieng"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pp-org">Organisation *</Label>
                        <Input
                          id="pp-org"
                          value={profile.organisation_name}
                          onChange={(e) =>
                            setProfile({ ...profile, organisation_name: e.target.value })
                          }
                          placeholder="BRAC Uganda"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pp-role">Job title</Label>
                        <Input
                          id="pp-role"
                          value={profile.role_title}
                          onChange={(e) => setProfile({ ...profile, role_title: e.target.value })}
                          placeholder="Programme Manager"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pp-email">Contact email</Label>
                        <Input
                          id="pp-email"
                          type="email"
                          value={profile.contact_email}
                          onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pp-phone">Phone / WhatsApp</Label>
                        <Input
                          id="pp-phone"
                          value={profile.contact_phone}
                          onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                          placeholder="+256 700 000 000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pp-web">Website</Label>
                        <Input
                          id="pp-web"
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={saveProfile} disabled={savingProfile || loadingProfile}>
                    {savingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save profile
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default OrganisationPortal;
