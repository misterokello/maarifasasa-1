import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, RefreshCw, Search, Share2, Pencil, Power, Mail, BellRing } from "lucide-react";
import { toast } from "sonner";
import { DiscountCodeRow, fetchDiscountCodes, sendPartnerInvites } from "@/lib/discountAdmin";
import { DiscountCodeForm } from "./DiscountCodeForm";
import { DiscountShareDialog } from "./DiscountShareDialog";

export function DiscountCodesList() {
  const [rows, setRows] = useState<DiscountCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountCodeRow | null>(null);
  const [sharing, setSharing] = useState<DiscountCodeRow | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchDiscountCodes());
    } catch (e) {
      toast.error((e as Error).message || "Failed to load discount codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        (r.label || "").toLowerCase().includes(q) ||
        (r.owner_name || "").toLowerCase().includes(q) ||
        (r.owner_email || "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const toggleActive = async (row: DiscountCodeRow) => {
    const { error } = await supabase
      .from("discount_codes")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(row.is_active ? "Code deactivated" : "Code activated");
    load();
  };

  const invite = async (row: DiscountCodeRow) => {
    if (!row.owner_email) return toast.error("Add a referrer email to this code first");
    setInviting(row.id);
    try {
      const res = await sendPartnerInvites("invite", [row.id]);
      if (res.sent > 0) toast.success(`Portal login email sent to ${row.owner_email}`);
      else toast.error(res.results?.[0]?.detail || "Could not send the invite");
      load();
    } catch (e) {
      toast.error((e as Error).message || "Could not send the invite");
    } finally {
      setInviting(null);
    }
  };

  const remindAll = async () => {
    setReminding(true);
    try {
      const res = await sendPartnerInvites("remind");
      if (res.sent > 0) {
        toast.success(`Reminder sent to ${res.sent} partner${res.sent === 1 ? "" : "s"}`);
      } else {
        toast.info("Every partner has already set up their portal login");
      }
      if (res.failed > 0) toast.error(`${res.failed} reminder(s) could not be sent`);
      load();
    } catch (e) {
      toast.error((e as Error).message || "Could not send reminders");
    } finally {
      setReminding(false);
    }
  };

  const pendingLogins = rows.filter((r) => r.owner_email && !r.portal_activated_at).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Discount codes</CardTitle>
          {pendingLogins > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {pendingLogins} partner{pendingLogins === 1 ? "" : "s"} haven't set up their portal login yet
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 w-56"
              placeholder="Search codes or referrers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={remindAll}
            disabled={reminding || pendingLogins === 0}
            title="Email every partner who hasn't set up their portal login"
          >
            {reminding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BellRing className="h-4 w-4 mr-2" />
            )}
            Remind partners
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No discount codes yet. Create one to start tracking referrals.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead className="text-right">Off</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-medium">{r.code}</TableCell>
                    <TableCell>
                      <div className="text-sm">{r.owner_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.owner_email || r.label || ""}</div>
                    </TableCell>
                    <TableCell className="text-right">{r.percent_off}%</TableCell>
                    <TableCell className="text-right">{r.clicks}</TableCell>
                    <TableCell className="text-right">{r.signups_count}</TableCell>
                    <TableCell className="text-right">{r.redemptions_count}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.applies_to_all_products ? "All courses" : "Selected"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!r.owner_email ? (
                        <span className="text-xs text-muted-foreground">No email</span>
                      ) : r.portal_activated_at ? (
                        <Badge variant="default">Login active</Badge>
                      ) : r.portal_invited_at || r.portal_reminded_at ? (
                        <Badge variant="outline">Invite sent</Badge>
                      ) : (
                        <Badge variant="secondary">Not invited</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={r.portal_invited_at ? "Resend portal login email" : "Send portal login email"}
                        disabled={inviting === r.id || !r.owner_email}
                        onClick={() => invite(r)}
                      >
                        {inviting === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" title="Share" onClick={() => setSharing(r)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => {
                          setEditing(r);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={r.is_active ? "Deactivate" : "Activate"}
                        onClick={() => toggleActive(r)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.code}` : "New discount code"}</DialogTitle>
          </DialogHeader>
          <DiscountCodeForm
            editing={editing}
            onCancel={() => setFormOpen(false)}
            onDone={() => {
              setFormOpen(false);
              load();
            }}
          />
        </DialogContent>
      </Dialog>

      {sharing && (
        <DiscountShareDialog
          open={!!sharing}
          onOpenChange={(v) => !v && setSharing(null)}
          code={sharing.code}
          label={sharing.label}
        />
      )}
    </Card>
  );
}