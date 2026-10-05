import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_OAUTH_CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
const GOOGLE_OAUTH_CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

// Parse "10:00 AM - 10:30 AM" or "10:00 AM" → { start, end }
function parseTimeWindow(timeStr: string, dateStr: string, tz: string): { startISO: string; endISO: string } | null {
  try {
    const parts = timeStr.split("-").map((s) => s.trim());
    const start24 = to24h(parts[0]);
    const end24 = parts[1] ? to24h(parts[1]) : add30(start24);
    if (!start24 || !end24) return null;
    // We send local time strings + timeZone to Google
    return {
      startISO: `${dateStr}T${start24}:00`,
      endISO: `${dateStr}T${end24}:00`,
    };
  } catch {
    return null;
  }
}

function to24h(s: string): string | null {
  const m = s.toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3];
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function add30(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + 30;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

async function ensureFreshToken(supabase: any, userId: string) {
  const { data: row, error } = await supabase
    .from("admin_google_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !row) return { error: "google_not_connected" as const };

  const expiry = new Date(row.expiry).getTime();
  if (Date.now() < expiry - 60_000) return { token: row.access_token };

  // refresh
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const j = await res.json();
  if (!res.ok || !j.access_token) {
    console.error("refresh failed", j);
    return { error: "google_refresh_failed" as const };
  }
  const newExpiry = new Date(Date.now() + (j.expires_in - 30) * 1000).toISOString();
  await supabase
    .from("admin_google_tokens")
    .update({ access_token: j.access_token, expiry: newExpiry })
    .eq("user_id", userId);
  return { token: j.access_token as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Always return 200 with structured payload so the supabase-js client
  // does not swallow the real error message ("non-2xx status code").
  const ok = (payload: Record<string, unknown>) =>
    new Response(JSON.stringify({ ok: true, ...payload }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  const fail = (error: string, extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ ok: false, error, ...extra }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return fail("Unauthorized");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const adminId = userData?.user?.id;
    if (userErr || !adminId) {
      return fail("Invalid token");
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return fail("Forbidden — admin role required");
    }

    const body = await req.json();
    const { request_id, send_invite = true, admin_notes, mode = "schedule", event_id: existingEventId } = body || {};
    if (!request_id) {
      return fail("request_id required");
    }

    const { data: mcr, error: mcrErr } = await supabase
      .from("mentor_call_requests")
      .select("*")
      .eq("id", request_id)
      .maybeSingle();
    if (mcrErr || !mcr) {
      return fail("request not found");
    }

    const tz = mcr.timezone || "Africa/Kampala";
    const win = parseTimeWindow(mcr.preferred_time, mcr.preferred_date, tz);
    if (!win) {
      return fail("could not parse preferred time");
    }

    const tok = await ensureFreshToken(supabase, adminId);
    if ("error" in tok) {
      return fail(
        tok.error === "google_not_connected"
          ? "Google Calendar isn't connected. Connect it in Advisor → Settings."
          : "Google token refresh failed — please reconnect Google in Advisor → Settings."
      );
    }

    // ----- mode: cancel preview -----
    if (mode === "cancel_preview" && existingEventId) {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(existingEventId)}?sendUpdates=none`,
        { method: "DELETE", headers: { Authorization: `Bearer ${tok.token}` } }
      ).catch(() => {});
      return ok({ cancelled: true });
    }

    const event = {
      summary: `Maarifasasa Advisor Mentor Call — ${mcr.full_name}`,
      description:
        `Mentor call requested via the Maarifasasa Pathway Advisor.\n\n` +
        (mcr.topic ? `Topic: ${mcr.topic}\n` : "") +
        (mcr.notes ? `Notes from learner: ${mcr.notes}\n` : "") +
        (admin_notes ? `\nAdmin notes: ${admin_notes}\n` : "") +
        (mcr.assessment_id ? `\nAssessment: ${mcr.assessment_id}` : ""),
      start: { dateTime: win.startISO, timeZone: tz },
      end: { dateTime: win.endISO, timeZone: tz },
      attendees: send_invite
        ? [{ email: mcr.email, displayName: mcr.full_name, responseStatus: "needsAction" }]
        : [],
      conferenceData: {
        createRequest: {
          requestId: `ms-${request_id}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: { useDefault: true },
    };

    // ----- mode: preview -----
    // Creates the event in the admin's primary calendar but does NOT notify the learner.
    // The admin sees a real Meet link + event details and can either confirm or cancel.
    let eventId = existingEventId as string | undefined;
    let meetLink = "";
    let calJson: any = null;

    if (mode === "preview" || (mode === "schedule" && !existingEventId)) {
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=none`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tok.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...event, attendees: [] }),
        }
      );
      calJson = await calRes.json();
      if (!calRes.ok) {
        console.error("calendar create failed", calJson);
        const gmsg = calJson?.error?.message || "Google Calendar rejected the create request";
        return fail(`Google Calendar create failed: ${gmsg}`, { details: calJson });
      }
      eventId = calJson.id;
      meetLink =
        calJson.hangoutLink ||
        calJson?.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ||
        "";
    }

    // For preview, return the details without persisting/notifying
    if (mode === "preview") {
      return ok({
        preview: true,
        event_id: eventId,
        meet_link: meetLink,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        attendees: send_invite ? [{ email: mcr.email, displayName: mcr.full_name }] : [],
        html_link: calJson?.htmlLink || null,
      });
    }

    // ----- mode: schedule (confirm) -----
    if (eventId && send_invite) {
      // Try PATCHing the previewed event to add attendees & send invites.
      let patchRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1&sendUpdates=all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tok.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attendees: [{ email: mcr.email, displayName: mcr.full_name, responseStatus: "needsAction" }],
          }),
        }
      );
      let patchJson: any = await patchRes.json().catch(() => ({}));

      // If the previewed event was deleted/expired (404 / 410), recreate it
      // with attendees attached in a single POST.
      if (!patchRes.ok && (patchRes.status === 404 || patchRes.status === 410)) {
        console.warn("preview event missing, recreating", patchJson);
        const reRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tok.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          }
        );
        const reJson = await reRes.json().catch(() => ({}));
        if (!reRes.ok) {
          const gmsg = reJson?.error?.message || "Google Calendar rejected the recreate request";
          return fail(`Could not recreate calendar event: ${gmsg}`, { details: reJson });
        }
        eventId = reJson.id;
        meetLink =
          reJson.hangoutLink ||
          reJson?.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ||
          meetLink;
      } else if (!patchRes.ok) {
        console.error("calendar patch failed", patchJson);
        const gmsg = patchJson?.error?.message || "Google Calendar rejected the update";
        return fail(`Calendar update failed: ${gmsg}`, { details: patchJson });
      } else {
        meetLink =
          patchJson.hangoutLink ||
          patchJson?.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ||
          meetLink;
      }
    }

    const { error: updErr } = await supabase
      .from("mentor_call_requests")
      .update({
        status: "scheduled",
        meet_link: meetLink,
        calendar_event_id: eventId,
        scheduled_by: adminId,
        scheduled_at: new Date().toISOString(),
        admin_notes: admin_notes ?? mcr.admin_notes,
      })
      .eq("id", request_id);
    if (updErr) console.error("update mcr failed", updErr);

    // Branded confirmation email
    if (RESEND_API_KEY && send_invite) {
      try {
        const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0F172A;font-family:Inter,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:32px 16px;"><tr><td align="center">
          <table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
            <tr><td style="padding:32px;background:linear-gradient(135deg,#6366F1,#8B5CF6,#14B8A6);color:#fff;">
              <h1 style="margin:0;font-size:22px;">Your mentor call is confirmed ✅</h1>
              <p style="margin:8px 0 0;opacity:0.95;">Hi ${escapeHtml(mcr.full_name)}, see you soon.</p>
            </td></tr>
            <tr><td style="padding:24px 32px;color:#0F172A;">
              <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
                <tr><td style="padding:8px 0;color:#64748B;font-size:13px;">Date</td><td style="padding:8px 0;font-weight:600;text-align:right;">${escapeHtml(mcr.preferred_date)}</td></tr>
                <tr><td style="padding:8px 0;color:#64748B;font-size:13px;border-top:1px solid #E2E8F0;">Time</td><td style="padding:8px 0;font-weight:600;text-align:right;border-top:1px solid #E2E8F0;">${escapeHtml(mcr.preferred_time)} (${escapeHtml(tz)})</td></tr>
                ${mcr.topic ? `<tr><td style="padding:8px 0;color:#64748B;font-size:13px;border-top:1px solid #E2E8F0;">Topic</td><td style="padding:8px 0;font-weight:600;text-align:right;border-top:1px solid #E2E8F0;">${escapeHtml(mcr.topic)}</td></tr>` : ""}
              </table>
              <a href="${escapeHtml(meetLink)}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#14B8A6);color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;">Join Google Meet</a>
              <p style="margin:16px 0 0;font-size:13px;color:#64748B;">A calendar invitation has also been sent to your email. If you need to reschedule, just reply.</p>
            </td></tr>
            <tr><td style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;">
              Maarifasasa — Knowledge Now. Opportunity Everywhere.
            </td></tr>
          </table>
        </td></tr></table></body></html>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Maarifasasa Advisor <hello@maarifasasa.com>",
            to: [mcr.email],
            subject: "Your mentor call is confirmed — Maarifasasa",
            html,
          }),
        });
      } catch (e) {
        console.warn("confirmation email failed", e);
      }
    }

    return ok({ meet_link: meetLink, event_id: eventId });
  } catch (e) {
    console.error("admin-mentor-schedule error", e);
    return new Response(
      JSON.stringify({ ok: false, error: String((e as Error).message) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
