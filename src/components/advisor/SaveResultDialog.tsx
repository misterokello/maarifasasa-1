import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdvisorAnswers, AdvisorProductBrief, Recommendation } from "@/types/advisor";
import { trackAdvisor } from "@/lib/advisor/analytics";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  answers: AdvisorAnswers;
  recommendation: Recommendation;
  products: Record<string, AdvisorProductBrief>;
}

export default function SaveResultDialog({ open, onOpenChange, answers, recommendation, products }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email to save and receive your pathway.");
      return;
    }
    setSaving(true);
    trackAdvisor("save_clicked", { metadata: { has_name: !!name.trim() } });
    try {
      const { data, error } = await supabase.functions.invoke("advisor-save", {
        body: {
          answers,
          recommendation,
          products,
          email: email.trim(),
          full_name: name.trim() || null,
          send_email: true,
        },
      });
      if (error || !data?.share_url) {
        toast.error(error?.message || data?.error || "Could not save");
        return;
      }
      setShareUrl(data.share_url);
      trackAdvisor("save_completed", {
        assessmentId: data.id ?? null,
        metadata: { share_code: data.share_code },
      });
      toast.success("Saved! Check your inbox for your pathway.");
    } catch (e: any) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    trackAdvisor("share_copied", { metadata: { share_url: shareUrl } });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save & email your pathway</DialogTitle>
          <DialogDescription>
            We'll email you a copy and create a shareable link you can revisit anytime.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <>
            <div className="space-y-3">
              <div>
                <Label htmlFor="advisor-name">Your name (optional)</Label>
                <Input id="advisor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Robert Okello" />
              </div>
              <div>
                <Label htmlFor="advisor-email">Your email</Label>
                <Input
                  id="advisor-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                <Mail className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save & email me"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="bg-muted rounded-lg p-3 text-sm break-all">{shareUrl}</div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={copy}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}