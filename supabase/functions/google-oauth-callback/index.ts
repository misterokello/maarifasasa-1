import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_OAUTH_CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
const GOOGLE_OAUTH_CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;

const SITE_BASE = "https://maarifasasa.com"; // production fallback

function htmlRedirect(url: string, message: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Connecting…</title></head>
    <body style="font-family:Inter,sans-serif;background:#0F172A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
    <div style="text-align:center;max-width:480px;padding:32px;">
      <div style="font-size:18px;margin-bottom:12px;">${message}</div>
      <div style="opacity:.7;font-size:14px;">Redirecting…</div>
    </div>
    <script>setTimeout(() => { window.location.href = ${JSON.stringify(url)}; }, 800);</script>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function verifyState(state: string): Promise<{ userId: string; returnTo: string } | null> {
  try {
    const decoded = atob(state);
    const idx = decoded.lastIndexOf(".");
    if (idx === -1) return null;
    const payload = decoded.slice(0, idx);
    const sigHex = decoded.slice(idx + 1);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SUPABASE_SERVICE_ROLE_KEY),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expectBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectHex = Array.from(new Uint8Array(expectBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (expectHex !== sigHex) return null;
    const [userId, tsStr, ...rest] = payload.split(".");
    const ts = Number(tsStr);
    if (!userId || !ts || Date.now() - ts > 10 * 60 * 1000) return null;
    return { userId, returnTo: rest.join(".") || "" };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const verified = state ? await verifyState(state) : null;
  const returnTo = verified?.returnTo || `${SITE_BASE}/admin/advisor?tab=mentor-calls&google=1`;

  if (error || !code || !verified) {
    return htmlRedirect(returnTo + "&google_error=1", "Could not connect Google. Returning to dashboard…");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: `${SUPABASE_URL}/functions/v1/google-oauth-callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("token exchange failed", tokenJson);
      return htmlRedirect(returnTo + "&google_error=1", "Token exchange failed.");
    }

    const accessToken = tokenJson.access_token as string;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = tokenJson.expires_in as number;
    const scope = tokenJson.scope as string;

    // userinfo for email
    const uiRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const ui = await uiRes.json().catch(() => ({}));
    const email = ui?.email || null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Refresh token might be missing on re-consent; fetch existing if so
    let finalRefresh = refreshToken;
    if (!finalRefresh) {
      const { data: existing } = await supabase
        .from("admin_google_tokens")
        .select("refresh_token")
        .eq("user_id", verified.userId)
        .maybeSingle();
      finalRefresh = existing?.refresh_token;
    }
    if (!finalRefresh) {
      return htmlRedirect(returnTo + "&google_error=norefresh", "Missing refresh token. Try again with prompt=consent.");
    }

    const expiry = new Date(Date.now() + (expiresIn - 30) * 1000).toISOString();

    await supabase
      .from("admin_google_tokens")
      .upsert(
        {
          user_id: verified.userId,
          access_token: accessToken,
          refresh_token: finalRefresh,
          expiry,
          scope,
          email,
        },
        { onConflict: "user_id" }
      );

    return htmlRedirect(returnTo + "&google=connected", "Google connected. Returning…");
  } catch (e) {
    console.error("oauth callback error", e);
    return htmlRedirect(returnTo + "&google_error=1", "Unexpected error.");
  }
});
