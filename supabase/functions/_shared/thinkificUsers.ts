// Shared Thinkific user creation helper.
// Thinkific sites can mark custom profile fields (Phone Number, Gender, Country,
// Age, ...) as required, which makes POST /users fail with 422 unless we submit
// custom_profile_fields. We fetch the site's field definitions once and
// fill each required field from the learner profile, falling back to a safe
// placeholder so provisioning never blocks.
// deno-lint-ignore-file no-explicit-any

export const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

export function thinkificHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

export interface LearnerProfileLike {
  phone?: string | null;
  gender?: string | null;
  country?: string | null;
  location?: string | null;
  age_range?: string | null;
}

interface CustomField {
  id: number;
  label: string;
  required?: boolean;
  field_type?: string;
  dropdown_options?: string[] | null;
}

let cachedFields: CustomField[] | null = null;

async function getCustomProfileFields(apiKey: string): Promise<CustomField[]> {
  if (cachedFields) return cachedFields;
  try {
    const res = await fetch(`${THINKIFIC_API_BASE}/custom_profile_field_definitions`, {
      headers: thinkificHeaders(apiKey),
    });
    if (!res.ok) {
      console.error("[thinkific] custom_profile_field_definitions fetch failed:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    cachedFields = (data.items || []) as CustomField[];
    return cachedFields;
  } catch (err) {
    console.error("[thinkific] custom_profile_field_definitions error:", err);
    return [];
  }
}

const FALLBACK = "Not specified";

function valueForField(label: string, profile: LearnerProfileLike): string {
  const l = label.toLowerCase();
  if (l.includes("phone") || l.includes("whatsapp") || l.includes("mobile")) {
    return profile.phone?.trim() || FALLBACK;
  }
  if (l.includes("gender")) return profile.gender?.trim() || "Prefer not to say";
  if (l.includes("country")) return profile.country?.trim() || profile.location?.trim() || "Uganda";
  if (l.includes("age") || l.includes("birth")) return profile.age_range?.trim() || FALLBACK;
  if (l.includes("city") || l.includes("location") || l.includes("district")) {
    return profile.location?.trim() || FALLBACK;
  }
  return FALLBACK;
}

const KNOWN = /phone|mobile|whatsapp|telephone|gender|country|nationality|age|birth|city|location|district/i;

/** Builds custom_profile_fields for required (and known) site fields. */
export async function buildCustomProfileFieldValues(
  apiKey: string,
  profile: LearnerProfileLike,
): Promise<Array<{ custom_profile_field_definition_id: number; value: string }>> {
  const fields = await getCustomProfileFields(apiKey);
  return fields
    .filter((f) => f.required || KNOWN.test(f.label || ""))
    .map((f) => {

      let value = valueForField(f.label || "", profile);
      // Respect dropdown/select constraints: pick a matching option when possible.
      const options = f.dropdown_options;
      if (options && options.length > 0) {
        const match = options.find((o) => o.toLowerCase() === value.toLowerCase()) ??
          options.find((o) => o.toLowerCase().includes(value.toLowerCase())) ??
          options[options.length - 1];
        value = match;
      }
      return { custom_profile_field_definition_id: f.id, value };
    });
}

/** Looks up a Thinkific user by email; tries exact, lowercase and trimmed variants. */
export async function lookupThinkificUserByEmail(
  apiKey: string,
  email: string,
): Promise<number | null> {
  const headers = thinkificHeaders(apiKey);
  const variants = Array.from(new Set([email, email.trim(), email.trim().toLowerCase()]));
  for (const variant of variants) {
    const searchUrl = new URL(`${THINKIFIC_API_BASE}/users`);
    searchUrl.searchParams.append("query[email]", variant);
    try {
      const res = await fetch(searchUrl.toString(), { headers });
      if (!res.ok) {
        console.error("[thinkific] user search failed:", res.status, await res.text());
        continue;
      }
      const data = await res.json();
      const items = (data.items || []) as Array<{ id: number; email?: string }>;
      if (items.length > 0) {
        const target = variant.toLowerCase();
        const exact = items.find((u) => (u.email || "").toLowerCase() === target);
        return (exact?.id ?? items[0].id) as number;
      }
    } catch (err) {
      console.error("[thinkific] user search error:", err);
    }
  }
  return null;
}

export async function findOrCreateThinkificUser(
  apiKey: string,
  email: string,
  firstName: string,
  lastName: string,
  profile: LearnerProfileLike = {},
): Promise<{ userId: number; isNew: boolean }> {
  const headers = thinkificHeaders(apiKey);
  const existingId = await lookupThinkificUserByEmail(apiKey, email);
  if (existingId) return { userId: existingId, isNew: false };


  const randomPassword = crypto.randomUUID().slice(0, 16) + "A1!";
  const customValues = await buildCustomProfileFieldValues(apiKey, profile);
  // Thinkific rejects blank names (422 last_name can't be blank). Learners with a
  // single-word full name still need a valid last_name, so fall back safely.
  const safeFirst = (firstName || "").trim() || email.split("@")[0] || "Learner";
  const safeLast = (lastName || "").trim() || safeFirst;
  const basePayload: Record<string, any> = {
    email,
    first_name: safeFirst,
    last_name: safeLast,
    password: randomPassword,
    send_welcome_email: false,
  };

  const attempt = async (payload: Record<string, any>) => {
    const res = await fetch(`${THINKIFIC_API_BASE}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const text = res.ok ? "" : await res.text();
    return { ok: res.ok, status: res.status, text, res };
  };

  // 1st try: with custom profile fields (site may require them).
  let payload = customValues.length > 0
    ? { ...basePayload, custom_profile_fields: customValues }
    : basePayload;
  let result = await attempt(payload);

  // Thinkific already has this email (search can miss it due to query semantics
  // or case differences) — resolve to the existing account instead of failing.
  if (!result.ok && result.status === 422 && /has already been taken/i.test(result.text)) {
    const recovered = await lookupThinkificUserByEmail(apiKey, email);
    if (recovered) return { userId: recovered, isNew: false };
    console.error("[thinkific] email taken but user lookup failed for", email);
  }

  // Generic 422 (e.g. "Error creating user") is often caused by a rejected
  // custom_profile_fields value — retry with the minimal payload.
  if (!result.ok && result.status === 422 && customValues.length > 0) {
    console.error(
      "[thinkific] user create 422, retrying without custom fields:",
      result.text,
      JSON.stringify({ ...payload, password: "[redacted]" }),
    );
    result = await attempt(basePayload);
    if (!result.ok && result.status === 422 && /has already been taken/i.test(result.text)) {
      const recovered = await lookupThinkificUserByEmail(apiKey, email);
      if (recovered) return { userId: recovered, isNew: false };
    }
  }

  if (!result.ok) {
    // Last resort: the account may in fact exist despite the opaque error.
    const recovered = await lookupThinkificUserByEmail(apiKey, email);
    if (recovered) return { userId: recovered, isNew: false };
    console.error(
      "[thinkific] user create failed payload:",
      JSON.stringify({ ...basePayload, password: "[redacted]" }),
    );
    throw new Error(`Thinkific user create failed (${result.status}): ${result.text}`);
  }

  const data = await result.res.json();
  return { userId: data.id as number, isNew: true };
}

