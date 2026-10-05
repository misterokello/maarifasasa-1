import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TALLY_API_URL = 'https://api.tally.so';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require an authenticated admin caller. The tally-api function can list,
    // read, and delete form submissions (which contain PII), so unauthenticated
    // access is refused.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: isAdmin } = await authClient.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TALLY_API_KEY = Deno.env.get('TALLY_API_KEY');
    if (!TALLY_API_KEY) {
      throw new Error('TALLY_API_KEY is not configured');
    }

    const { action, data } = await req.json();

    let response;
    const headers = {
      'Authorization': `Bearer ${TALLY_API_KEY}`,
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'list-forms':
        // List all forms
        response = await fetch(`${TALLY_API_URL}/forms`, {
          method: 'GET',
          headers,
        });
        break;

      case 'get-form':
        // Get a specific form by ID
        if (!data?.formId) {
          throw new Error('formId is required');
        }
        response = await fetch(`${TALLY_API_URL}/forms/${data.formId}`, {
          method: 'GET',
          headers,
        });
        break;

      case 'get-submissions':
        // Get submissions for a form
        if (!data?.formId) {
          throw new Error('formId is required');
        }
        const params = new URLSearchParams();
        if (data.page) params.set('page', data.page.toString());
        
        response = await fetch(`${TALLY_API_URL}/forms/${data.formId}/submissions?${params}`, {
          method: 'GET',
          headers,
        });
        break;

      case 'get-submission':
        // Get a specific submission
        if (!data?.formId || !data?.submissionId) {
          throw new Error('formId and submissionId are required');
        }
        response = await fetch(`${TALLY_API_URL}/forms/${data.formId}/submissions/${data.submissionId}`, {
          method: 'GET',
          headers,
        });
        break;

      case 'delete-submission':
        // Delete a submission
        if (!data?.formId || !data?.submissionId) {
          throw new Error('formId and submissionId are required');
        }
        response = await fetch(`${TALLY_API_URL}/forms/${data.formId}/submissions/${data.submissionId}`, {
          method: 'DELETE',
          headers,
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}. Available actions: list-forms, get-form, get-submissions, get-submission, delete-submission`);
    }

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Tally API error:', responseData);
      return new Response(
        JSON.stringify({ 
          error: responseData.message || 'Tally API request failed',
          details: responseData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tally-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
