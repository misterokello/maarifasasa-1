// Admin-only bulk learner signup + onboarding.
// Accepts rows parsed from the downloadable template, creates auth accounts,
// fills onboarding profile data, optionally provisions Thinkific accounts and
// emails each learner a password-setup link.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { findOrCreateThinkificUser } from "../_shared/thinkificUsers.ts";
import { addUserToThinkificGroup, ensureThinkificGroup } from "../_shared/thinkificGroups.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://maarifasasa.com";
const FROM = "Maarifasasa <noreply@maarifasasa.com>";

const TEXT_FIELDS = [
  "first_name", "last_name", "preferred_name", "phone", "country", "district", "city",
  "location", "employment_status", "occupation", "employer", "years_experience",
  "highest_education", "current_skill_level", "desired_career_path", "preferred_schedule",
  "age_range", "gender", "disability_status", "refugee_status", "preferred_language",
  "referral_source", "scholarship_program", "organization", "job_title", "company",
] as const;

const ARRAY_FIELDS = ["career_interests", "interests", "learning_goals"] as const;

function esc(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function toList(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value !== "string") return null;
  const list = value.split(/[;,|]/).map((v) => v.trim()).filter(Boolean);
  return list.length ? list : null;
}

function welcomeHtml(name: string, actionLink: string) {
  return `<!DOCTYPE html><html><body style="font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.6;color:#1a1a2e;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:linear-gradient(135deg,#FF6B35 0%,#FF8C42 100%);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Your Maarifasasa account is ready</h1>
  </div>
  <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
    <p style="font-size:17px;margin-top:0;">Hi <strong>${esc(name || "there")}</strong>,</p>
    <p style="color:#555;">An account has been created for you on Maarifasasa — Knowledge Now. Opportunity Everywhere. Set your password to open your learner dashboard and start learning.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${esc(actionLink)}" style="display:inline-block;background:linear-gradient(135deg,#FF6B35 0%,#FF8C42 100%);color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">Create your password →</a>
    </p>
    <p style="color:#999;font-size:12px;">If this link expires, use "Forgot password" on ${SITE_URL}/auth with this email address.</p>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !user) return json({ error: "Invalid token" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles || []).some((r: any) => r.role === "admin" || r.role === "learner_admin");
    if (!allowed) return json({ error: "Learner admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const rows: any[] = Array.isArray(body?.learners) ? body.learners.slice(0, 250) : [];
    if (rows.length === 0) return json({ error: "No learner rows provided" }, 400);
    const sendInvites = body?.send_invites !== false;
    const provisionThinkific = body?.provision_thinkific !== false;
    const groupName = String(body?.group_name ?? "").trim();

    const thinkificToken = (Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific") ?? "")
      .trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;

    // Resolve (or create) the cohort group once for the whole batch.
    let resolvedGroup: string | null = null;
    let resolvedGroupId: number | null = null;
    let groupError: string | null = null;
    if (groupName && thinkificToken) {
      try {
        const group = await ensureThinkificGroup(thinkificToken, groupName);
        resolvedGroup = group.name || groupName;
        resolvedGroupId = group.id ?? null;
      } catch (e) {
        groupError = (e as Error).message;
        console.error("[admin-bulk-learners] group setup failed:", e);
      }
    }

    const results: any[] = [];

    for (const raw of rows) {
      const email = String(raw?.email ?? "").trim().toLowerCase();
      const rowLabel = raw?.row ?? null;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({ row: rowLabel, email, status: "failed", detail: "Invalid email address" });
        continue;
      }

      try {
        const firstName = String(raw.first_name ?? "").trim();
        const lastName = String(raw.last_name ?? "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ")
          || String(raw.full_name ?? "").trim()
          || email.split("@")[0];

        // Resolve or create the auth account.
        let userId: string | null = null;
        const { data: existingProfile } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
        userId = existingProfile?.id ?? null;
        let isNew = false;

        if (!userId) {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: fullName, bulk_imported: true },
          });
          if (createErr || !created?.user) throw new Error(createErr?.message || "Could not create the account");
          userId = created.user.id;
          isNew = true;
        }

        // Build the profile / onboarding payload.
        const profile: Record<string, unknown> = {
          id: userId,
          email,
          full_name: fullName,
          first_name: firstName || null,
          last_name: lastName || null,
        };
        for (const key of TEXT_FIELDS) {
          const value = raw[key];
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            profile[key] = String(value).trim();
          }
        }
        for (const key of ARRAY_FIELDS) {
          const list = toList(raw[key]);
          if (list) profile[key] = list;
        }
        if (!profile.location && (raw.city || raw.district || raw.country)) {
          profile.location = [raw.city, raw.district, raw.country].filter(Boolean).join(", ");
        }
        profile.onboarding_responses = { ...(raw.onboarding_responses ?? {}), source: "admin_bulk_import" };
        profile.profile_completed_at = new Date().toISOString();
        profile.updated_at = new Date().toISOString();

        const { error: profileErr } = await admin.from("profiles").upsert(profile, { onConflict: "id" });
        if (profileErr) throw new Error(profileErr.message);

        // Ensure a learner role exists.
        await admin.from("user_roles").upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

        // Thinkific provisioning (best effort).
        let thinkificUserId: number | null = null;
        if (provisionThinkific && thinkificToken) {
          try {
            const { userId: tId } = await findOrCreateThinkificUser(
              thinkificToken,
              email,
              firstName || fullName.split(" ")[0] || email.split("@")[0],
              lastName || "",
              profile as any,
            );
            thinkificUserId = tId;
            await admin.from("profiles").update({
              thinkific_user_id: tId,
              thinkific_synced_at: new Date().toISOString(),
            }).eq("id", userId);
          } catch (e) {
            console.error("[admin-bulk-learners] thinkific failed for", email, e);
          }
        }

        // Cohort group membership (best effort).
        let addedToGroup = false;
        if (resolvedGroup && thinkificUserId) {
          try {
            await addUserToThinkificGroup(thinkificToken, resolvedGroup, thinkificUserId);
            addedToGroup = true;
          } catch (e) {
            console.error("[admin-bulk-learners] group add failed for", email, e);
          }
        }

        // Record group membership locally so partner portals can report on it.
        if (resolvedGroup) {
          const { error: memberErr } = await admin.from("partner_group_members").upsert({
            thinkific_group_name: resolvedGroup,
            thinkific_group_id: resolvedGroupId,
            user_id: userId,
            email,
            full_name: fullName,
            thinkific_user_id: thinkificUserId,
            source: "bulk_import",
            added_by: user.id,
          }, { onConflict: "thinkific_group_name,email" });
          if (memberErr) {
            console.error("[admin-bulk-learners] member record failed for", email, memberErr.message);
          }
        }

        // Password setup email (best effort).
        let invited = false;
        if (sendInvites && resend) {
          try {
            const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
              type: "recovery",
              email,
              options: { redirectTo: `${SITE_URL}/reset-password` },
            });
            if (linkErr || !link?.properties?.action_link) throw new Error(linkErr?.message || "link failed");
            const { error: sendErr } = await resend.emails.send({
              from: FROM,
              to: [email],
              subject: "Your Maarifasasa learner account is ready",
              html: welcomeHtml(fullName, link.properties.action_link),
            });
            if (sendErr) throw new Error(typeof sendErr === "string" ? sendErr : JSON.stringify(sendErr));
            invited = true;
          } catch (e) {
            console.error("[admin-bulk-learners] invite failed for", email, e);
          }
        }

        results.push({
          row: rowLabel,
          email,
          status: isNew ? "created" : "updated",
          invited,
          thinkific_user_id: thinkificUserId,
          group: addedToGroup ? resolvedGroup : null,
        });
      } catch (e) {
        console.error("[admin-bulk-learners] row failed for", email, e);
        results.push({ row: rowLabel, email, status: "failed", detail: (e as Error).message });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      failed: results.filter((r) => r.status === "failed").length,
      invited: results.filter((r) => r.invited).length,
      grouped: results.filter((r) => r.group).length,
    };
    return json({ success: true, summary, results, group: resolvedGroup, group_error: groupError });
  } catch (e) {
    console.error("[admin-bulk-learners] fatal:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
