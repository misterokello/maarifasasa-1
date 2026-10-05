import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  PlayCircle,
  Copy,
  ExternalLink,
  Save,
  AlertTriangle,
  KeyRound,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type IntegrationKey =
  | "stripe"
  | "iotec"
  | "thinkific"
  | "resend"
  | "tally"
  | "google_oauth"
  | "lovable_ai";

interface IntegrationStatus {
  key: IntegrationKey;
  label: string;
  configured: boolean;
  missingSecrets: string[];
  testStatus: "ok" | "fail" | "not_run";
  testMessage?: string;
  latencyMs?: number;
}

interface AuditEntry {
  id: string;
  integration_key: string;
  action: string;
  actor_email: string | null;
  status: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const INTEGRATION_META: Record<
  IntegrationKey,
  {
    description: string;
    docsUrl: string;
    webhookUrl?: string;
    secretNames: string[];
    rotateInstructions: string;
  }
> = {
  stripe: {
    description: "Card payments (USD) via Stripe Checkout.",
    docsUrl: "https://dashboard.stripe.com/apikeys",
    webhookUrl: `${SUPABASE_URL}/functions/v1/stripe-webhook`,
    secretNames: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    rotateInstructions:
      "In Stripe Dashboard → Developers → API keys, reveal/regenerate the secret key. For the webhook secret, open Developers → Webhooks → select your endpoint → Signing secret.",
  },
  iotec: {
    description: "Mobile Money payments (UGX) via ioTec Pay.",
    docsUrl: "https://docs.iotec.io/",
    secretNames: ["IOTEC_CLIENT_ID", "IOTEC_CLIENT_SECRET", "IOTEC_WALLET_ID"],
    rotateInstructions:
      "Log into the ioTec dashboard → API credentials → regenerate Client ID & Secret. The Wallet ID stays the same per merchant account.",
  },
  thinkific: {
    description: "LMS course catalog and learner enrollment.",
    docsUrl: "https://developers.thinkific.com/api/api-documentation/",
    secretNames: ["Thinkific"],
    rotateInstructions:
      "Thinkific → Settings → Code & analytics → API → Generate API Key. Paste the new key here.",
  },
  resend: {
    description: "Transactional email delivery.",
    docsUrl: "https://resend.com/api-keys",
    secretNames: ["RESEND_API_KEY"],
    rotateInstructions:
      "Resend → API Keys → Create API Key. Use a 'Sending access' key and paste it here.",
  },
  tally: {
    description: "Tally form submissions & webhook ingestion.",
    docsUrl: "https://tally.so/help/api",
    webhookUrl: `${SUPABASE_URL}/functions/v1/tally-webhook`,
    secretNames: ["TALLY_API_KEY"],
    rotateInstructions:
      "Tally → Workspace settings → API → Generate new key.",
  },
  google_oauth: {
    description: "Google Sign-In for learners and admins.",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    webhookUrl: `${SUPABASE_URL}/functions/v1/google-oauth-callback`,
    secretNames: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"],
    rotateInstructions:
      "Google Cloud Console → APIs & Services → Credentials → your OAuth client → Reset secret.",
  },
  lovable_ai: {
    description: "Lovable AI Gateway powering the AI Pathway Advisor.",
    docsUrl: "https://docs.lovable.dev/features/ai",
    secretNames: ["LOVABLE_API_KEY"],
    rotateInstructions:
      "This key is auto-managed by Lovable. Rotate from Lovable project settings only if you suspect a leak.",
  },
};

const EDITABLE_SETTINGS: Partial<
  Record<
    IntegrationKey,
    Array<{ field: string; label: string; placeholder: string; multiline?: boolean }>
  >
> = {
  thinkific: [
    { field: "subdomain", label: "Thinkific subdomain", placeholder: "maarifasasa" },
    { field: "default_course_url", label: "Default course URL", placeholder: "https://maarifasasa.thinkific.com/users/sign_in" },
  ],
  iotec: [
    { field: "country_code", label: "Default country code", placeholder: "256" },
    { field: "currency", label: "Currency", placeholder: "UGX" },
  ],
  stripe: [{ field: "currency", label: "Default currency", placeholder: "USD" }],
  resend: [
    { field: "from_address", label: "Default From address", placeholder: "Maarifasasa <hello@maarifasasa.com>" },
    { field: "reply_to", label: "Reply-to", placeholder: "support@maarifasasa.com" },
  ],
};

const SecretBadge = ({ name, present }: { name: string; present: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-mono ${
      present
        ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
        : "border-destructive/30 bg-destructive/10 text-destructive"
    }`}
  >
    {present ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    {name}
  </span>
);

const AdminIntegrations = () => {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<IntegrationKey | null>(null);
  const [settingsMap, setSettingsMap] = useState<Record<string, Record<string, string>>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("integrations-status");
      if (error) throw error;
      setStatuses(data?.integrations ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load integration status");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("integration_settings")
      .select("integration_key, settings");
    if (error) {
      console.error(error);
      return;
    }
    const map: Record<string, Record<string, string>> = {};
    (data ?? []).forEach((row: any) => {
      map[row.integration_key] = (row.settings as Record<string, string>) ?? {};
    });
    setSettingsMap(map);
  };

  const loadAudit = async () => {
    const { data, error } = await supabase
      .from("integration_audit_log")
      .select("id, integration_key, action, actor_email, status, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error(error);
      return;
    }
    setAuditEntries((data ?? []) as AuditEntry[]);
  };

  useEffect(() => {
    loadStatuses();
    loadSettings();
    loadAudit();
  }, []);

  const runTest = async (key: IntegrationKey) => {
    setTesting(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/integrations-status?action=test&integration=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const json = await res.json();
      setStatuses((prev) =>
        prev.map((s) =>
          s.key === key
            ? {
                ...s,
                testStatus: json.ok ? "ok" : "fail",
                testMessage: json.message,
                latencyMs: json.latencyMs,
              }
            : s
        )
      );
      if (json.ok) toast.success(`${key}: ${json.message}`);
      else toast.error(`${key} test failed: ${json.message}`);
      loadAudit();
    } catch (err) {
      toast.error(`Test failed: ${(err as Error).message}`);
    } finally {
      setTesting(null);
    }
  };

  const saveSettings = async (key: IntegrationKey) => {
    setSavingKey(key);
    try {
      const current = settingsMap[key] ?? {};
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("integration_settings")
        .upsert(
          {
            integration_key: key,
            settings: current,
            updated_by: userData.user?.id ?? null,
          },
          { onConflict: "integration_key" }
        );
      if (error) throw error;
      await supabase.from("integration_audit_log").insert({
        integration_key: key,
        action: "settings_updated",
        actor_id: userData.user?.id ?? null,
        actor_email: userData.user?.email ?? null,
        status: "success",
        details: { fields: Object.keys(current) },
      });
      toast.success("Settings saved");
      loadAudit();
    } catch (err) {
      toast.error(`Save failed: ${(err as Error).message}`);
    } finally {
      setSavingKey(null);
    }
  };

  const updateSetting = (key: IntegrationKey, field: string, value: string) => {
    setSettingsMap((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [field]: value },
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <AdminDashboardLayout
      title="Integrations & API Management"
      subtitle="Monitor connection health, rotate keys, and manage non-secret configuration"
    >
      <div className="max-w-6xl space-y-6">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>How secrets work</AlertTitle>
          <AlertDescription>
            API keys are stored encrypted in Lovable Cloud's secret vault and are{" "}
            <strong>never readable</strong> from this panel — not even by admins. You can verify a
            key is configured, test that it works against the live provider, and request a rotation.
            Actual key values can only be replaced, not viewed.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="status">
          <TabsList>
            <TabsTrigger value="status">
              <PlayCircle className="h-4 w-4 mr-2" /> Status
            </TabsTrigger>
            <TabsTrigger value="config">
              <KeyRound className="h-4 w-4 mr-2" /> Configuration
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="h-4 w-4 mr-2" /> Audit log
            </TabsTrigger>
          </TabsList>

          {/* STATUS TAB */}
          <TabsContent value="status" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {statuses.map((s) => {
                  const meta = INTEGRATION_META[s.key];
                  return (
                    <Card key={s.key}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {s.label}
                              {s.configured ? (
                                <Badge variant="default" className="bg-green-600">
                                  Configured
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Missing secrets</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">{meta.description}</CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runTest(s.key)}
                            disabled={testing === s.key || !s.configured}
                          >
                            {testing === s.key ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <PlayCircle className="h-3 w-3 mr-1" />
                            )}
                            Test
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {meta.secretNames.map((sn) => (
                            <SecretBadge
                              key={sn}
                              name={sn}
                              present={!s.missingSecrets.includes(sn)}
                            />
                          ))}
                        </div>

                        {s.testStatus !== "not_run" && (
                          <div
                            className={`text-sm rounded-md border p-2.5 ${
                              s.testStatus === "ok"
                                ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
                                : "border-destructive/30 bg-destructive/5 text-destructive"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-medium">
                              {s.testStatus === "ok" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <AlertTriangle className="h-4 w-4" />
                              )}
                              {s.testStatus === "ok" ? "Healthy" : "Failed"}
                              {s.latencyMs !== undefined && (
                                <span className="text-xs opacity-70 ml-auto">
                                  {s.latencyMs}ms
                                </span>
                              )}
                            </div>
                            <p className="mt-1 break-words font-mono text-xs">{s.testMessage}</p>
                          </div>
                        )}

                        {meta.webhookUrl && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                            <div className="flex gap-2">
                              <Input value={meta.webhookUrl} readOnly className="font-mono text-xs" />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(meta.webhookUrl!, "Webhook URL")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Button asChild variant="ghost" size="sm">
                            <a href={meta.docsUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" /> Provider dashboard
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* CONFIG TAB */}
          <TabsContent value="config" className="space-y-4 mt-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>To rotate or replace a secret</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Secret <em>values</em> cannot be edited from the app. Open the Lovable project,
                  send a message asking to "update the [PROVIDER] API key", and you'll receive a
                  secure prompt to paste the new value. Each rotation is recorded in the audit log
                  below.
                </p>
                <p>The fields below are <strong>non-secret</strong> configuration only.</p>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {statuses.map((s) => {
                const meta = INTEGRATION_META[s.key];
                const fields = EDITABLE_SETTINGS[s.key];
                const values = settingsMap[s.key] ?? {};
                return (
                  <Card key={s.key}>
                    <CardHeader>
                      <CardTitle>{s.label}</CardTitle>
                      <CardDescription>{meta.rotateInstructions}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {fields && fields.length > 0 ? (
                        <>
                          {fields.map((f) => (
                            <div key={f.field} className="space-y-1.5">
                              <Label>{f.label}</Label>
                              {f.multiline ? (
                                <Textarea
                                  value={values[f.field] ?? ""}
                                  placeholder={f.placeholder}
                                  onChange={(e) => updateSetting(s.key, f.field, e.target.value)}
                                  rows={3}
                                />
                              ) : (
                                <Input
                                  value={values[f.field] ?? ""}
                                  placeholder={f.placeholder}
                                  onChange={(e) => updateSetting(s.key, f.field, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                          <Button
                            size="sm"
                            onClick={() => saveSettings(s.key)}
                            disabled={savingKey === s.key}
                          >
                            {savingKey === s.key ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Save
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No editable settings for this integration. Rotate the secret from the
                          provider dashboard.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* AUDIT TAB */}
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Last 50 integration events. Newest first.</CardDescription>
              </CardHeader>
              <CardContent>
                {auditEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No activity yet.
                  </p>
                ) : (
                  <div className="divide-y">
                    {auditEntries.map((e) => (
                      <div key={e.id} className="py-3 flex items-start gap-3 text-sm">
                        {e.status === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{e.integration_key}</span>
                            <Badge variant="outline" className="text-xs">
                              {e.action}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {e.actor_email ?? "system"}
                            </span>
                            <span className="text-muted-foreground text-xs ml-auto">
                              {format(new Date(e.created_at), "MMM d, yyyy HH:mm")}
                            </span>
                          </div>
                          {e.details && (
                            <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
                              {JSON.stringify(e.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminIntegrations;