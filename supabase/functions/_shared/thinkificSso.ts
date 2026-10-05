// Shared Thinkific sign-in helpers.
//
// The public API endpoint `GET /users/{id}/sign_in_url` returns Thinkific's
// site 404 page on this site/plan, so express sign-in links can never be
// minted that way. We therefore:
//   1. prefer real SSO (HS256 JWT signed with THINKIFIC_SSO_API_KEY),
//   2. fall back to the express endpoint but remember a 404 so we stop
//      hammering it (and stop flooding the logs) for the rest of the
//      function instance's life,
//   3. self-heal stale profile ids: a 404 from `GET /users/{id}` means the
//      Thinkific user no longer exists and the stored id should be cleared.

// deno-lint-ignore-file no-explicit-any
import { THINKIFIC_API_BASE, thinkificHeaders } from "./thinkificUsers.ts";

export const THINKIFIC_SUBDOMAIN = "maarifasasa";
export const THINKIFIC_SITE_URL = `https://${THINKIFIC_SUBDOMAIN}.thinkific.com`;
export const THINKIFIC_SIGNIN_URL = `${THINKIFIC_SITE_URL}/users/sign_in`;

/** Set once we learn the express sign-in endpoint isn't available here. */
let expressEndpointUnavailable = false;
let loggedExpress404 = false;

function base64url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlJson(value: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

export function getSsoApiKey(): string | null {
  const raw = Deno.env.get("THINKIFIC_SSO_API_KEY");
  const key = raw?.trim().replace(/^["']|["']$/g, "");
  return key || null;
}

export interface SsoIdentity {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  external_id?: string | null;
}

/**
 * Build a Thinkific SSO (multipass-style) login URL. Returns null when the
 * SSO key isn't configured.
 */
export async function buildSsoUrl(
  identity: SsoIdentity,
  returnTo?: string | null,
): Promise<string | null> {
  const secret = getSsoApiKey();
  if (!secret || !identity.email) return null;
  try {
    const first = (identity.first_name || "").toString().trim() ||
      identity.email.split("@")[0];
    const last = (identity.last_name || "").toString().trim() || first;
    const payload: Record<string, unknown> = {
      email: identity.email,
      first_name: first,
      last_name: last,
      iat: Math.floor(Date.now() / 1000),
    };
    if (identity.external_id) payload.external_id = identity.external_id;

    const header = base64urlJson({ alg: "HS256", typ: "JWT" });
    const body = base64urlJson(payload);
    const data = `${header}.${body}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)),
    );
    const jwt = `${data}.${base64url(sig)}`;

    const url = new URL(`${THINKIFIC_SITE_URL}/api/sso/v2/login`);
    url.searchParams.set("jwt", jwt);
    if (returnTo) url.searchParams.set("return_to", returnTo);
    return url.toString();
  } catch (err) {
    console.error("[thinkific-sso] jwt build failed", err);
    return null;
  }
}

/** true when the Thinkific user still exists, false when it 404s, null when unknown. */
export async function thinkificUserExists(
  apiKey: string,
  userId: number,
): Promise<boolean | null> {
  try {
    const res = await fetch(`${THINKIFIC_API_BASE}/users/${userId}`, {
      headers: thinkificHeaders(apiKey),
    });
    if (res.status === 404) {
      await res.text();
      return false;
    }
    await res.text();
    return res.ok ? true : null;
  } catch (err) {
    console.error("[thinkific-sso] user lookup failed", err);
    return null;
  }
}

/**
 * Legacy express sign-in URL. Returns null (and disables itself) when the
 * endpoint isn't available on this Thinkific site.
 */
export async function fetchExpressSignInUrl(
  apiKey: string,
  userId: number,
  returnTo?: string | null,
): Promise<string | null> {
  if (expressEndpointUnavailable) return null;
  try {
    const url = new URL(`${THINKIFIC_API_BASE}/users/${userId}/sign_in_url`);
    if (returnTo) url.searchParams.set("return_to", returnTo);
    const res = await fetch(url.toString(), { headers: thinkificHeaders(apiKey) });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 404) {
        expressEndpointUnavailable = true;
        if (!loggedExpress404) {
          loggedExpress404 = true;
          console.error(
            "[thinkific-sso] express sign_in_url unavailable (404) — disabling for this instance",
            text.slice(0, 200),
          );
        }
      } else {
        console.error("[thinkific-sso] sign_in_url failed", res.status, text.slice(0, 300));
      }
      return null;
    }
    const data = await res.json();
    return data.express_sign_in_url || data.sign_in_url || null;
  } catch (err) {
    console.error("[thinkific-sso] sign_in_url error", err);
    return null;
  }
}

/**
 * One-tap sign-in URL: SSO first, express endpoint second, null if neither works.
 */
export async function mintSignInUrl(
  apiKey: string,
  userId: number | null | undefined,
  identity: SsoIdentity,
  returnTo?: string | null,
): Promise<string | null> {
  const sso = await buildSsoUrl(identity, returnTo);
  if (sso) return sso;
  if (!userId) return null;
  return await fetchExpressSignInUrl(apiKey, userId, returnTo);
}
