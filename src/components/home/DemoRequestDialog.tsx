import React from "react";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { trackCta, trackEnquirySubmit, trackFunnelStep } from "@/lib/analytics";
import { getActiveVariants } from "@/lib/abTesting";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

const INTERESTS = [
  "Hire trained talent",
  "Co-design a cohort",
  "Fund outcomes",
  "Government programme",
  "Technology partnership",
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  work_email: z.string().trim().email("Enter a valid work email").max(255),
  organisation: z.string().trim().min(2, "Enter your organisation").max(120),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  interest: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  preferred_time: z.string().min(1, "Pick a time"),
});

type Props = {
  trigger?: React.ReactNode;
  location?: string;
};

const DemoRequestDialog = ({ trigger, location = "enterprise_band" }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState({
    full_name: "",
    work_email: "",
    organisation: "",
    role: "",
    phone: "",
    interest: "",
    message: "",
    preferred_time: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDone(false);
      trackCta({
        id: "request_demo_open",
        label: "Request a demo",
        location,
        audience: "enterprise",
        stage: "intent",
      });
      trackFunnelStep("demo_request_opened", { location });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    const nextErrors: Record<string, string> = {};

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      });
    }
    if (!date) nextErrors.date = "Pick a preferred date";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !parsed.success || !date) return;

    setSubmitting(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const preferredDate = format(date, "yyyy-MM-dd");

    try {
      const { error } = await supabase.functions.invoke("demo-request", {
        body: {
          ...parsed.data,
          role: parsed.data.role || null,
          phone: parsed.data.phone || null,
          interest: parsed.data.interest || null,
          message: parsed.data.message || null,
          preferred_date: preferredDate,
          timezone,
          source: location,
          experiments: getActiveVariants(),
        },
      });

      if (error) throw error;

      trackEnquirySubmit({
        form: "request_demo",
        audience: "enterprise",
        status: "success",
        extra: { location, interest: parsed.data.interest || null, preferred_date: preferredDate },
      });
      trackFunnelStep("demo_request_submitted", { location });

      setDone(true);
      toast({
        title: "Demo request received",
        description: "We've emailed a confirmation with a calendar invite attached.",
      });
    } catch (err) {
      trackEnquirySubmit({
        form: "request_demo",
        audience: "enterprise",
        status: "error",
        extra: { location, message: err instanceof Error ? err.message : "unknown" },
      });
      toast({
        title: "We couldn't submit your request",
        description: "Please try again in a moment, or email partnerships@maarifasasa.com.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-destructive">{errors[key]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" variant="secondary" className="min-h-[48px]">
            Request a demo
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
            <DialogHeader>
              <DialogTitle className="text-center">Your demo is requested</DialogTitle>
              <DialogDescription className="text-center">
                A confirmation email with a calendar invite (.ics) is on its way. Our partnerships
                team will lock in your slot and share the meeting link.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-6 min-h-[44px]" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request an enterprise demo</DialogTitle>
              <DialogDescription>
                Pick a time that suits you and we&apos;ll walk you through our talent pipeline,
                cohort design and outcome reporting.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="demo-name">Full name *</Label>
                  <Input
                    id="demo-name"
                    value={form.full_name}
                    maxLength={100}
                    onChange={(e) => set("full_name")(e.target.value)}
                  />
                  {fieldError("full_name")}
                </div>
                <div>
                  <Label htmlFor="demo-email">Work email *</Label>
                  <Input
                    id="demo-email"
                    type="email"
                    value={form.work_email}
                    maxLength={255}
                    onChange={(e) => set("work_email")(e.target.value)}
                  />
                  {fieldError("work_email")}
                </div>
                <div>
                  <Label htmlFor="demo-org">Organisation *</Label>
                  <Input
                    id="demo-org"
                    value={form.organisation}
                    maxLength={120}
                    onChange={(e) => set("organisation")(e.target.value)}
                  />
                  {fieldError("organisation")}
                </div>
                <div>
                  <Label htmlFor="demo-role">Your role</Label>
                  <Input
                    id="demo-role"
                    value={form.role}
                    maxLength={120}
                    onChange={(e) => set("role")(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="demo-phone">Phone / WhatsApp</Label>
                  <Input
                    id="demo-phone"
                    value={form.phone}
                    maxLength={30}
                    onChange={(e) => set("phone")(e.target.value)}
                  />
                </div>
                <div>
                  <Label>What are you exploring?</Label>
                  <Select value={form.interest} onValueChange={set("interest")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERESTS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Preferred date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "EEE d MMM yyyy") : "Choose a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(d) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return d < today || d.getDay() === 0 || d.getDay() === 6;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldError("date")}
                </div>
                <div>
                  <Label>Preferred time *</Label>
                  <Select value={form.preferred_time} onValueChange={set("preferred_time")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          <span className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> {slot}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError("preferred_time")}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="demo-message">Anything we should prepare?</Label>
                <Textarea
                  id="demo-message"
                  rows={3}
                  maxLength={1000}
                  value={form.message}
                  onChange={(e) => set("message")(e.target.value)}
                />
              </div>

              <Button type="submit" size="lg" className="min-h-[48px] w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Request my demo"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DemoRequestDialog;
