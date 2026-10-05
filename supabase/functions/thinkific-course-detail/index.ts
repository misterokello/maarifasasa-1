import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

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

// Simple in-memory cache (per isolate lifetime)
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('course_id');

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'course_id query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache
    const cached = cache.get(courseId);
    if (cached && Date.now() < cached.expiry) {
      console.log(`Cache hit for course ${courseId}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = getThinkificAccessToken();
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Thinkific API Access Token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = getThinkificHeaders(accessToken);

    // Fetch course details and chapters in parallel
    const [courseRes, chaptersRes] = await Promise.all([
      fetch(`${THINKIFIC_API_BASE}/courses/${courseId}`, { headers }),
      fetch(`${THINKIFIC_API_BASE}/courses/${courseId}/chapters`, { headers }),
    ]);

    if (!courseRes.ok) {
      const errText = await courseRes.text();
      console.error(`Thinkific course fetch error (${courseRes.status}):`, errText);
      await chaptersRes.text();
      return new Response(
        JSON.stringify({ error: `Failed to fetch course: ${courseRes.status}` }),
        { status: courseRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const courseData = await courseRes.json();

    let chapters: { name: string; contents_count: number }[] = [];
    if (chaptersRes.ok) {
      const chaptersData = await chaptersRes.json();
      const chapterItems = chaptersData.items || [];

      // Fetch contents (lesson names) for each chapter in parallel
      const contentLists = await Promise.all(
        chapterItems.map(async (ch: any) => {
          try {
            const contentsRes = await fetch(
              `${THINKIFIC_API_BASE}/chapters/${ch.id}/contents`,
              { headers }
            );
            if (contentsRes.ok) {
              const contentsData = await contentsRes.json();
              return (contentsData.items || []).map((c: any) => ({
                name: c.name || 'Untitled lesson',
                content_type: c.content_type || null,
              }));
            }
            await contentsRes.text();
            return [];
          } catch {
            return [];
          }
        })
      );

      chapters = chapterItems.map((ch: any, i: number) => ({
        name: ch.name,
        contents_count: contentLists[i].length,
        lessons: contentLists[i],
      }));
    } else {
      const errText = await chaptersRes.text();
      console.warn(`Chapters fetch failed (${chaptersRes.status}):`, errText);
    }

    // Instructor bio + course reviews (best-effort, never fatal)
    let instructor: Record<string, unknown> | null = null;
    let reviews: Record<string, unknown>[] = [];

    const instructorId = courseData.instructor_id ?? courseData.user_id ?? null;
    const [instructorRes, reviewsRes] = await Promise.all([
      instructorId
        ? fetch(`${THINKIFIC_API_BASE}/instructors/${instructorId}`, { headers }).catch(() => null)
        : Promise.resolve(null),
      fetch(`${THINKIFIC_API_BASE}/course_reviews?course_id=${courseId}&limit=25`, { headers }).catch(
        () => null,
      ),
    ]);

    if (instructorRes?.ok) {
      const i = await instructorRes.json();
      instructor = {
        name: [i.first_name, i.last_name].filter(Boolean).join(" ") || i.full_name || null,
        title: i.title || null,
        bio: i.bio || null,
        avatar_url: i.avatar_url || null,
      };
    } else if (instructorRes) {
      await instructorRes.text();
    }

    if (reviewsRes?.ok) {
      const rd = await reviewsRes.json();
      reviews = (rd.items || [])
        .filter((r: any) => r?.approved !== false && (r?.review_text || r?.body))
        .map((r: any) => ({
          rating: r.rating ?? null,
          text: r.review_text || r.body || "",
          author: r.user_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "Learner",
          created_at: r.created_at || null,
        }))
        .slice(0, 12);
    } else if (reviewsRes) {
      await reviewsRes.text();
    }

    const result = {
      name: courseData.name,
      subtitle: courseData.subtitle || null,
      description: courseData.description || null,
      course_card_image_url: courseData.course_card_image_url || null,
      banner_image_url: courseData.banner_image_url || null,
      chapters,
      user_count: courseData.user_count || 0,
      course_card_text: courseData.course_card_text || null,
      keywords: courseData.keywords || null,
      instructional_level: courseData.instructional_level || null,
      duration: courseData.duration || null,
      instructor,
      reviews,
    };


    // Store in cache
    cache.set(courseId, { data: result, expiry: Date.now() + CACHE_TTL_MS });

    console.log(`Fetched course ${courseId}: ${result.name}, ${chapters.length} chapters`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in thinkific-course-detail:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
