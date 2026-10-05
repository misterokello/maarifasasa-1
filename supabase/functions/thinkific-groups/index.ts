// Lists and creates Thinkific groups for learner-admin bulk onboarding.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createThinkificGroup,
  listThinkificGroups,
  readThinkificToken,
} from "../_shared/thinkificGroups.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: { user }, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !user) return json({ error: "Invalid token" }, 401);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles || []).some((r: any) => r.role === "admin" || r.role === "learner_admin");
    if (!allowed) return json({ error: "Learner admin access required" }, 403);

    const apiKey = readThinkificToken();
    if (!apiKey) return json({ error: "Academy API key is not configured" }, 400);

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const name = String(body?.name ?? "").trim();
      if (name.length < 2 || name.length > 120) {
        return json({ error: "Group name must be between 2 and 120 characters" }, 400);
      }
      const group = await createThinkificGroup(apiKey, name);
      return json({ success: true, group });
    }

    const groups = await listThinkificGroups(apiKey);
    return json({
      success: true,
      groups: groups
        .map((g) => ({ id: g.id, name: g.name, users_count: g.users_count ?? null }))
        .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    });
  } catch (e) {
    console.error("[thinkific-groups] error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
