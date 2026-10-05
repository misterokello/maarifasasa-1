// Org-wide Thinkific completion sync.
//
// Pulls every Thinkific enrollment for the school (paginated) and refreshes
// public.enrollments with progress_percent / completed_at so the admin
// dashboard can measure course outcomes (who completed which course).
//
// Auth: admin (or learner_admin) user JWT, OR the CRON_SECRET header for
// scheduled runs.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret",
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";
const MAX_PAGES = 100;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getThinkificToken(): string | null {
  const raw = Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific");
  const t = raw?.trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
  return t || null;
}

function normalizePct(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // --- Authorization -------------------------------------------------
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
    const provided = req.headers.get("x-cron-secret") ?? req.headers.get("x-internal-secret") ?? "";
    let authorized =
      !!provided &&
      ((!!cronSecret && constantTimeEq(cronSecret, provided)) ||
        (!!internalSecret && constantTimeEq(internalSecret, provided)));

    if (!authorized) {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) return json({ error: "Invalid session" }, 401);
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      authorized = (roles || []).some((r: any) => r.role === "admin" || r.role === "learner_admin");
      if (!authorized) return json({ error: "Forbidden" }, 403);
    }

    const token = getThinkificToken();
    if (!token) return json({ error: "Thinkific token not configured" }, 500);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // --- Local lookup maps ---------------------------------------------
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, thinkific_user_id")
      .not("thinkific_user_id", "is", null);
    const userByThinkificId = new Map<string, string>();
    (profiles || []).forEach((p: any) => {
      if (p.thinkific_user_id) userByThinkificId.set(String(p.thinkific_user_id), p.id);
    });

    if (!userByThinkificId.size) return json({ synced: 0, reason: "no_linked_learners" });

    const { data: products } = await admin
      .from("products")
      .select("id, thinkific_course_id")
      .not("thinkific_course_id", "is", null);
    const productByCourse = new Map<string, string>();
    (products || []).forEach((p: any) => {
      productByCourse.set(String(p.thinkific_course_id), p.id);
    });

    const { data: existing } = await admin
      .from("enrollments")
      .select("id, user_id, thinkific_enrollment_id, thinkific_course_id, metadata");
    const existingByEnrollment = new Map<string, any>();
    const existingByUserCourse = new Map<string, any>();
    (existing || []).forEach((row: any) => {
      if (row.thinkific_enrollment_id) {
        existingByEnrollment.set(String(row.thinkific_enrollment_id), row);
      }
      if (row.thinkific_course_id) {
        existingByUserCourse.set(`${row.user_id}:${row.thinkific_course_id}`, row);
      }
    });

    // --- Pull all Thinkific enrollments --------------------------------
    const nowIso = new Date().toISOString();
    let page = 1;
    let scanned = 0;
    let updated = 0;
    let created = 0;
    let skipped = 0;
    let completedCount = 0;

    while (page <= MAX_PAGES) {
      const u = new URL(`${THINKIFIC_API_BASE}/enrollments`);
      u.searchParams.set("page", String(page));
      u.searchParams.set("limit", "100");
      const r = await fetch(u.toString(), { headers });
      if (!r.ok) {
        const text = await r.text();
        console.error("[thinkific-completion-sync] fetch failed", r.status, text);
        return json({ error: "thinkific_fetch_failed", status: r.status, details: text.slice(0, 300) }, 502);
      }
      const d = await r.json();
      const items: any[] = d.items || [];

      for (const en of items) {
        scanned++;
        const localUserId = userByThinkificId.get(String(en.user_id ?? ""));
        if (!localUserId) {
          skipped++;
          continue;
        }
        const courseId = en.course_id ? String(en.course_id) : null;
        const pct = normalizePct(en.percentage_completed);
        const completed = en.completed === true || pct >= 100 || !!en.completed_at;
        if (completed) completedCount++;

        const base: Record<string, any> = {
          user_id: localUserId,
          product_id: courseId ? productByCourse.get(courseId) ?? null : null,
          thinkific_course_id: courseId,
          thinkific_enrollment_id: Number(en.id),
          status: "active",
          progress_percent: pct,
          completed_at: completed ? en.completed_at || nowIso : null,
          activated_at: en.activated_at || en.started_at || en.created_at || nowIso,
          last_synced_at: nowIso,
        };

        const row =
          existingByEnrollment.get(String(en.id)) ||
          (courseId ? existingByUserCourse.get(`${localUserId}:${courseId}`) : null);

        if (row) {
          const { error } = await admin
            .from("enrollments")
            .update({
              ...base,
              metadata: {
                ...(row.metadata || {}),
                thinkific_course_name: en.course_name,
                synced_by: "completion_sync",
              },
            })
            .eq("id", row.id);
          if (error) console.error("[thinkific-completion-sync] update failed", error.message);
          else updated++;
        } else {
          const { error } = await admin.from("enrollments").insert({
            ...base,
            metadata: {
              source: "thinkific_completion_sync",
              thinkific_course_name: en.course_name,
              thinkific_user_id: en.user_id,
            },
          });
          if (error) console.error("[thinkific-completion-sync] insert failed", error.message);
          else created++;
        }
      }

      const totalPages = d.meta?.pagination?.total_pages || 1;
      if (page >= totalPages || items.length === 0) break;
      page++;
    }

    return json({
      scanned,
      created,
      updated,
      skipped_unlinked: skipped,
      completed_seen: completedCount,
      synced_at: nowIso,
    });
  } catch (e: any) {
    console.error("[thinkific-completion-sync] unhandled", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});
