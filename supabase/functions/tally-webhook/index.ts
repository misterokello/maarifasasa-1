import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Tally's HMAC signature. Tally signs the raw request body with the
// configured signing secret and sends the base64-encoded HMAC-SHA256 digest in
// the `tally-signature` header. See https://tally.so/help/webhooks.
async function verifyTallySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
    // Constant-time comparison
    if (expected.length !== signatureHeader.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('Error verifying Tally signature:', err);
    return false;
  }
}

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: unknown;
  options?: Array<{ id: string; text: string }>;
}

interface TallyWebhookPayload {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const TALLY_WEBHOOK_SECRET = Deno.env.get('TALLY_WEBHOOK_SECRET');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Fail closed if the signing secret is not configured.
    if (!TALLY_WEBHOOK_SECRET) {
      console.error('TALLY_WEBHOOK_SECRET not configured - refusing webhook');
      return new Response(
        JSON.stringify({ error: 'Webhook signing secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read raw body for signature verification, then parse.
    const rawBody = await req.text();
    const signature = req.headers.get('tally-signature') ?? req.headers.get('Tally-Signature');
    const valid = await verifyTallySignature(rawBody, signature, TALLY_WEBHOOK_SECRET);
    if (!valid) {
      console.warn('Tally webhook signature verification failed');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: TallyWebhookPayload = JSON.parse(rawBody);
    
    console.log('Received Tally webhook:', {
      eventType: payload.eventType,
      formId: payload.data?.formId,
      submissionId: payload.data?.submissionId,
    });

    // Validate the payload
    if (!payload.data || !payload.data.submissionId || !payload.data.formId) {
      console.error('Invalid webhook payload:', payload);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for bypassing RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Transform fields to a cleaner format
    const processedFields = payload.data.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      value: field.value,
    }));

    // Store the submission in the database
    const { data, error } = await supabase
      .from('tally_submissions')
      .upsert({
        tally_submission_id: payload.data.submissionId,
        form_id: payload.data.formId,
        form_name: payload.data.formName,
        submitted_at: payload.data.createdAt,
        fields: processedFields,
        raw_payload: payload,
      }, {
        onConflict: 'tally_submission_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing submission:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store submission', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Submission stored successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Submission received and stored',
        id: data.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
