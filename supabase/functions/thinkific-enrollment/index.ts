import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mintSignInUrl } from "../_shared/thinkificSso.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";
const SUBDOMAIN = "maarifasasa";
const THINKIFIC_SITE_URL = `https://${SUBDOMAIN}.thinkific.com`;
const THINKIFIC_SIGNIN_URL = `${THINKIFIC_SITE_URL}/users/sign_in`;

function getThinkificAccessToken(): string | null {
  const rawToken = Deno.env.get('THINKIFIC_API_ACCESS_TOKEN') ?? Deno.env.get('Thinkific');
  const token = rawToken?.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '');
  return token || null;
}

function getThinkificHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

interface EnrollmentRequest {
  email: string;
  first_name: string;
  last_name: string;
  course_id: string;
  payment_id?: string;
  phone?: string;
  gender?: string;
  country?: string;
  age?: string;
}

interface CustomProfileField {
  id: number;
  label: string;
  field_type: string;
  required?: boolean;
}

interface FieldMapping {
  id: number;
  label: string;
}

function normalizePhoneToE164(phone?: string): string | undefined {
  if (!phone) return undefined;
  const trimmed = phone.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("+")) return trimmed;
  if (/^\d{10,}$/.test(trimmed)) return `+${trimmed}`;
  return trimmed;
}

function findFieldByKeywords(
  fieldMap: Map<string, FieldMapping>,
  keywords: string[]
): FieldMapping | undefined {
  const normalized = keywords.map((k) => k.toLowerCase());
  for (const [labelKey, mapping] of fieldMap.entries()) {
    if (normalized.some((k) => labelKey.includes(k))) return mapping;
  }
  return undefined;
}

async function getCustomProfileFields(apiKey: string): Promise<Map<string, FieldMapping>> {
  const headers = getThinkificHeaders(apiKey);

  const response = await fetch(`${THINKIFIC_API_BASE}/custom_profile_field_definitions`, { headers });
  
  if (!response.ok) {
    console.error(`Failed to fetch custom profile fields: ${response.status}`);
    return new Map();
  }

  const data = await response.json();
  const fieldMap = new Map<string, FieldMapping>();
  
  if (data.items && Array.isArray(data.items)) {
    for (const field of data.items as CustomProfileField[]) {
      fieldMap.set(field.label.toLowerCase(), { id: field.id, label: field.label });
    }
  }
  
  console.log(`Loaded ${fieldMap.size} custom profile fields from Thinkific`);
  return fieldMap;
}

// Trigger password reset for a user - Thinkific sends reset email with token
async function triggerPasswordReset(apiKey: string, email: string): Promise<boolean> {
  const headers = getThinkificHeaders(apiKey);

  try {
    const response = await fetch(`${THINKIFIC_API_BASE}/users/reset_password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      console.log(`Password reset email triggered for ${email}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Failed to trigger password reset: ${errorText}`);
      return false;
    }
  } catch (err) {
    console.error("Error triggering password reset:", err);
    return false;
  }
}

// Get a one-tap sign-in URL (SSO first, legacy express endpoint as fallback).
async function getExpressSignInUrl(
  apiKey: string,
  userId: number,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null,
): Promise<string | null> {
  return await mintSignInUrl(apiKey, userId, {
    email: email || "",
    first_name: firstName ?? null,
    last_name: lastName ?? null,
  });
}

// Find or create a Thinkific user
async function findOrCreateUser(
  apiKey: string,
  email: string,
  firstName: string,
  lastName: string,
  customFields?: { phone?: string; gender?: string; country?: string; age?: string },
  fieldMap?: Map<string, FieldMapping>
): Promise<{ userId: number; isNew: boolean }> {
  const headers = getThinkificHeaders(apiKey);

  // First, search for existing user by email
  const searchUrl = new URL(`${THINKIFIC_API_BASE}/users`);
  searchUrl.searchParams.append('query[email]', email);

  const searchResponse = await fetch(searchUrl.toString(), { headers });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.items && searchData.items.length > 0) {
      console.log(`Found existing Thinkific user: ${searchData.items[0].id}`);
      return { userId: searchData.items[0].id, isNew: false };
    }
  }

  // User doesn't exist, create new one
  // Generate a random password (user will reset it via email)
  const randomPassword = crypto.randomUUID().slice(0, 16) + "A1!";

  // Build custom profile fields
  const customProfileFieldData: { custom_profile_field_definition_id: number; value: string }[] = [];
  
  if (customFields && fieldMap) {
    const phoneField = findFieldByKeywords(fieldMap, ["phone", "mobile", "telephone"]);
    const genderField = findFieldByKeywords(fieldMap, ["gender"]);
    const countryField = findFieldByKeywords(fieldMap, ["country", "nationality"]);
    const ageField = findFieldByKeywords(fieldMap, ["age", "dob", "date of birth"]);

    const phoneValue = normalizePhoneToE164(customFields.phone);
    if (phoneValue && phoneField) {
      customProfileFieldData.push({ custom_profile_field_definition_id: phoneField.id, value: String(phoneValue) });
    }
    if (customFields.gender && genderField) {
      customProfileFieldData.push({ custom_profile_field_definition_id: genderField.id, value: String(customFields.gender) });
    }
    if (customFields.country && countryField) {
      customProfileFieldData.push({ custom_profile_field_definition_id: countryField.id, value: String(customFields.country) });
    }
    if (customFields.age && ageField) {
      customProfileFieldData.push({ custom_profile_field_definition_id: ageField.id, value: String(customFields.age) });
    }
  }

  const createPayload: Record<string, unknown> = {
    email,
    first_name: firstName,
    last_name: lastName,
    password: randomPassword,
    send_welcome_email: false, // We'll send password reset instead
  };

  if (customProfileFieldData.length > 0) {
    createPayload.custom_profile_fields = customProfileFieldData;
  }

  console.log(`Creating Thinkific user with payload: ${JSON.stringify(createPayload)}`);

  const createResponse = await fetch(`${THINKIFIC_API_BASE}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(createPayload),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error(`Failed to create Thinkific user: ${errorText}`);
    throw new Error(`Failed to create Thinkific user (${createResponse.status}): ${errorText}`);
  }

  const userData = await createResponse.json();
  console.log(`Created new Thinkific user: ${userData.id}`);
  return { userId: userData.id, isNew: true };
}

// Enroll user in a course
async function enrollUserInCourse(
  apiKey: string,
  userId: number,
  courseId: string
): Promise<{ success: boolean; enrollmentId?: number }> {
  const headers = getThinkificHeaders(apiKey);

  // First check if user is already enrolled
  const checkUrl = new URL(`${THINKIFIC_API_BASE}/enrollments`);
  checkUrl.searchParams.append('query[user_id]', userId.toString());
  checkUrl.searchParams.append('query[course_id]', courseId);

  const checkResponse = await fetch(checkUrl.toString(), { headers });

  if (checkResponse.ok) {
    const checkData = await checkResponse.json();
    if (checkData.items && checkData.items.length > 0) {
      console.log(`User ${userId} already enrolled in course ${courseId}`);
      return { success: true, enrollmentId: checkData.items[0].id };
    }
  }

  // Create enrollment
  const enrollResponse = await fetch(`${THINKIFIC_API_BASE}/enrollments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      course_id: parseInt(courseId, 10),
      user_id: userId,
      activated_at: new Date().toISOString(),
    }),
  });

  if (!enrollResponse.ok) {
    const errorText = await enrollResponse.text();
    console.error(`Failed to enroll user: ${errorText}`);
    throw new Error(`Failed to enroll user (${enrollResponse.status}): ${errorText}`);
  }

  const enrollData = await enrollResponse.json();
  console.log(`Enrolled user ${userId} in course ${courseId}, enrollment ID: ${enrollData.id}`);
  return { success: true, enrollmentId: enrollData.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let paymentId: string | undefined;

  try {
    // Authorize callers. This function enrolls users into paid courses, so
    // unauthenticated access would allow free enrollments. We accept either:
    //   (a) a trusted internal shared secret (x-internal-secret) for
    //       server-to-server calls from our own webhooks (stripe-webhook,
    //       iotec-status), or
    //   (b) an authenticated admin user JWT for manual admin enrollments.
    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const providedSecret = req.headers.get('x-internal-secret');
    let authorized = false;

    if (internalSecret && providedSecret) {
      // Constant-time comparison
      if (
        providedSecret.length === internalSecret.length &&
        (() => {
          let diff = 0;
          for (let i = 0; i < internalSecret.length; i++) {
            diff |= internalSecret.charCodeAt(i) ^ providedSecret.charCodeAt(i);
          }
          return diff === 0;
        })()
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: userData.user.id,
            _role: 'admin',
          });
          if (isAdmin) authorized = true;
        }
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = getThinkificAccessToken();
    
    if (!apiKey) {
      console.error("Thinkific API Access Token not found in environment");
      return new Response(
        JSON.stringify({ error: "Thinkific API Access Token not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: EnrollmentRequest = await req.json();
    const { email, first_name, last_name, course_id, payment_id, phone, gender, country, age } = body;

    paymentId = payment_id;

    if (!email || !course_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and course_id" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing Thinkific enrollment for ${email} in course ${course_id}`);

    // Fetch custom profile field definitions
    const fieldMap = await getCustomProfileFields(apiKey);

    // Find or create the user with custom fields
    const { userId, isNew } = await findOrCreateUser(
      apiKey,
      email,
      first_name || email.split('@')[0],
      last_name || '',
      { phone, gender, country, age },
      fieldMap
    );

    // Enroll the user in the course
    const enrollment = await enrollUserInCourse(apiKey, userId, course_id);

    // For new users, trigger password reset so they can set their password
    let passwordResetTriggered = false;
    if (isNew) {
      passwordResetTriggered = await triggerPasswordReset(apiKey, email);
    }

    // Get express sign-in URL for the user
    const expressSignInUrl = await getExpressSignInUrl(
      apiKey,
      userId,
      email,
      first_name,
      last_name,
    );

    // If payment_id provided, update payment metadata with enrollment info
    if (payment_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: payment } = await supabase
        .from("payments")
        .select("metadata")
        .eq("id", payment_id)
        .maybeSingle();

      await supabase
        .from("payments")
        .update({
          metadata: {
            ...payment?.metadata,
            thinkific_user_id: userId,
            thinkific_enrollment_id: enrollment.enrollmentId,
            thinkific_is_new_user: isNew,
            thinkific_express_sign_in_url: expressSignInUrl,
            thinkific_password_reset_sent: passwordResetTriggered,
          },
        })
        .eq("id", payment_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        is_new_user: isNew,
        enrollment_id: enrollment.enrollmentId,
        express_sign_in_url: expressSignInUrl,
        thinkific_sign_in_url: THINKIFIC_SIGNIN_URL,
        password_reset_sent: passwordResetTriggered,
        message: isNew 
          ? "New Thinkific account created and enrolled. Password reset email sent."
          : "User enrolled in course successfully.",
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in thinkific-enrollment:", error);

    if (paymentId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          const { data: payment } = await supabase
            .from("payments")
            .select("metadata")
            .eq("id", paymentId)
            .maybeSingle();

          await supabase
            .from("payments")
            .update({
              metadata: {
                ...(payment?.metadata || {}),
                thinkific_error: {
                  message: error?.message || String(error),
                  at: new Date().toISOString(),
                },
              },
            })
            .eq("id", paymentId);
        }
      } catch (persistErr) {
        console.error("Failed to persist Thinkific error to payment metadata:", persistErr);
      }
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
