/**
 * affiliate-proxy
 *
 * Server-side proxy that forwards requests to the external
 * Maarifasasa Affiliates system so the affiliate anon key
 * is never exposed in the browser.
 *
 * Supported actions:
 *   - attribute-signup  → POST /attribute-signup
 *   - track-conversion  → POST /track-conversion
 *   - iotec-webhook     → POST /iotec-webhook
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/** The read-through 'rest' action exposes partner data — admins only. */
async function isAffiliateAdmin(req: Request): Promise<boolean> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  for (const role of ["admin", "affiliate_admin"]) {
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: role });
    if (data === true) return true;
  }
  return false;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AFFILIATE_BASE_URL =
  "https://ujbzhauwcdmtdegthwbf.supabase.co/functions/v1";
const AFFILIATE_REST_URL =
  "https://ujbzhauwcdmtdegthwbf.supabase.co/rest/v1";

// Tables on the external affiliate platform that we allow read-through to.
// We try multiple plausible names per resource because the platform schema is
// authored separately from this project.
const READ_TABLES: Record<string, string[]> = {
  affiliates: ["affiliates"],
  links: ["affiliate_links", "links"],
  clicks: ["referral_clicks", "affiliate_clicks", "clicks"],
  conversions: ["affiliate_conversions", "conversions", "orders"],
  commissions: ["affiliate_commissions", "commissions"],
};

const ALLOWED_ACTIONS: Record<string, string> = {
  "attribute-signup": "/attribute-signup",
  "track-conversion": "/track-conversion",
  "iotec-webhook": "/iotec-webhook",
};

async function forwardToAffiliate(
  path: string,
  body: unknown,
  retries = 2
): Promise<{ status: number; data: unknown }> {
  const anonKey = Deno.env.get("AFFILIATE_SYSTEM_ANON_KEY");
  if (!anonKey) {
    console.error("[affiliate-proxy] AFFILIATE_SYSTEM_ANON_KEY not configured");
    return { status: 500, data: { error: "Affiliate system not configured" } };
  }

  const url = `${AFFILIATE_BASE_URL}${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      // Retry only on 5xx
      if (res.status >= 500 && attempt < retries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s
        console.warn(
          `[affiliate-proxy] ${path} returned ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return { status: res.status, data };
    } catch (err) {
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        console.warn(
          `[affiliate-proxy] Network error for ${path}, retrying in ${delay}ms`,
          err
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error(`[affiliate-proxy] Final failure for ${path}:`, err);
      return { status: 502, data: { error: "Failed to reach affiliate system" } };
    }
  }

  return { status: 502, data: { error: "Exhausted retries" } };
}

/**
 * Read-through to the external affiliate platform's PostgREST.
 * Tries each candidate table name in order and returns the first 2xx.
 */
async function fetchAffiliateTable(
  resource: string,
  query: string,
  wantCount: boolean,
): Promise<{ status: number; data: unknown; table?: string; total?: number | null }> {
  const anonKey = Deno.env.get("AFFILIATE_SYSTEM_ANON_KEY");
  if (!anonKey) {
    return { status: 500, data: { error: "Affiliate system not configured" } };
  }
  const candidates = READ_TABLES[resource];
  if (!candidates) {
    return { status: 400, data: { error: `Unknown resource: ${resource}` } };
  }
  let lastStatus = 404;
  let lastBody: unknown = { error: "No matching table" };
  for (const table of candidates) {
    const url = `${AFFILIATE_REST_URL}/${table}?${query}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Accept: "application/json",
          ...(wantCount ? { Prefer: "count=exact" } : {}),
        },
      });
      const text = await res.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = { raw: text };
      }
      if (res.ok) {
        let total: number | null = null;
        const cr = res.headers.get("content-range"); // "0-9/123"
        if (cr) {
          const m = cr.match(/\/(\d+|\*)$/);
          if (m && m[1] !== "*") total = parseInt(m[1], 10);
        }
        return { status: 200, data, table, total };
      }
      lastStatus = res.status;
      lastBody = data;
      if (res.status !== 404) break; // 401/403 — credentials or RLS issue, don't try alternatives
    } catch (err) {
      lastStatus = 502;
      lastBody = { error: (err as Error).message };
    }
  }
  return { status: lastStatus, data: lastBody };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    // Read-through: live data from external affiliate platform
    if (action === "rest") {
      if (!(await isAffiliateAdmin(req))) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const {
        resource,
        select = "*",
        order,
        limit,
        filters,
        count: wantCount,
      } = (payload || {}) as {
        resource: string;
        select?: string;
        order?: string;
        limit?: number;
        filters?: Record<string, string>;
        count?: boolean;
      };
      const params = new URLSearchParams();
      if (select) params.set("select", select);
      if (order) params.set("order", order);
      if (typeof limit === "number") params.set("limit", String(limit));
      if (filters) {
        for (const [k, v] of Object.entries(filters)) params.set(k, v);
      }
      const r = await fetchAffiliateTable(resource, params.toString(), !!wantCount);
      return new Response(
        JSON.stringify({
          rows: Array.isArray(r.data) ? r.data : [],
          table: r.table ?? null,
          total: r.total ?? null,
          error: r.status >= 400 ? r.data : null,
        }),
        {
          status: r.status >= 500 ? 502 : 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!action || !ALLOWED_ACTIONS[action]) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const path = ALLOWED_ACTIONS[action];
    console.log(`[affiliate-proxy] Forwarding action=${action} to ${path}`);

    const { status, data } = await forwardToAffiliate(path, payload);

    return new Response(JSON.stringify(data), {
      status: status >= 500 ? 502 : status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[affiliate-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
