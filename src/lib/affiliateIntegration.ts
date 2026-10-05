/**
 * Affiliate Integration Module
 *
 * Handles referral capture, persistence, signup attribution, and
 * checkout metadata propagation for the external Maarifasasa Affiliates system.
 *
 * External affiliate API base:
 *   https://ujbzhauwcdmtdegthwbf.supabase.co/functions/v1
 *
 * All sensitive calls are proxied through our own edge function
 * (`affiliate-proxy`) so the external anon key is never exposed to the browser.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COOKIE_NAME = "ms_affiliate_ref";
const LS_KEY = "ms_affiliate_ref";
const LS_META_KEY = "ms_affiliate_ref_meta";
const LS_EXPIRY_KEY = "ms_affiliate_ref_expiry";
const SIGNUP_ATTRIBUTED_KEY = "ms_affiliate_signup_attributed";
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---------------------------------------------------------------------------
// Cookie helpers (simple, no dependency)
// ---------------------------------------------------------------------------
function setCookie(name: string, value: string, maxAgeSec: number) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSec};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

// ---------------------------------------------------------------------------
// Public API – Referral Storage
// ---------------------------------------------------------------------------

/**
 * Read the `ref` query-param from the current URL and persist it in
 * cookie + localStorage + sessionStorage. Call this on every page load.
 */
export function captureAffiliateRefFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return null;

  setStoredAffiliateRef(ref);

  // Also capture metadata for debugging / attribution
  try {
    localStorage.setItem(
      LS_META_KEY,
      JSON.stringify({
        landing_url: window.location.href,
        captured_at: new Date().toISOString(),
      })
    );
  } catch {
    // localStorage may be unavailable in private mode
  }

  console.debug("[affiliate] Referral captured:", ref);
  return ref;
}

/** Persist a referral code across cookie, localStorage and sessionStorage. */
export function setStoredAffiliateRef(ref: string) {
  try {
    setCookie(COOKIE_NAME, ref, 30 * 24 * 60 * 60); // 30 days
    localStorage.setItem(LS_KEY, ref);
    localStorage.setItem(LS_EXPIRY_KEY, String(Date.now() + REF_TTL_MS));
    sessionStorage.setItem(LS_KEY, ref);
  } catch {
    // Silent – storage unavailable
  }
}

/**
 * Retrieve the stored affiliate ref from the most durable source available.
 * Priority: cookie → localStorage (with expiry check) → sessionStorage.
 */
export function getAffiliateRef(): string | null {
  // 1. Cookie
  const fromCookie = getCookie(COOKIE_NAME);
  if (fromCookie) return fromCookie;

  // 2. localStorage (respect expiry)
  try {
    const stored = localStorage.getItem(LS_KEY);
    const expiry = localStorage.getItem(LS_EXPIRY_KEY);
    if (stored && expiry && Date.now() < Number(expiry)) return stored;
  } catch {
    /* no-op */
  }

  // 3. sessionStorage (fallback)
  try {
    const session = sessionStorage.getItem(LS_KEY);
    if (session) return session;
  } catch {
    /* no-op */
  }

  return null;
}

/** Clear all persisted referral data. */
export function clearStoredAffiliateRef() {
  deleteCookie(COOKIE_NAME);
  try {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_EXPIRY_KEY);
    localStorage.removeItem(LS_META_KEY);
    localStorage.removeItem(SIGNUP_ATTRIBUTED_KEY);
    sessionStorage.removeItem(LS_KEY);
  } catch {
    /* no-op */
  }
}

// ---------------------------------------------------------------------------
// Public API – Signup Attribution (calls our own proxy edge function)
// ---------------------------------------------------------------------------

/**
 * After a successful signup, attribute the user to the stored affiliate.
 * This is fire-and-forget with retry; it never blocks the user flow.
 */
export async function attributeSignup(userId: string): Promise<void> {
  const ref = getAffiliateRef();
  if (!ref) {
    console.debug("[affiliate] No referral code found, skipping signup attribution");
    return;
  }

  // Deduplicate: don't call more than once per user
  const alreadyKey = `${SIGNUP_ATTRIBUTED_KEY}_${userId}`;
  try {
    if (localStorage.getItem(alreadyKey)) {
      console.debug("[affiliate] Signup attribution already sent for user", userId);
      return;
    }
  } catch {
    /* no-op */
  }

  console.debug("[affiliate] Attributing signup", { userId, ref });

  // Use our own edge function as a proxy
  const { supabase } = await import("@/integrations/supabase/client");

  try {
    const { error } = await supabase.functions.invoke("affiliate-proxy", {
      body: {
        action: "attribute-signup",
        payload: {
          user_id: userId,
          referral_code: ref,
        },
      },
    });

    if (error) {
      console.error("[affiliate] Signup attribution proxy error:", error);
      return;
    }

    // Mark as done
    try {
      localStorage.setItem(alreadyKey, "1");
    } catch {
      /* no-op */
    }
    console.debug("[affiliate] Signup attributed successfully");
  } catch (err) {
    console.error("[affiliate] Signup attribution failed:", err);
    // Non-blocking — user signup flow continues
  }
}

// ---------------------------------------------------------------------------
// Public API – Checkout Metadata
// ---------------------------------------------------------------------------

/**
 * Build metadata object for Stripe checkout sessions / ioTec payloads
 * that includes the affiliate code when present.
 */
export function buildCheckoutMetadata(
  userId?: string,
  productId?: string
): Record<string, string> {
  const meta: Record<string, string> = {};
  const ref = getAffiliateRef();
  if (ref) meta.affiliate_code = ref;
  if (userId) meta.user_id = userId;
  if (productId) meta.product_id = productId;
  return meta;
}

// ---------------------------------------------------------------------------
// Public API – Direct Conversion (fallback)
// ---------------------------------------------------------------------------

export interface DirectConversionPayload {
  affiliate_code: string;
  order_amount: number;
  commission_amount: number;
  currency: string;
  product_slug: string;
  mother_conversion_id: string;
}

/**
 * Send a direct conversion to the external affiliate system via our proxy.
 * Use this only when no webhook-driven flow is available.
 */
export async function sendDirectConversion(
  payload: DirectConversionPayload
): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");

  try {
    const { error } = await supabase.functions.invoke("affiliate-proxy", {
      body: {
        action: "track-conversion",
        payload,
      },
    });

    if (error) {
      console.error("[affiliate] Direct conversion error:", error);
    } else {
      console.debug("[affiliate] Direct conversion recorded");
    }
  } catch (err) {
    console.error("[affiliate] Direct conversion failed:", err);
  }
}
