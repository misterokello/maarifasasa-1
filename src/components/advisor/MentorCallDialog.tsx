import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Loader2, Video } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, isWeekend } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { trackAdvisor } from "@/lib/advisor/analytics";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assessmentId?: string | null;
  defaultName?: string;
  defaultEmail?: string;
  defaultTopic?: string;
}

const SLOTS = [
  "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00",
  "16:00", "17:00",
];

export default function MentorCallDialog({
  open,
  onOpenChange,
  assessmentId,
  defaultName,
  defaultEmail,
  defaultTopic,
}: Props) {
  const [step, setStep] = useState<"slot" | "details" | "done">("slot");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<string | null>(null);
  const [fullName, setFullName] = useState(defaultName || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState(defaultTopic || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const minDate = useMemo(() => addDays(new Date(), 1), []);
  const maxDate = useMemo(() => addDays(new Date(), 30), []);

  const reset = () => {
    setStep("slot");
    setDate(undefined);
    setSlot(null);
    setPhone("");
    setNotes("");
    setSubmitting(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      // small delay so animation finishes before reset
      setTimeout(reset, 200);
    }
    onOpenChange(v);
  };

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || !date || !slot) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("mentor-call-request", {
        body: {
          assessment_id: assessmentId || null,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          preferred_date: format(date, "yyyy-MM-dd"),
          preferred_time: slot,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Kampala",
          topic: topic.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      if (error) throw error;
      setStep("done");
      trackAdvisor("mentor_call_requested", {
        assessmentId: assessmentId ?? null,
        metadata: {
          preferred_date: format(date, "yyyy-MM-dd"),
          preferred_time: slot,
          has_topic: !!topic.trim(),
        },
      });
      toast({ title: "Request sent", description: "Check your inbox — we'll confirm shortly." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Couldn't send request",
        description: e?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Book a free 30-minute mentor call
          </DialogTitle>
          <DialogDescription>
            Get personalised advice on your pathway from a Maarifasasa learning coach.
          </DialogDescription>
        </DialogHeader>

        {step === "slot" && (
          <div className="space-y-5 py-2">
            <div>
              <Label className="mb-2 block flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" /> Preferred date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "EEEE, d MMMM yyyy") : "Pick a weekday"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setSlot(null); }}
                    disabled={(d) => d < minDate || d > maxDate || isWeekend(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1.5">
                Weekdays only · Next 30 days
              </p>
            </div>

            <div>
              <Label className="mb-2 block flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Available time slots
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!date}
                    onClick={() => setSlot(s)}
                    className={cn(
                      "px-3 py-2 rounded-md border text-sm font-medium transition-all",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      slot === s
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-accent border-input"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Kampala"}).
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!date || !slot}
              onClick={() => setStep("details")}
            >
              Continue
            </Button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Your slot</span>
              <span className="font-semibold">
                {date && format(date, "d MMM")} · {slot}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mc-name">Full name *</Label>
                <Input id="mc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <Label htmlFor="mc-email">Email *</Label>
                <Input id="mc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="mc-phone">Phone / WhatsApp (optional)</Label>
              <Input id="mc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256 …" />
            </div>
            <div>
              <Label htmlFor="mc-topic">What would you like to discuss?</Label>
              <Input id="mc-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Choosing between bootcamp and certificate" />
            </div>
            <div>
              <Label htmlFor="mc-notes">Anything else? (optional)</Label>
              <Textarea id="mc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Background, constraints, goals…" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep("slot")} disabled={submitting}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={submit}
                disabled={submitting || !fullName.trim() || !email.trim()}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : (
                  "Request call"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">You're booked in</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation to <span className="font-medium text-foreground">{email}</span>.
              A coach will reach out within one business day with a video link.
            </p>
            <Button onClick={() => handleClose(false)} className="mt-2">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}