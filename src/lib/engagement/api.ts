import { supabase } from "@/integrations/supabase/client";

export type EmailTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subject: string;
  preheader: string | null;
  body_html: string;
  body_text: string | null;
  variables: string[];
  is_system: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailAudience = {
  id: string;
  name: string;
  description: string | null;
  type: "all_users" | "course_enrollment" | "custom_list";
  course_id: string | null;
  course_name: string | null;
  member_count: number;
  last_refreshed_at: string | null;
  archived: boolean;
  created_at: string;
};

export type EmailCampaign = {
  id: string;
  name: string;
  template_id: string | null;
  audience_id: string | null;
  subject: string;
  preheader: string | null;
  body_html: string;
  body_text: string | null;
  from_name: string | null;
  reply_to: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "failed" | "cancelled";
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  complained_count: number;
  failed_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export const listTemplates = () =>
  supabase.from("email_templates").select("*").eq("archived", false).order("is_system", { ascending: false }).order("name");

export const listAudiences = () =>
  supabase.from("email_audiences").select("*").eq("archived", false).order("created_at", { ascending: false });

export const listCampaigns = () =>
  supabase.from("email_campaigns").select("*").order("created_at", { ascending: false });

export async function refreshAudience(audienceId: string, preview = false) {
  const { data, error } = await supabase.functions.invoke("engagement-audience-refresh", {
    body: { audience_id: audienceId, preview },
  });
  if (error) throw error;
  return data as { member_count: number; recipients?: { email: string; name: string | null }[] };
}

export async function sendCampaign(campaignId: string, testEmail?: string) {
  const { data, error } = await supabase.functions.invoke("engagement-send-campaign", {
    body: { campaign_id: campaignId, test_email: testEmail },
  });
  if (error) throw error;
  return data as { ok: boolean; sent: number; failed: number; total: number; errors: string[] };
}

export async function fetchResendStatus() {
  const { data, error } = await supabase.functions.invoke("engagement-resend-status");
  if (error) throw error;
  return data as {
    domains: Array<{ id: string; name: string; status: string; region?: string }>;
    domainError: string | null;
    sentLast30: number;
    bouncedLast30: number;
    docs: { pricing: string; limits: string };
    notes: string;
  };
}

export function campaignRate(part: number, whole: number): string {
  if (!whole) return "—";
  return `${((part / whole) * 100).toFixed(1)}%`;
}