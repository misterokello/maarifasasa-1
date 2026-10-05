/**
 * Discount Code / Referral Tracking
 *
 * A discount code doubles as a referral source. Share links look like:
 *   https://maarifasasa.com/?dc=CODE
 *
 * The code is persisted (cookie + localStorage + sessionStorage) with a
 * 30-day last-touch window, auto-applied at checkout, and used to attribute
 * signups and paid orders to the referrer.
 */
import { supabase } from "@/integrations/supabase/client";

const COOKIE_NAME = "ms_discount_code";
const LS_KEY = "ms_discount_code";
const LS_EXPIRY_KEY = "ms_discount_code_expiry";
const SIGNUP_KEY = "ms_discount_signup_attributed";
const CLICK_KEY = "ms_discount_click_tracked";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const DISCOUNT_PARAM = "dc";

function setCookie(name: string, value: string, maxAgeSec: number) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSec};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Persist a discount code across cookie, localStorage and sessionStorage. */
export function setStoredDiscountCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!clean) return;
  try {
    setCookie(COOKIE_NAME, clean, TTL_MS / 1000);
    localStorage.setItem(LS_KEY, clean);
    localStorage.setItem(LS_EXPIRY_KEY, String(Date.now() + TTL_MS));
    sessionStorage.setItem(LS_KEY, clean);
  } catch {
    /* storage unavailable */
  }
}

/** Read the stored code: cookie → localStorage (expiry aware) → sessionStorage. */
export function getStoredDiscountCode(): string | null {
  const fromCookie = getCookie(COOKIE_NAME);
  if (fromCookie) return fromCookie;
  try {
    const stored = localStorage.getItem(LS_KEY);
    const expiry = localStorage.getItem(LS_EXPIRY_KEY);
    if (stored && expiry && Date.now() < Number(expiry)) return stored;
  } catch {
    /* no-op */
  }
  try {
    return sessionStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

export function clearStoredDiscountCode() {
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`;
  try {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_EXPIRY_KEY);
    sessionStorage.removeItem(LS_KEY);
  } catch {
    /* no-op */
  }
}

/**
 * Capture `?dc=CODE` from the URL, persist it, and record a click
 * (deduplicated per session).
 */
export function captureDiscountCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get(DISCOUNT_PARAM);
  if (!code) return null;

  setStoredDiscountCode(code);

  const clean = code.trim().toUpperCase();
  try {
    const key = `${CLICK_KEY}_${clean}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      supabase.functions.invoke("discount-track", {
        body: {
          action: "click",
          code: clean,
          landing_path: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
        },
      });
    }
  } catch {
    /* no-op */
  }

  return clean;
}

/** Attribute a newly created account to the stored discount code. */
export async function attributeDiscountSignup(
  userId: string,
  email?: string | null,
  fullName?: string | null,
): Promise<void> {
  const code = getStoredDiscountCode();
  if (!code) return;

  const key = `${SIGNUP_KEY}_${userId}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch {
    /* no-op */
  }

  try {
    await supabase.functions.invoke("discount-track", {
      body: {
        action: "signup",
        code,
        user_id: userId,
        email: email || null,
        full_name: fullName || null,
      },
    });
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* no-op */
    }
  } catch (err) {
    console.error("[discount] signup attribution failed", err);
  }
}

export interface ResolvedDiscount {
  valid: boolean;
  reason: string | null;
  code: string | null;
  label: string | null;
  percent_off: number | null;
  applies_to_product: boolean;
}

export const DISCOUNT_REASON_LABELS: Record<string, string> = {
  not_found: "That code doesn't exist.",
  inactive: "That code is no longer active.",
  not_started: "That code isn't active yet.",
  expired: "That code has expired.",
  limit_reached: "That code has reached its usage limit.",
  product_not_found: "Course not found.",
  not_applicable: "That code doesn't apply to this course.",
};

/** Validate a code against a product via the security-definer resolver. */
export async function resolveDiscountCode(
  code: string,
  productSlug: string,
): Promise<ResolvedDiscount | null> {
  const { data, error } = await supabase.rpc("resolve_discount_code", {
    _code: code.trim(),
    _product_slug: productSlug,
  });
  if (error) {
    console.error("[discount] resolve error", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row as ResolvedDiscount;
}

/** Apply a percentage discount, rounding up to whole currency units. */
export function applyDiscount(amount: number, percentOff: number): number {
  const discounted = amount - (amount * percentOff) / 100;
  return Math.max(0, Math.ceil(discounted));
}

/** Build a shareable referral link for a code. */
export function buildShareLink(code: string, origin?: string): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/?${DISCOUNT_PARAM}=${encodeURIComponent(code)}`;
}