import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
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

interface PartnerGroupRow {
  id: string;
  partner_user_id: string;
  organization_name: string;
  thinkific_group_name: string;
  thinkific_group_id: number | null;
  contact_email: string | null;
  active: boolean;
  created_at: string;
}

interface ThinkificGroup {
  id: number;
  name: string;
  users_count: number | null;
}

const PartnerAccessManager = () => {
  const [rows, setRows] = useState<PartnerGroupRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<ThinkificGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [groupName, setGroupName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, members] = await Promise.all([
      (supabase as any)
        .from("partner_groups")
        .select(
          "id, partner_user_id, organization_name, thinkific_group_name, thinkific_group_id, contact_email, active, created_at",
        )
        .order("created_at", { ascending: false }),
      (supabase as any).from("partner_group_members").select("thinkific_group_name"),
    ]);
    if (error) toast.error("Could not load partner access list");
    setRows((data ?? []) as PartnerGroupRow[]);
    const tally: Record<string, number> = {};
    for (const m of (members?.data ?? []) as { thinkific_group_name: string }[]) {
      const key = (m.thinkific_group_name || "").toLowerCase();
      tally[key] = (tally[key] || 0) + 1;
    }
    setCounts(tally);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadThinkificGroups = async () => {
    setLoadingGroups(true);
    const { data, error } = await supabase.functions.invoke("thinkific-groups", { method: "GET" });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || "Could not load academy groups");
    } else {
      setGroups(((data as any)?.groups ?? []) as ThinkificGroup[]);
    }
    setLoadingGroups(false);
  };

  const selectedGroup = useMemo(
    () => groups.find((g) => g.name.toLowerCase() === groupName.trim().toLowerCase()) ?? null,
    [groups, groupName],
  );

  const grantAccess = async () => {
    const email = partnerEmail.trim().toLowerCase();
    if (!orgName.trim() || !email || !groupName.trim()) {
      toast.error("Organisation name, partner email and academy group are all required");
      return;
    }
    setSaving(true);
    try {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", email)
        .maybeSingle();
      if (profileErr) throw new Error(profileErr.message);
      if (!profile?.id) {
        throw new Error("No account found for that email — ask the partner to sign up first");
      }

      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: profile.id, role: "partner_admin" as any }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(`Could not grant partner access: ${roleErr.message}`);

      const { error: insertErr } = await (supabase as any).from("partner_groups").insert({
        partner_user_id: profile.id,
        organization_name: orgName.trim(),
        thinkific_group_name: groupName.trim(),
        thinkific_group_id: selectedGroup?.id ?? null,
        contact_email: email,
      });
      if (insertErr) throw new Error(insertErr.message);

      toast.success(`${orgName.trim()} can now view their learners in the organisation portal`);
      setOrgName("");
      setPartnerEmail("");
      setGroupName("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: PartnerGroupRow) => {
    const { error } = await (supabase as any)
      .from("partner_groups")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r)));
    }
  };

  const remove = async (row: PartnerGroupRow) => {
    if (!window.confirm(`Remove ${row.organization_name}'s access to this group?`)) return;
    const { error } = await (supabase as any).from("partner_groups").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Access removed");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Give a partner access to their group
          </CardTitle>
          <CardDescription>
            The partner signs up as a normal user, then you link their account to an academy group.
            They will only ever see learners inside that group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Organisation name</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. BRAC Uganda"
              />
            </div>
            <div className="space-y-2">
              <Label>Partner account email</Label>
              <Input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@organisation.org"
              />
            </div>
            <div className="space-y-2">
              <Label>Academy group</Label>
              <div className="flex gap-2">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={loadThinkificGroups}
                  disabled={loadingGroups}
                  title="Load academy groups"
                >
                  {loadingGroups ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {groups.length > 0 && (
                <Select value={groupName} onValueChange={setGroupName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick an existing group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.name}>
                        {g.name}
                        {g.users_count != null ? ` (${g.users_count})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <Button onClick={grantAccess} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Grant portal access
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Partner portals</CardTitle>
            <CardDescription>Organisations with access to their own learner view.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              No partner portals yet. Link an organisation above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Academy group</TableHead>
                    <TableHead>Partner contact</TableHead>
                    <TableHead className="text-center">Learners</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.organization_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.thinkific_group_name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.contact_email || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {counts[r.thinkific_group_name.toLowerCase()] || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove(r)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerAccessManager;
