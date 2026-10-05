import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { campaignRate, type EmailCampaign } from "@/lib/engagement/api";
import { format } from "date-fns";

interface Props {
  campaign: EmailCampaign | null;
  onClose: () => void;
}

type Recipient = {
  id: string; email: string; name: string | null; status: string;
  error_message: string | null; sent_at: string | null; delivered_at: string | null;
  opened_at: string | null; clicked_at: string | null; bounced_at: string | null;
  open_count: number; click_count: number;
};

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-700",
  delivered: "bg-emerald-500/15 text-emerald-700",
  opened: "bg-violet-500/15 text-violet-700",
  clicked: "bg-amber-500/15 text-amber-700",
  bounced: "bg-red-500/15 text-red-700",
  complained: "bg-red-500/15 text-red-700",
  failed: "bg-red-500/15 text-red-700",
};

const CampaignDetail: React.FC<Props> = ({ campaign, onClose }) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!campaign) return;
    setLoading(true);
    const { data } = await supabase.from("email_campaign_recipients")
      .select("id, email, name, status, error_message, sent_at, delivered_at, opened_at, clicked_at, bounced_at, open_count, click_count")
      .eq("campaign_id", campaign.id).order("created_at", { ascending: false }).limit(500);
    setRecipients((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaign?.id]);

  // Realtime
  useEffect(() => {
    if (!campaign) return;
    const ch = supabase.channel(`campaign:${campaign.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "email_campaign_recipients", filter: `campaign_id=eq.${campaign.id}` },
        (p) => {
          const row = (p.new ?? p.old) as Recipient;
          setRecipients((prev) => {
            const i = prev.findIndex((r) => r.id === row.id);
            if (i === -1) return [row, ...prev];
            const cp = [...prev]; cp[i] = { ...cp[i], ...row }; return cp;
          });
        }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campaign?.id]);

  const exportCsv = () => {
    if (!campaign) return;
    const rows = [["email","name","status","sent_at","delivered_at","opened_at","clicked_at","bounced_at","opens","clicks","error"]];
    recipients.forEach((r) => rows.push([
      r.email, r.name ?? "", r.status, r.sent_at ?? "", r.delivered_at ?? "",
      r.opened_at ?? "", r.clicked_at ?? "", r.bounced_at ?? "",
      String(r.open_count), String(r.click_count), r.error_message ?? "",
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${campaign.name.replace(/\s+/g,"_")}_recipients.csv`;
    a.click();
  };

  return (
    <Dialog open={!!campaign} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{campaign?.name}</DialogTitle></DialogHeader>
        {campaign && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {[
                ["Recipients", campaign.recipient_count],
                ["Sent", campaign.sent_count],
                ["Delivered", campaign.delivered_count],
                ["Opened", campaign.opened_count],
                ["Clicked", campaign.clicked_count],
                ["Bounced", campaign.bounced_count],
              ].map(([l, v]) => (
                <Card key={l as string}><CardContent className="p-3">
                  <div className="text-[10px] text-muted-foreground uppercase">{l}</div>
                  <div className="text-lg font-semibold">{Number(v).toLocaleString()}</div>
                </CardContent></Card>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Open rate: </span><span className="font-semibold">{campaignRate(campaign.opened_count, campaign.delivered_count || campaign.sent_count)}</span></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Click rate: </span><span className="font-semibold">{campaignRate(campaign.clicked_count, campaign.delivered_count || campaign.sent_count)}</span></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Bounce rate: </span><span className="font-semibold">{campaignRate(campaign.bounced_count, campaign.sent_count)}</span></div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Recipients ({recipients.length})</h3>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</Button>
                <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
              </div>
            </div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <div className="rounded border max-h-96 overflow-auto text-sm">
                <table className="w-full">
                  <thead className="bg-muted/50 text-xs sticky top-0">
                    <tr>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Opens</th>
                      <th className="text-left p-2">Clicks</th>
                      <th className="text-left p-2">Sent</th>
                      <th className="text-left p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2"><div className="font-medium truncate max-w-[180px]">{r.email}</div>{r.name && <div className="text-xs text-muted-foreground truncate max-w-[180px]">{r.name}</div>}</td>
                        <td className="p-2"><Badge className={`${STATUS_COLORS[r.status] || ""} text-[10px]`} variant="secondary">{r.status}</Badge></td>
                        <td className="p-2 text-xs">{r.open_count}</td>
                        <td className="p-2 text-xs">{r.click_count}</td>
                        <td className="p-2 text-xs text-muted-foreground">{r.sent_at ? format(new Date(r.sent_at), "MMM d HH:mm") : "—"}</td>
                        <td className="p-2 text-xs text-destructive truncate max-w-[200px]">{r.error_message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetail;