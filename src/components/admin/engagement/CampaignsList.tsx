import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Search, Send, Eye, Copy, Trash2 } from "lucide-react";
import { listCampaigns, listAudiences, campaignRate, sendCampaign, type EmailCampaign, type EmailAudience } from "@/lib/engagement/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import CampaignWizard from "./CampaignWizard";
import CampaignDetail from "./CampaignDetail";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/15 text-blue-700",
  sending: "bg-amber-500/15 text-amber-700",
  sent: "bg-emerald-500/15 text-emerald-700",
  failed: "bg-red-500/15 text-red-700",
  paused: "bg-orange-500/15 text-orange-700",
  cancelled: "bg-muted text-muted-foreground",
};

const CampaignsList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [audiences, setAudiences] = useState<EmailAudience[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<EmailCampaign | null>(null);
  const [detail, setDetail] = useState<EmailCampaign | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [c, a] = await Promise.all([listCampaigns(), listAudiences()]);
    setCampaigns((c.data as any) || []);
    setAudiences((a.data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const audienceName = (id: string | null) => audiences.find((a) => a.id === id)?.name ?? "—";

  const filtered = campaigns.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.subject.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const duplicate = async (c: EmailCampaign) => {
    const { error } = await supabase.from("email_campaigns").insert({
      name: `${c.name} (copy)`, template_id: c.template_id, audience_id: c.audience_id,
      subject: c.subject, preheader: c.preheader, body_html: c.body_html, body_text: c.body_text,
      from_name: c.from_name, reply_to: c.reply_to, status: "draft",
    });
    if (error) toast.error(error.message); else { toast.success("Duplicated"); load(); }
  };

  const del = async (c: EmailCampaign) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    const { error } = await supabase.from("email_campaigns").delete().eq("id", c.id);
    if (error) toast.error(error.message); else load();
  };

  const sendDraft = async (c: EmailCampaign) => {
    if (!c.audience_id) { toast.error("Add an audience first"); return; }
    const aud = audiences.find((a) => a.id === c.audience_id);
    if (!confirm(`Send "${c.name}" to ${aud?.member_count ?? 0} recipients now?`)) return;
    try {
      const r = await sendCampaign(c.id);
      toast.success(`Sent ${r.sent} / ${r.total}`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Create, send and track your learner email campaigns.</p>
        </div>
        <Button onClick={() => { setEditing(null); setWizardOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New campaign
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["draft","scheduled","sending","sent","failed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No campaigns yet.</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Audience</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Recipients</th>
                  <th className="text-left p-3">Open %</th>
                  <th className="text-left p-3">Click %</th>
                  <th className="text-left p-3">Bounce %</th>
                  <th className="text-left p-3">Sent</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/20">
                    <td className="p-3"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground truncate max-w-[260px]">{c.subject}</div></td>
                    <td className="p-3 text-xs">{audienceName(c.audience_id)}</td>
                    <td className="p-3"><Badge className={`${STATUS_BADGE[c.status]} text-[10px] capitalize`} variant="secondary">{c.status}</Badge></td>
                    <td className="p-3">{c.recipient_count.toLocaleString()}</td>
                    <td className="p-3">{campaignRate(c.opened_count, c.delivered_count || c.sent_count)}</td>
                    <td className="p-3">{campaignRate(c.clicked_count, c.delivered_count || c.sent_count)}</td>
                    <td className="p-3">{campaignRate(c.bounced_count, c.sent_count)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{c.sent_at ? format(new Date(c.sent_at), "MMM d, yyyy") : "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetail(c)} title="View"><Eye className="h-3.5 w-3.5" /></Button>
                        {c.status === "draft" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setWizardOpen(true); }} title="Edit">Edit</Button>
                            <Button size="sm" variant="ghost" onClick={() => sendDraft(c)} title="Send"><Send className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => duplicate(c)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => del(c)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      <CampaignWizard open={wizardOpen} onOpenChange={setWizardOpen} onSaved={load} initial={editing} />
      <CampaignDetail campaign={detail} onClose={() => setDetail(null)} />
    </div>
  );
};

export default CampaignsList;