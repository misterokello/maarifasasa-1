import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINKIFIC_API_BASE = "https://api.thinkific.com/api/public/v1";

function getToken(): string | null {
  const raw = Deno.env.get('THINKIFIC_API_ACCESS_TOKEN') ?? Deno.env.get('Thinkific');
  const t = raw?.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '');
  return t || null;
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { ok: false, status: 401, error: 'Unauthorized' };
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !user) return { ok: false, status: 401, error: 'Invalid token' };
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) return { ok: false, status: 403, error: 'Admin access required' };
  return { ok: true };
}

const CACHE_TTL = 2 * 60 * 1000;
const cache = new Map<string, { storedAt: number; payload: any }>();

function normalizeThinkificPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function candidateLessonIds(item: any): number[] {
  const ids = [
    item?.id,
    item?.lesson_id,
    item?.content_id,
    item?.contentable_id,
    item?.contentable?.id,
  ];
  return [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
}

/**
 * Pure helper (exported for tests): build the progress payload from the
 * actual course structure (chapters + lessons) and the user's completions.
 * Only marks a lesson as completed when there is a real completion row
 * for that lesson id and that row is actually completed.
 */
export function buildProgress(
  courseId: number,
  userId: number,
  chapterItems: any[],
  contentLists: any[][],
  completions: any[],
  enrollment?: any,
) {
  const completionMap = new Map<number, any>();
  for (const c of completions) {
    const ids = candidateLessonIds(c);
    if (!ids.length) continue;
    const isDone =
      c.completed === true ||
      c.completed === 'true' ||
      !!c.completed_at ||
      (normalizeThinkificPercent(c.percentage_completed) ?? 0) >= 100;
    if (!isDone) continue;
    for (const id of ids) completionMap.set(id, c);
  }

  const enrollmentPct = normalizeThinkificPercent(enrollment?.percentage_completed);
  const enrollmentCompleted = enrollment?.completed === true || enrollmentPct === 100;
  const lessonSlots: { lesson: any; completion: any | null; inferred: boolean }[] = [];

  const chapters = chapterItems.map((ch: any, i: number) => {
    const lessons = (contentLists[i] || []).map((l: any) => {
      const comp = candidateLessonIds(l).map((id) => completionMap.get(id)).find(Boolean) || null;
      const lesson = {
        id: l.id,
        name: l.name,
        content_type: l.content_type ?? l.contentable_type ?? null,
        position: l.position,
        completed: !!comp,
        completed_at: comp?.completed_at || null,
        percentage_completed: comp ? 100 : 0,
      };
      lessonSlots.push({ lesson, completion: comp, inferred: false });
      return lesson;
    });
    return {
      id: ch.id,
      name: ch.name,
      position: ch.position ?? 0,
      lessons,
      completed_count: lessons.filter((l: any) => l.completed).length,
      total_count: lessons.length,
    };
  });

  const totalLessons = lessonSlots.length;
  const explicitCompleted = lessonSlots.filter((s) => s.completion).length;
  const targetCompleted = enrollmentCompleted
    ? totalLessons
    : enrollmentPct !== null
      ? Math.min(totalLessons, Math.round((enrollmentPct / 100) * totalLessons))
      : explicitCompleted;

  if (targetCompleted > explicitCompleted) {
    let remaining = targetCompleted - explicitCompleted;
    for (const slot of lessonSlots) {
      if (slot.lesson.completed || remaining <= 0) continue;
      slot.lesson.completed = true;
      slot.lesson.percentage_completed = 100;
      slot.lesson.completed_at = null;
      slot.lesson.inferred_from_enrollment = true;
      slot.inferred = true;
      remaining--;
    }
  }

  const completedLessons = lessonSlots.filter((s) => s.lesson.completed).length;

  for (const chapter of chapters) {
    chapter.completed_count = chapter.lessons.filter((l: any) => l.completed).length;
  }

  return {
    course_id: Number(courseId),
    user_id: Number(userId),
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    percentage_completed: enrollmentPct ?? (totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0),
    completion_source: completions.length ? 'lesson_completions' : enrollmentPct !== null ? 'enrollment' : 'course_structure',
    chapters,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = getToken();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Thinkific token not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const courseId = url.searchParams.get('course_id');
    const userId = url.searchParams.get('user_id');
    if (!courseId || !userId) {
      return new Response(JSON.stringify({ error: 'course_id and user_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cacheKey = `${userId}:${courseId}`;
    const cached = cache.get(cacheKey);
    const bypassCache = url.searchParams.has('_') || url.searchParams.get('refresh') === 'true';
    if (!bypassCache && cached && Date.now() - cached.storedAt < CACHE_TTL) {
      return new Response(JSON.stringify({ ...cached.payload, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 1. Fetch the canonical course structure plus this learner's enrollment.
    const enrollmentUrl = new URL(`${THINKIFIC_API_BASE}/enrollments`);
    enrollmentUrl.searchParams.set('query[user_id]', userId);
    enrollmentUrl.searchParams.set('query[course_id]', courseId);
    enrollmentUrl.searchParams.set('limit', '1');
    const [chaptersRes, enrollmentRes] = await Promise.all([
      fetch(`${THINKIFIC_API_BASE}/courses/${courseId}/chapters`, { headers }),
      fetch(enrollmentUrl.toString(), { headers }),
    ]);
    if (!chaptersRes.ok) {
      const t = await chaptersRes.text();
      return new Response(JSON.stringify({ error: `Chapters ${chaptersRes.status}`, details: t.slice(0, 300) }), {
        status: chaptersRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const chaptersData = await chaptersRes.json();
    const chapterItems = chaptersData.items || [];
    const enrollmentData = enrollmentRes.ok ? await enrollmentRes.json() : null;
    const enrollment = enrollmentData?.items?.[0] || null;

    // 2. Contents (lessons) per chapter, in parallel
    const contentLists = await Promise.all(
      chapterItems.map(async (ch: any) => {
        try {
          const r = await fetch(`${THINKIFIC_API_BASE}/chapters/${ch.id}/contents`, { headers });
          if (!r.ok) { await r.text(); return []; }
          const d = await r.json();
          return (d.items || []).map((c: any) => ({
            id: c.id,
            lesson_id: c.lesson_id ?? c.contentable_id ?? c.id,
            content_id: c.id,
            contentable_id: c.contentable_id,
            name: c.name || 'Untitled lesson',
            content_type: c.contentable_type || c.content_type || null,
            position: c.position ?? 0,
          }));
        } catch { return []; }
      })
    );

    // 3. Lesson completions for this user+course (paginated)
    const completions: any[] = [];
    let page = 1;
    while (true) {
      const u = new URL(`${THINKIFIC_API_BASE}/lesson_completions`);
      u.searchParams.set('query[user_id]', userId);
      u.searchParams.set('query[course_id]', courseId);
      u.searchParams.set('page', String(page));
      u.searchParams.set('limit', '250');
      const r = await fetch(u.toString(), { headers });
      if (!r.ok) { await r.text(); break; }
      const d = await r.json();
      const items = d.items || [];
      completions.push(...items);
      const meta = d.meta?.pagination;
      const total = meta?.total_pages || 1;
      if (page >= total || items.length === 0) break;
      page++;
      if (page > 20) break;
    }

    const payload = buildProgress(
      Number(courseId),
      Number(userId),
      chapterItems,
      contentLists,
      completions,
      enrollment,
    );
    cache.set(cacheKey, { storedAt: Date.now(), payload });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('thinkific-user-course-progress error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});