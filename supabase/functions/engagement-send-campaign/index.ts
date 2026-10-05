import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders, verifyAdmin, serviceClient } from "../_shared/engagement-auth.ts";
import { materializeAudience } from "../_shared/engagement-audiences.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

function firstName(name: string | null | undefined): string {
  if (!name) return "there";
  return name.split(/\s+/)[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!Deno.env.get("RESEND_API_KEY")) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = serviceClient();
  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const { campaign_id, test_email } = body;
  if (!campaign_id) {
    return new Response(JSON.stringify({ error: "campaign_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: campaign, error: cErr } = await sb.from("email_campaigns").select("*").eq("id", campaign_id).single();
  if (cErr || !campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve recipients
  let recipients: { email: string; name: string | null; user_id: string | null }[] = [];
  if (test_email) {
    recipients = [{ email: test_email, name: "Test recipient", user_id: null }];
  } else {
    if (!campaign.audience_id) {
      return new Response(JSON.stringify({ error: "Campaign has no audience" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    recipients = await materializeAudience(campaign.audience_id);
  }

  if (recipients.length === 0) {
    return new Response(JSON.stringify({ error: "No recipients" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const fromName = campaign.from_name || "Maarifasasa";
  const fromAddr = `${fromName} <onboarding@resend.dev>`;

  if (!test_email) {
    await sb.from("email_campaigns").update({
      status: "sending",
      recipient_count: recipients.length,
    }).eq("id", campaign_id);

    // Insert recipient rows
    const rows = recipients.map((r) => ({
      campaign_id, email: r.email, name: r.name, user_id: r.user_id, status: "queued",
    }));
    // batch insert in chunks of 500
    for (let i = 0; i < rows.length; i += 500) {
      await sb.from("email_campaign_recipients").insert(rows.slice(i, i + 500));
    }
  }

  // Send loop with small concurrency
  const concurrency = 5;
  let sent = 0, failed = 0;
  const errors: string[] = [];

  const sendOne = async (r: typeof recipients[number]) => {
    const vars = {
      first_name: firstName(r.name),
      full_name: r.name || "",
      email: r.email,
      course_name: campaign.tags?.[0] || "",
      cta_url: "https://maarifasasa.com/dashboard",
    };
    const subject = renderTemplate(campaign.subject, vars);
    const html = renderTemplate(campaign.body_html, vars);
    const text = campaign.body_text ? renderTemplate(campaign.body_text, vars) : undefined;
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddr,
        to: [r.email],
        subject: test_email ? `[TEST] ${subject}` : subject,
        html,
        text,
        reply_to: campaign.reply_to || undefined,
        tags: [{ name: "campaign_id", value: campaign_id }],
      });
      if (error) throw new Error(error.message || "Send failed");
      sent++;
      if (!test_email) {
        await sb.from("email_campaign_recipients").update({
          status: "sent",
          resend_id: (data as any)?.id ?? null,
          sent_at: new Date().toISOString(),
        }).eq("campaign_id", campaign_id).eq("email", r.email);
      }
    } catch (e) {
      failed++;
      const msg = (e as Error).message;
      errors.push(`${r.email}: ${msg}`);
      if (!test_email) {
        await sb.from("email_campaign_recipients").update({
          status: "failed", error_message: msg,
        }).eq("campaign_id", campaign_id).eq("email", r.email);
      }
    }
  };

  for (let i = 0; i < recipients.length; i += concurrency) {
    const slice = recipients.slice(i, i + concurrency);
    await Promise.all(slice.map(sendOne));
  }

  if (!test_email) {
    await sb.from("email_campaigns").update({
      status: failed === recipients.length ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed,
    }).eq("id", campaign_id);
  }

  return new Response(JSON.stringify({
    ok: true, sent, failed, total: recipients.length, errors: errors.slice(0, 10),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});