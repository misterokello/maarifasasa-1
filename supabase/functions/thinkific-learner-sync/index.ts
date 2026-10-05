// Learner-scoped Thinkific sync.
//
// Reads every Thinkific enrollment for the CURRENT authenticated learner
// (identified by profiles.thinkific_user_id) and upserts a matching row
// into public.enrollments — so admin-provisioned, imported or gifted
// seats show up on /dashboard alongside paid cloud enrollments.
//
// Progress percent and completed_at are refreshed on every call so the
// dashboard reflects the latest Thinkific state without needing the
// admin sync worker to run.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify caller via their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // Service-role client for writing enrollments (RLS bypass, scoped to this user id)
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await admin
      .from("profiles")
      .select("thinkific_user_id, email")
      .eq("id", user.id)
      .maybeSingle();

    const thinkificUserId = profile?.thinkific_user_id
      ? Number(profile.thinkific_user_id)
      : null;

    if (!thinkificUserId) {
      // No linked Thinkific account yet — nothing to pull. Not an error.
      return new Response(
        JSON.stringify({ synced: 0, reason: "no_thinkific_account" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = getThinkificToken();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Thinkific token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Pull ALL Thinkific enrollments for this learner (paginated).
    const enrollments: any[] = [];
    let page = 1;
    while (true) {
      const u = new URL(`${THINKIFIC_API_BASE}/enrollments`);
      u.searchParams.set("query[user_id]", String(thinkificUserId));
      u.searchParams.set("page", String(page));
      u.searchParams.set("limit", "100");
      const r = await fetch(u.toString(), { headers });
      if (!r.ok) {
        const errText = await r.text();
        console.error("[thinkific-learner-sync] enrollments fetch failed", r.status, errText);
        return new Response(
          JSON.stringify({ error: "thinkific_fetch_failed", status: r.status, details: errText.slice(0, 300) }),
          { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const d = await r.json();
      const items = d.items || [];
      enrollments.push(...items);
      const total = d.meta?.pagination?.total_pages || 1;
      if (page >= total || items.length === 0) break;
      page++;
      if (page > 20) break;
    }

    if (!enrollments.length) {
      return new Response(
        JSON.stringify({ synced: 0, thinkific_user_id: thinkificUserId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Map Thinkific course_id -> local product row so we can attach product_id.
    const courseIds = [
      ...new Set(enrollments.map((e) => String(e.course_id)).filter(Boolean)),
    ];
    const { data: products } = await admin
      .from("products")
      .select("id, thinkific_course_id")
      .in("thinkific_course_id", courseIds);
    const productByCourse = new Map<string, string>();
    (products || []).forEach((p: any) => {
      if (p.thinkific_course_id) productByCourse.set(String(p.thinkific_course_id), p.id);
    });

    // Course artwork + metadata straight from Thinkific so the learner
    // dashboard can render real course graphics.
    const courseInfo = new Map<string, { image: string | null; name: string | null; url: string | null }>();
    await Promise.all(
      courseIds.map(async (cid) => {
        try {
          const r = await fetch(`${THINKIFIC_API_BASE}/courses/${cid}`, { headers });
          if (!r.ok) return;
          const c = await r.json();
          courseInfo.set(cid, {
            image: c.course_card_image_url || c.banner_image_url || null,
            name: c.name || null,
            url: c.course_url || null,
          });
        } catch (_e) {
          /* non-fatal */
        }
      }),
    );


    // Existing local enrollments for this user, keyed by thinkific_enrollment_id.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id, thinkific_enrollment_id, metadata")
      .eq("user_id", user.id);
    const existingByEnrollmentId = new Map<number, any>();
    (existing || []).forEach((row: any) => {
      if (row.thinkific_enrollment_id) {
        existingByEnrollmentId.set(Number(row.thinkific_enrollment_id), row);
      }
    });

    let synced = 0;
    let created = 0;
    const nowIso = new Date().toISOString();

    for (const en of enrollments) {
      const tEnrollmentId = Number(en.id);
      const courseId = String(en.course_id ?? "");
      const pct = normalizePct(en.percentage_completed);
      const completed = en.completed === true || pct >= 100 || !!en.completed_at;
      const productId = productByCourse.get(courseId) || null;
      const info = courseInfo.get(courseId);

      const base = {
        user_id: user.id,
        product_id: productId,
        thinkific_course_id: courseId || null,
        thinkific_enrollment_id: tEnrollmentId,
        status: "active",
        progress_percent: pct,
        completed_at: completed ? (en.completed_at || nowIso) : null,
        activated_at: en.activated_at || en.started_at || en.created_at || nowIso,
        last_synced_at: nowIso,
      };

      const existingRow = existingByEnrollmentId.get(tEnrollmentId);
      if (existingRow) {
        await admin
          .from("enrollments")
          .update({
            ...base,
            metadata: {
              ...(existingRow.metadata || {}),
              thinkific_course_name: en.course_name || info?.name || null,
              thinkific_course_image_url: info?.image || null,
              thinkific_course_url: info?.url || null,
              thinkific_user_id: thinkificUserId,
              synced_by: "learner_sync",
            },
          })
          .eq("id", existingRow.id);
      } else {
        await admin.from("enrollments").insert({
          ...base,
          metadata: {
            source: "thinkific_learner_sync",
            thinkific_course_name: en.course_name || info?.name || null,
            thinkific_course_image_url: info?.image || null,
            thinkific_course_url: info?.url || null,
            thinkific_user_id: thinkificUserId,
          },
        });
        created++;
      }
      synced++;
    }

    // Refresh sync marker on profile
    await admin
      .from("profiles")
      .update({ thinkific_synced_at: nowIso })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        synced,
        created,
        thinkific_user_id: thinkificUserId,
        total_thinkific_enrollments: enrollments.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("[thinkific-learner-sync] unhandled error", e);
    return new Response(
      JSON.stringify({ error: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});