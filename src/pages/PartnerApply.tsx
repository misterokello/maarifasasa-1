import { useState } from "react";
import { Helmet } from "react-helmet";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Megaphone } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).optional(),
  channel: z.string().trim().max(120).optional(),
  audience_size: z.string().trim().max(60).optional(),
  social_links: z.string().trim().max(500).optional(),
  requested_code: z
    .string()
    .trim()
    .max(20)
    .regex(/^[A-Z0-9]*$/, "Use letters and numbers only")
    .optional(),
  motivation: z.string().trim().max(1000).optional(),
});

const PartnerApply = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    channel: "",
    audience_size: "",
    social_links: "",
    requested_code: "",
    motivation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fe[String(err.path[0])] = err.message;
      });
      setErrors(fe);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("discount_code_applications").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      channel: parsed.data.channel || null,
      audience_size: parsed.data.audience_size || null,
      social_links: parsed.data.social_links || null,
      requested_code: parsed.data.requested_code || null,
      motivation: parsed.data.motivation || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not submit your application");
      return;
    }
    setDone(true);
  };

  return (
    <>
      <Helmet>
        <title>Become a Maarifasasa Partner | Referral Program</title>
        <meta
          name="description"
          content="Apply to become a Maarifasasa referral partner. Get your own discount code, referral link and QR code to share, and earn on every enrolment you drive."
        />
        <link rel="canonical" href={`${window.location.origin}/partners/apply`} />
      </Helmet>

      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Become a referral partner</h1>
            <p className="text-muted-foreground mt-2">
              Share knowledge, earn from every learner you bring. Once approved you get your own
              discount code, referral link and QR code.
            </p>
          </div>

          {done ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-xl font-semibold">Application received</h2>
                <p className="text-muted-foreground text-sm">
                  Our team will review it shortly. Once approved, we'll email your code, referral
                  link and QR code.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Partner registration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pa-name">Full name</Label>
                      <Input
                        id="pa-name"
                        value={form.full_name}
                        onChange={(e) => set("full_name", e.target.value)}
                        maxLength={120}
                        required
                      />
                      {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pa-email">Email</Label>
                      <Input
                        id="pa-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        maxLength={255}
                        required
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pa-phone">WhatsApp / phone</Label>
                      <Input id="pa-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pa-channel">Main channel</Label>
                      <Input
                        id="pa-channel"
                        placeholder="Instagram, TikTok, community group…"
                        value={form.channel}
                        onChange={(e) => set("channel", e.target.value)}
                        maxLength={120}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pa-audience">Audience size</Label>
                      <Input
                        id="pa-audience"
                        placeholder="e.g. 5,000 followers"
                        value={form.audience_size}
                        onChange={(e) => set("audience_size", e.target.value)}
                        maxLength={60}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pa-code">Preferred code (optional)</Label>
                      <Input
                        id="pa-code"
                        placeholder="JANE10"
                        value={form.requested_code}
                        onChange={(e) => set("requested_code", e.target.value.toUpperCase())}
                        maxLength={20}
                      />
                      {errors.requested_code && (
                        <p className="text-xs text-destructive">{errors.requested_code}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pa-links">Links to your profiles</Label>
                    <Textarea
                      id="pa-links"
                      rows={2}
                      value={form.social_links}
                      onChange={(e) => set("social_links", e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pa-motivation">Why do you want to partner with us?</Label>
                    <Textarea
                      id="pa-motivation"
                      rows={3}
                      value={form.motivation}
                      onChange={(e) => set("motivation", e.target.value)}
                      maxLength={1000}
                    />
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit application
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default PartnerApply;