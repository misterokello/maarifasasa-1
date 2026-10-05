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

const Body = z.object({ slug: z.string().trim().min(1).max(120) });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid request" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Only published, externally visible roles expose their JD document.
    const { data: job } = await supabase
      .from("job_postings")
      .select("jd_pdf_path, jd_pdf_name, status, internal_only")
      .eq("slug", parsed.data.slug)
      .maybeSingle();

    if (!job || job.status !== "published" || job.internal_only || !job.jd_pdf_path) {
      return json({ error: "Job description not available" }, 404);
    }

    const { data: signed, error } = await supabase.storage
      .from("recruitment")
      .createSignedUrl(job.jd_pdf_path, 60 * 10);

    if (error || !signed?.signedUrl) {
      console.error("signed url failed", error);
      return json({ error: "Could not prepare download" }, 500);
    }

    return json({ url: signed.signedUrl, filename: job.jd_pdf_name ?? "job-description.pdf" });
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
});
