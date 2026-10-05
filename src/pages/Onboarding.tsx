import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { PartyPopper, Trophy } from "lucide-react";
import {
  FieldDef,
  PROFILE_COLUMN_KEYS,
  SECTION_ORDER,
  SECTION_TITLE,
  normalizeFieldDefinitions,
  coerceProfileValue,
  displayFieldValue,
  validateFields,
  computeOnboardingProgress,
} from "@/lib/onboardingFields";

const Onboarding = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next") || "/dashboard";
  // Guard against loops: never send the learner back to /onboarding or /auth.
  const nextPath = (!rawNext || rawNext.startsWith("/onboarding") || rawNext.startsWith("/auth"))
    ? "/dashboard"
    : rawNext;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [celebrating, setCelebrating] = useState(false);

  const sections = useMemo(() => {
    const bySection: Record<string, FieldDef[]> = {};
    for (const f of fields) {
      if (!f.visible) continue;
      (bySection[f.section] ||= []).push(f);
    }
    return SECTION_ORDER.filter((s) => bySection[s]?.length).map((s) => ({
      key: s,
      fields: bySection[s].sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [fields]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Ensure a profile row exists — signups without the auth trigger would otherwise be missing one.
      await supabase.from("profiles").upsert(
        { id: session.user.id, email: session.user.email, full_name: (session.user.user_metadata as any)?.full_name || "" },
        { onConflict: "id", ignoreDuplicates: true },
      );

      const [{ data: defs, error: defsError }, { data: profile }] = await Promise.all([
        supabase.from("profile_field_definitions").select("*").eq("visible", true).order("sort_order"),
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
      ]);

      if (defsError) {
        console.error("Profile field definitions load error:", defsError);
      }
      const normalized = normalizeFieldDefinitions(defs);

      // Skip only when the profile is both flagged complete and actually 100% filled.
      if ((profile as any)?.profile_completed_at && computeOnboardingProgress(normalized, profile).isComplete) {
        navigate(nextPath, { replace: true });
        return;
      }

      setFields(normalized);

      // Prefill from existing profile row where matching columns exist.
      const initial: Record<string, any> = {};
      for (const f of normalized) {
        const storedResponses = ((profile as any)?.onboarding_responses || {}) as Record<string, any>;
        const v = (profile as any)?.[f.key] ?? storedResponses[f.key];
        if (v !== undefined && v !== null) initial[f.key] = displayFieldValue(f, v);
      }
      // Pre-split full_name into first/last if missing
      if (!initial.first_name && (profile as any)?.full_name) {
        const [first, ...rest] = String((profile as any).full_name).split(" ");
        initial.first_name = first;
        initial.last_name = rest.join(" ");
      }
      setValues(initial);
      setLoading(false);
    })();
  }, [navigate, nextPath]);

  const currentSection = sections[stepIdx];

  // Field-level progress (not just step position) so the bar is truthful.
  const fieldProgress = useMemo(
    () => computeOnboardingProgress(fields, { onboarding_responses: values }),
    [fields, values],
  );
  const progress = fieldProgress.percent;

  const validateSection = (): string | null => {
    if (!currentSection) return null;
    const nextErrors: Record<string, string> = {};
    for (const f of currentSection.fields) {
      const err = validateFieldsSingle(f);
      if (err) nextErrors[f.key] = err;
    }
    setErrors(nextErrors);
    return validateFields(currentSection.fields, values);
  };

  const validateFieldsSingle = (f: FieldDef) => validateFields([f], values);

  const persistPartial = async () => {
    if (!userId) return;
    const patch: Record<string, any> = {};
    for (const f of fields) {
      if (!(f.key in values) || !PROFILE_COLUMN_KEYS.has(f.key)) continue;
      try {
        patch[f.key] = coerceProfileValue(f.key, values[f.key]);
      } catch (e) {
        // Never let a single unparseable value break the whole save.
        console.warn("Skipping unparseable onboarding field", f.key, e);
      }
    }
    patch.onboarding_responses = { ...values };
    // Derive full_name if first/last provided
    if (patch.first_name || patch.last_name) {
      patch.full_name = [patch.first_name, patch.last_name].filter(Boolean).join(" ").trim();
    }
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) throw error;
  };

  const handleNext = async () => {
    const err = validateSection();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      await persistPartial();
    } catch (error: any) {
      setSaving(false);
      toast.error(error?.message || "Unable to save onboarding");
      return;
    }
    setSaving(false);
    if (stepIdx < sections.length - 1) {
      setStepIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const { error } = await supabase.from("profiles").update({ profile_completed_at: new Date().toISOString() }).eq("id", userId!);
      if (error) {
        toast.error(error.message);
        return;
      }
      celebrate();
      setCelebrating(true);
    }
  };

  const celebrate = () => {
    const burst = (x: number) =>
      confetti({ particleCount: 70, spread: 70, origin: { x, y: 0.6 }, disableForReducedMotion: true });
    burst(0.3);
    setTimeout(() => burst(0.7), 200);
    setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, disableForReducedMotion: true }), 420);
  };

  const handleSkip = async () => {
    // Only allowed on optional (no-required-empty) sections
    if (validateSection()) {
      toast.error("Please fill required fields to continue");
      return;
    }
    await handleNext();
  };

  const handleCvUpload = async (f: FieldDef, file: File) => {
    if (!userId) return;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("learner-cvs").upload(path, file, { upsert: true });
    if (error) {
      toast.error("CV upload failed");
      return;
    }
    setValues((v) => ({ ...v, [f.key]: path }));
    toast.success("CV uploaded");
  };

  const renderField = (f: FieldDef) => {
    const val = values[f.key];
    const set = (v: any) => {
      setValues((prev) => ({ ...prev, [f.key]: v }));
      setErrors((prev) => (prev[f.key] ? { ...prev, [f.key]: "" } : prev));
    };
    const opts = Array.isArray(f.options) ? f.options : [];

    switch (f.input_type) {
      case "textarea":
        return <Textarea id={f.key} value={val || ""} placeholder={f.placeholder || ""} onChange={(e) => set(e.target.value)} />;
      case "select":
        return (
          <Select value={val || ""} onValueChange={set}>
            <SelectTrigger id={f.key}><SelectValue placeholder={f.placeholder || "Select..."} /></SelectTrigger>
            <SelectContent>
              {opts.map((o) => <SelectItem key={String(o)} value={String(o)}>{String(o)}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "multiselect":
        return (
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => {
              const arr: string[] = Array.isArray(val) ? val : [];
              const active = arr.includes(String(o));
              return (
                <button
                  key={String(o)}
                  type="button"
                  onClick={() => set(active ? arr.filter((x) => x !== o) : [...arr, String(o)])}
                  className={`px-3 py-1 rounded-full text-sm border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input"}`}
                >
                  {String(o)}
                </button>
              );
            })}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox id={f.key} checked={!!val} onCheckedChange={(c) => set(!!c)} />
            <label htmlFor={f.key} className="text-sm text-muted-foreground">{f.help_text || f.label}</label>
          </div>
        );
      case "file":
        return (
          <div className="space-y-2">
            <Input
              id={f.key}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCvUpload(f, file);
              }}
            />
            {val && <p className="text-xs text-muted-foreground">Uploaded: {String(val).split("/").pop()}</p>}
          </div>
        );
      case "tel":
      case "url":
      case "email":
      case "text":
      default:
        return (
          <Input
            id={f.key}
            type={f.input_type === "text" ? "text" : f.input_type}
            value={val || ""}
            placeholder={f.placeholder || ""}
            onChange={(e) => set(e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentSection) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <p>No profile fields configured.</p>
      </div>
    );
  }

  if (celebrating) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12 bg-gradient-to-br from-background to-secondary/20">
        <Card className="max-w-lg w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-2 rounded-full bg-primary/10 p-4 w-fit">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Congratulations{values.first_name ? `, ${values.first_name}` : ""}! 🎉</CardTitle>
            <CardDescription>
              Your onboarding is 100% complete. Your profile now powers personalised recommendations across Maarifasasa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={100} />
            <Button className="w-full gap-2" onClick={() => navigate(nextPath, { replace: true })}>
              <PartyPopper className="h-4 w-4" /> Go to my dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = SECTION_TITLE[currentSection.key] || { title: currentSection.key, subtitle: "" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-24 pb-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
            <span>Step {stepIdx + 1} of {sections.length}</span>
            <span className="font-medium tabular-nums text-foreground">{progress}% complete</span>
          </div>
          <Progress value={progress} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{meta.title}</CardTitle>
            <CardDescription>{meta.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSection.fields.map((f) => (
              <div key={f.id} className="space-y-2">
                {f.input_type !== "checkbox" && (
                  <Label htmlFor={f.key}>
                    {f.label} {f.required && <span className="text-destructive">*</span>}
                  </Label>
                )}
                {renderField(f)}
                {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
                {f.help_text && f.input_type !== "checkbox" && (
                  <p className="text-xs text-muted-foreground">{f.help_text}</p>
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              {stepIdx > 0 && (
                <Button type="button" variant="outline" onClick={() => setStepIdx((i) => i - 1)} disabled={saving}>
                  Back
                </Button>
              )}
              <Button type="button" onClick={handleNext} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : stepIdx === sections.length - 1 ? "Finish" : "Continue"}
              </Button>
              {currentSection.key !== "personal" && (
                <Button type="button" variant="ghost" onClick={handleSkip} disabled={saving}>
                  Skip
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;