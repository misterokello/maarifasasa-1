import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Send, Save, FlaskConical, Loader2, Users, Mail, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listTemplates, listAudiences, sendCampaign, type EmailTemplate, type EmailAudience } from "@/lib/engagement/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  initial?: any;
}

const STEPS = [
  { id: 1, label: "Basics", icon: FileText },
  { id: 2, label: "Audience", icon: Users },
  { id: 3, label: "Template", icon: Sparkles },
  { id: 4, label: "Content", icon: Mail },
  { id: 5, label: "Review", icon: Send },
];

const CampaignWizard: React.FC<Props> = ({ open, onOpenChange, onSaved, initial }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [fromName, setFromName] = useState("Maarifasasa");
  const [replyTo, setReplyTo] = useState("");
  const [audienceId, setAudienceId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [audiences, setAudiences] = useState<EmailAudience[]>([]);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (!open) return;
    listTemplates().then(({ data }) => setTemplates((data as any) || []));
    listAudiences().then(({ data }) => setAudiences((data as any) || []));
    if (initial) {
      setStep(1);
      setName(initial.name ?? "");
      setFromName(initial.from_name ?? "Maarifasasa");
      setReplyTo(initial.reply_to ?? "");
      setAudienceId(initial.audience_id ?? "");
      setTemplateId(initial.template_id ?? "");
      setSubject(initial.subject ?? "");
      setPreheader(initial.preheader ?? "");
      setBodyHtml(initial.body_html ?? "");
      setBodyText(initial.body_text ?? "");
    } else {
      setStep(1); setName(""); setFromName("Maarifasasa"); setReplyTo("");
      setAudienceId(""); setTemplateId(""); setSubject(""); setPreheader("");
      setBodyHtml(""); setBodyText("");
    }
  }, [open, initial]);

  const selectedAudience = useMemo(() => audiences.find((a) => a.id === audienceId), [audiences, audienceId]);
  const selectedTemplate = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId]);

  const applyTemplate = (t: EmailTemplate) => {
    setTemplateId(t.id);
    setSubject(t.subject);
    setPreheader(t.preheader ?? "");
    setBodyHtml(t.body_html);
    setBodyText(t.body_text ?? "");
  };

  const persist = async (status: "draft" | "sending") => {
    if (!name.trim()) { toast.error("Name required"); return null; }
    if (!subject.trim() || !bodyHtml.trim()) { toast.error("Subject and body required"); return null; }
    const payload = {
      name, from_name: fromName, reply_to: replyTo || null,
      audience_id: audienceId || null, template_id: templateId || null,
      subject, preheader: preheader || null,
      body_html: bodyHtml, body_text: bodyText || null,
      status,
    };
    setSaving(true);
    let id = initial?.id;
    let res;
    if (id) {
      res = await supabase.from("email_campaigns").update(payload).eq("id", id).select().single();
    } else {
      res = await supabase.from("email_campaigns").insert(payload).select().single();
    }
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return null; }
    return res.data;
  };

  const saveDraft = async () => {
    const r = await persist("draft");
    if (r) { toast.success("Draft saved"); onSaved(); onOpenChange(false); }
  };

  const sendNow = async () => {
    if (!audienceId) { toast.error("Pick an audience"); return; }
    const count = selectedAudience?.member_count ?? 0;
    if (!confirm(`Send to ${count.toLocaleString()} recipients now?`)) return;
    const r = await persist("sending");
    if (!r) return;
    try {
      const res = await sendCampaign(r.id);
      toast.success(`Sent ${res.sent} / ${res.total}${res.failed ? ` (${res.failed} failed)` : ""}`);
      onSaved(); onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const sendTest = async () => {
    if (!testEmail) { toast.error("Enter your email"); return; }
    const r = await persist("draft");
    if (!r) return;
    setSendingTest(true);
    try {
      const res = await sendCampaign(r.id, testEmail);
      toast.success(`Test sent: ${res.sent}/${res.total}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSendingTest(false); }
  };

  const renderedHtml = bodyHtml
    .replace(/\{\{first_name\}\}/g, "Sarah")
    .replace(/\{\{course_name\}\}/g, selectedAudience?.course_name || "Digital Marketing")
    .replace(/\{\{cta_url\}\}/g, "#");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit campaign" : "New campaign"}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 sm:gap-2 mb-4 overflow-x-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                  step === s.id ? "bg-primary text-primary-foreground" : step > s.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div><Label>Campaign name (internal)</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. June re-engagement nudge" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>From name</Label><Input value={fromName} onChange={(e) => setFromName(e.target.value)} /></div>
              <div><Label>Reply-to email</Label><Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="support@maarifasasa.com" /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Label>Pick an audience</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {audiences.map((a) => (
                <button key={a.id} onClick={() => setAudienceId(a.id)}
                  className={`text-left p-3 rounded-md border transition-all ${audienceId === a.id ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span className="font-medium text-sm">{a.name}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">{a.member_count.toLocaleString()} recipients • {a.type.replace("_"," ")}</div>
                </button>
              ))}
            </div>
            {audiences.length === 0 && <p className="text-sm text-muted-foreground">Create an audience first in the Audiences tab.</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Label>Start from a template (optional)</Label>
            <div className="grid sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              <button onClick={() => { setTemplateId(""); setSubject(""); setBodyHtml(""); }}
                className={`text-left p-3 rounded-md border ${!templateId ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                <div className="font-medium text-sm">Start from scratch</div>
                <div className="text-xs text-muted-foreground">Blank template</div>
              </button>
              {templates.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className={`text-left p-3 rounded-md border ${templateId === t.id ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{t.name}</span>
                    {t.is_system && <Badge variant="secondary" className="text-[9px]">System</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{t.subject}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div><Label>Preheader</Label><Input value={preheader} onChange={(e) => setPreheader(e.target.value)} /></div>
              <div>
                <Label>HTML body</Label>
                <Textarea rows={14} value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} className="font-mono text-xs" />
              </div>
              <div className="rounded border p-3 bg-muted/30 space-y-2">
                <div className="text-xs font-medium flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Send test</div>
                <div className="flex gap-2">
                  <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="your@email.com" className="text-sm" />
                  <Button size="sm" onClick={sendTest} disabled={sendingTest}>
                    {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Live preview</Label>
              <div className="rounded border bg-white">
                <iframe title="preview" className="w-full min-h-[500px]" srcDoc={renderedHtml} />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{name || "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">From</span><span className="font-medium">{fromName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Audience</span><span className="font-medium">{selectedAudience?.name || "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Recipients</span><span className="font-medium">{selectedAudience?.member_count?.toLocaleString() ?? 0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subject</span><span className="font-medium truncate max-w-[60%]">{subject || "—"}</span></div>
            </div>
            <div className="rounded border bg-white">
              <iframe title="preview" className="w-full min-h-[300px]" srcDoc={renderedHtml} />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveDraft} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save draft
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)}>Next <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
            ) : (
              <Button onClick={sendNow} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                Send now
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignWizard;