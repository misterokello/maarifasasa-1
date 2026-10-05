import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Calendar, ExternalLink, Unplug } from "lucide-react";
import { toast } from "sonner";

export default function AdvisorSettingsView() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [token, setToken] = useState<{ email: string | null; updated_at: string } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setToken(null); return; }
      const { data } = await supabase
        .from("admin_google_tokens")
        .select("email, updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setToken(data ?? null);
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const returnTo = `${window.location.origin}/admin/advisor?tab=settings`;
      const { data, error } = await supabase.functions.invoke("google-oauth-init", {
        body: { return_to: returnTo },
      });
      if (error || !data?.url) throw new Error(error?.message || data?.error || "Could not start Google connection");
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start Google connection");
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase.from("admin_google_tokens").delete().eq("user_id", session.user.id);
    if (error) toast.error(error.message);
    else { toast.success("Google disconnected"); refresh(); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Google Calendar & Meet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Google account so the dashboard can create real Calendar events with Google Meet links and email invites to learners.
          </p>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : token ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">{token.email || "Connected"}</div>
                  <Badge variant="secondary" className="mt-1">Active</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={disconnect}>
                <Unplug className="w-3.5 h-3.5 mr-1" /> Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connect} disabled={connecting}>
              {connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</> : <>Connect Google account <ExternalLink className="w-4 h-4 ml-2" /></>}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            We request only Calendar event creation and basic profile scopes. You can disconnect at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
