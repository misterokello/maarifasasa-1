import { serviceClient } from "./engagement-auth.ts";

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

function thinkificToken(): string | null {
  const raw = Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific");
  const t = raw?.trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
  return t || null;
}

async function fetchAllUsers(token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  const collected: any[] = [];
  let page = 1;
  while (page <= 200) {
    const url = `${THINKIFIC_API_BASE}/users?page=${page}&limit=250`;
    const r = await fetch(url, { headers });
    if (!r.ok) break;
    const j = await r.json();
    const items = j?.items ?? [];
    collected.push(...items);
    if (items.length < 250) break;
    page++;
  }
  return collected
    .filter((u) => u?.email)
    .map((u) => ({
      email: u.email,
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
      user_id: u.id ? String(u.id) : null,
    }));
}

async function fetchCourseEnrollments(token: string, courseId: string) {
  const headers = { Authorization: `Bearer ${token}` };
  const collected: any[] = [];
  let page = 1;
  while (page <= 200) {
    const u = new URL(`${THINKIFIC_API_BASE}/enrollments`);
    u.searchParams.set("query[course_id]", String(courseId));
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", "250");
    const r = await fetch(u.toString(), { headers });
    if (!r.ok) break;
    const j = await r.json();
    const items = j?.items ?? [];
    collected.push(...items);
    if (items.length < 250) break;
    page++;
  }
  return collected
    .filter((e) => e?.user_email && String(e.course_id) === String(courseId))
    .map((e) => ({
      email: e.user_email,
      name: e.user_name || [e.first_name, e.last_name].filter(Boolean).join(" ") || null,
      user_id: e.user_id ? String(e.user_id) : null,
    }));
}

export async function materializeAudience(audienceId: string) {
  const sb = serviceClient();
  const { data: audience, error } = await sb.from("email_audiences").select("*").eq("id", audienceId).single();
  if (error || !audience) throw new Error("Audience not found");

  const token = thinkificToken();
  if (!token) throw new Error("Thinkific token not configured");

  let recipients: { email: string; name: string | null; user_id: string | null }[] = [];
  if (audience.type === "all_users") {
    recipients = await fetchAllUsers(token);
  } else if (audience.type === "course_enrollment") {
    if (!audience.course_id) throw new Error("course_id missing");
    recipients = await fetchCourseEnrollments(token, audience.course_id);
  } else if (audience.type === "custom_list") {
    recipients = (audience.filter?.recipients ?? []) as any[];
  }

  const seen = new Set<string>();
  recipients = recipients.filter((r) => {
    const k = r.email.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  await sb.from("email_audiences").update({
    member_count: recipients.length,
    last_refreshed_at: new Date().toISOString(),
  }).eq("id", audienceId);

  return recipients;
}