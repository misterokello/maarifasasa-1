import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const Body = z.object({
  job_posting_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  location: z.string().trim().max(120).optional().nullable(),
  cover_letter: z.string().trim().max(5000).optional().nullable(),
  portfolio_url: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
  resume_path: z.string().trim().min(3).max(500),
  retain_for_future: z.boolean().optional(),
  consent_data_retention: z.literal(true),
});

// Fixed-window limits for the public application endpoint.
const IP_LIMIT = { max: 5, windowSeconds: 3600 };
const EMAIL_LIMIT = { max: 3, windowSeconds: 86400 };

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const first = fwd.split(",")[0]?.trim();
  return first || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid application", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const input = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cleanupResume = async () => {
      await supabase.storage.from("recruitment").remove([input.resume_path]).catch(() => {});
    };

    // Rate limit: per-IP first, then per-email.
    const checks: Array<{ scope: string; identifier: string; max: number; windowSeconds: number }> = [
      { scope: "careers_apply_ip", identifier: await hash(clientIp(req)), ...IP_LIMIT },
      { scope: "careers_apply_email", identifier: await hash(input.email.toLowerCase()), ...EMAIL_LIMIT },
    ];

    for (const check of checks) {
      const { data, error } = await supabase.rpc("consume_rate_limit", {
        _scope: check.scope,
        _identifier: check.identifier,
        _max_requests: check.max,
        _window_seconds: check.windowSeconds,
      });
      if (error) {
        console.error("rate limit check failed", check.scope, error);
        continue; // fail open rather than blocking genuine applicants
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row && row.allowed === false) {
        await cleanupResume();
        return new Response(
          JSON.stringify({
            error: "Too many applications submitted. Please try again later.",
            retry_after_seconds: row.retry_after_seconds ?? check.windowSeconds,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": String(row.retry_after_seconds ?? check.windowSeconds),
            },
          },
        );
      }
    }

    // The role must exist, be published, and accept the internal form.
    const { data: job } = await supabase
      .from("job_postings")
      .select("id, status, application_mode, closes_at")
      .eq("id", input.job_posting_id)
      .maybeSingle();

    if (!job || job.status !== "published" || job.application_mode !== "internal_form") {
      await cleanupResume();
      return json({ error: "This role is not accepting applications." }, 400);
    }
    if (job.closes_at && new Date(job.closes_at) < new Date()) {
      await cleanupResume();
      return json({ error: "Applications for this role have closed." }, 400);
    }

    const applicationId = crypto.randomUUID();
    const { error: insErr } = await supabase.from("job_applications").insert({
      id: applicationId,
      job_posting_id: input.job_posting_id,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      location: input.location || null,
      cover_letter: input.cover_letter || null,
      portfolio_url: input.portfolio_url || null,
      resume_path: input.resume_path,
      consent_data_retention: true,
      retain_for_future: input.retain_for_future ?? false,
      source: "website",
    });
    if (insErr) {
      console.error("application insert failed", insErr);
      await cleanupResume();
      return json({ error: "Could not submit application" }, 500);
    }

    await supabase.functions
      .invoke("careers-apply-notify", { body: { application_id: applicationId } })
      .catch((e) => console.error("notify failed", e));

    return json({ ok: true, application_id: applicationId });
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
});
