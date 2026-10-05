import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Role =
  | "admin"
  | "blog_admin"
  | "hr_admin"
  | "engagement_admin"
  | "products_admin"
  | "popups_admin"
  | "advisor_admin"
  | "affiliate_admin"
  | "payments_admin"
  | "learner_admin"
  | "discount_admin"
  | "user";

const ROLES: { key: Role; label: string; description: string }[] = [
  { key: "admin", label: "Super Admin", description: "Full access to everything" },
  { key: "blog_admin", label: "Blog", description: "Manage blog posts & comments" },
  { key: "hr_admin", label: "Hiring", description: "Recruitment, applicants & offers" },
  { key: "engagement_admin", label: "Engagement", description: "Email campaigns & audiences" },
  { key: "products_admin", label: "Products", description: "Courses, bootcamps & certificates" },
  { key: "popups_admin", label: "Popups", description: "Site popups & announcements" },
  { key: "advisor_admin", label: "AI Advisor", description: "Advisor analytics & mentors" },
  { key: "affiliate_admin", label: "Affiliates", description: "Affiliate partners & payouts" },
  { key: "payments_admin", label: "Payments", description: "Payment records & refunds" },
  { key: "learner_admin", label: "Learners", description: "Learner records & onboarding data" },
  { key: "discount_admin", label: "Discounts", description: "Discount codes, partners & leaderboard" },
];

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

const SystemAccessManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, Set<Role>>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p, error: pe }, { data: r, error: re }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pe) toast.error(`Profiles: ${pe.message}`);
    if (re) toast.error(`Roles: ${re.message}`);
    const map: Record<string, Set<Role>> = {};
    (r || []).forEach((row: any) => {
      const set = map[row.user_id] ?? new Set<Role>();
      set.add(row.role as Role);
      map[row.user_id] = set;
    });
    setProfiles((p as Profile[]) || []);
    setRolesByUser(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(q) ||
        (p.full_name || "").toLowerCase().includes(q),
    );
  }, [profiles, query]);

  const toggleRole = async (userId: string, role: Role, checked: boolean) => {
    const key = `${userId}:${role}`;
    setSaving(key);
    // Optimistic update
    setRolesByUser((prev) => {
      const next = { ...prev };
      const set = new Set(next[userId] ?? []);
      if (checked) set.add(role);
      else set.delete(role);
      next[userId] = set;
      return next;
    });
    try {
      if (checked) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as any });
        if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role as any);
        if (error) throw error;
      }
      toast.success(`${checked ? "Granted" : "Revoked"} ${role.replace(/_/g, " ")}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
      // Revert
      setRolesByUser((prev) => {
        const next = { ...prev };
        const set = new Set(next[userId] ?? []);
        if (checked) set.delete(role);
        else set.add(role);
        next[userId] = set;
        return next;
      });
    } finally {
      setSaving(null);
    }
  };

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    ROLES.forEach((r) => (t[r.key] = 0));
    Object.values(rolesByUser).forEach((set) => set.forEach((r) => (t[r] = (t[r] || 0) + 1)));
    return t;
  }, [rolesByUser]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                System Access Control
              </CardTitle>
              <CardDescription>
                Grant or revoke module access for any user. Super Admins can do everything;
                other roles limit access to specific dashboards.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
            {ROLES.map((r) => (
              <div
                key={r.key}
                className="rounded-md border bg-muted/30 px-3 py-2 flex items-center justify-between"
                title={r.description}
              >
                <span className="text-xs font-medium">{r.label}</span>
                <Badge variant="secondary">{totals[r.key] || 0}</Badge>
              </div>
            ))}
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[220px]">User</TableHead>
                    {ROLES.map((r) => (
                      <TableHead key={r.key} className="text-center whitespace-nowrap">
                        <div className="text-xs font-semibold">{r.label}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={ROLES.length + 1} className="text-center text-muted-foreground py-8">
                        No users match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => {
                      const set = rolesByUser[p.id] ?? new Set<Role>();
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="sticky left-0 bg-background z-10">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{p.full_name || "—"}</span>
                              <span className="text-xs text-muted-foreground">{p.email}</span>
                            </div>
                          </TableCell>
                          {ROLES.map((r) => {
                            const key = `${p.id}:${r.key}`;
                            const checked = set.has(r.key);
                            return (
                              <TableCell key={r.key} className="text-center">
                                {saving === key ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                                ) : (
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) => toggleRole(p.id, r.key, !!v)}
                                    aria-label={`${r.label} for ${p.email}`}
                                  />
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {profiles.length} users (most recent 500). Search to find older accounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAccessManager;