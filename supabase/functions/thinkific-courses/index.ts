import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const THINKIFIC_API_URL = "https://api.thinkific.com/api/public/v1/courses";
const SUBDOMAIN = "maarifasasa";

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();
  const requestId = crypto.randomUUID();
  try {
    // Course listings are public marketing content. Keep Thinkific credentials server-side,
    // but allow anonymous visitors on /courses to load the catalog in production.
    console.log(JSON.stringify({
      requestId,
      event: "thinkific_courses_request_received",
      origin: req.headers.get("origin") ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
      hasAuthHeader: !!req.headers.get("authorization"),
      authFlow: "bearer_api_access_token",
    }));

    // Thinkific deprecated API key auth in March 2026; use API Access Token bearer auth.
    const accessToken = getThinkificAccessToken();

    if (!accessToken) {
      console.error(JSON.stringify({
        requestId,
        event: "thinkific_token_missing",
        checkedEnvVars: ["THINKIFIC_API_ACCESS_TOKEN", "Thinkific"],
      }));
      return new Response(
        JSON.stringify({ error: "Thinkific API Access Token not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(JSON.stringify({
      requestId,
      event: "thinkific_token_loaded",
      tokenLength: accessToken.length,
      tokenPrefix: accessToken.slice(0, 4),
      authFlow: "Bearer API Access Token (post-March-2026)",
    }));
    
    // Call Thinkific API with pagination to get ALL courses (including unpublished for admin selection)
    // We'll sort by created_at descending to show newest first
    const allCourses: any[] = [];
    let page = 1;
    const limit = 100; // Max per page
    let hasMore = true;
    
    while (hasMore) {
      const url = new URL(THINKIFIC_API_URL);
      // Don't filter by published - admins need to see all courses to link them
      url.searchParams.append('page', String(page));
      url.searchParams.append('limit', String(limit));
      
      const pageStart = Date.now();
      const response = await fetch(url.toString(), {
        headers: getThinkificHeaders(accessToken),
      });
      const pageLatencyMs = Date.now() - pageStart;

      console.log(JSON.stringify({
        requestId,
        event: "thinkific_api_response",
        page,
        statusCode: response.status,
        ok: response.ok,
        latencyMs: pageLatencyMs,
        authFlow: "bearer_api_access_token",
      }));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(JSON.stringify({
          requestId,
          event: "thinkific_api_error",
          page,
          statusCode: response.status,
          latencyMs: pageLatencyMs,
          errorSnippet: errorText.slice(0, 300),
        }));

        const hint =
          response.status === 401
            ? `Thinkific rejected the API Access Token. Confirm the token was copied from Settings → Code & Analytics → API Access Tokens for the ${SUBDOMAIN} site, has not expired, and includes REST API access.`
            : undefined;

        return new Response(
          JSON.stringify({
            error: `Failed to fetch courses from Thinkific: ${response.status}`,
            details: errorText,
            hint,
            subdomain: SUBDOMAIN,
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const data = await response.json();
      const courses = data.items || [];
      allCourses.push(...courses);

      // Check if there are more pages using Thinkific's pagination metadata
      const meta = data.meta || {};
      const totalPages = meta.pagination?.total_pages || 1;
      const currentPage = meta.pagination?.current_page || page;
      
      hasMore = currentPage < totalPages;
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 100) {
        console.log('Reached safety limit of 100 pages');
        break;
      }
    }
    
    // Sort courses by created_at descending (newest first)
    allCourses.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    console.log(JSON.stringify({
      requestId,
      event: "thinkific_courses_success",
      totalCourses: allCourses.length,
      pagesFetched: page - 1,
      totalLatencyMs: Date.now() - requestStart,
    }));

    return new Response(
      JSON.stringify({ items: allCourses, total: allCourses.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(JSON.stringify({
      requestId,
      event: "thinkific_courses_exception",
      totalLatencyMs: Date.now() - requestStart,
      error: (error as Error).message,
      stack: (error as Error).stack?.slice(0, 500),
    }));

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
