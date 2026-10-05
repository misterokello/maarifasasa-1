import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const THINKIFIC_KEY = (Deno.env.get("THINKIFIC_API_ACCESS_TOKEN") ?? Deno.env.get("Thinkific"))
  ?.trim()
  .replace(/^Bearer\s+/i, "")
  .replace(/^["']|["']$/g, "");
const THINKIFIC_BASE = "https://api.thinkific.com/api/public/v1";

const SYSTEM_PROMPT = `You are the Maarifasasa Learning Pathway Advisor — a knowledgeable, warm, and honest career guide built by Maarifasasa Limited. Your role is to help learners in Africa's digital economy find the learning path most likely to get them to their specific career goal, given their real constraints.

You are not a salesperson. You do not recommend the most expensive option. You recommend the most honest fit. If no current product is a strong match, say so clearly.

Tone: direct, encouraging, grounded. Speak like a trusted senior colleague who knows the market.

## Maarifasasa context
Mission: 1 million jobs in Africa's digital economy by 2030. We operate three tracks:
- CERTIFICATES: self-paced, 4–12 weeks, 2–5 hrs/wk. For beginners exploring or upskillers building one specific skill. Honest limit: alone rarely lands a first job.
- BOOTCAMPS: cohort-based, 8–16 weeks, 10–20 hrs/wk. For learners moving from knowledge to job-ready ability. Honest limit: needs real time commitment.
- TALENT ACCELERATOR: full-time, 3–6 months, 30–40 hrs/wk. For full career transitions, recent graduates, sponsored learners, urgency ≤6 months. Honest limit: only works if learner can truly go full-time.

## Decision rules
1. Beginner + <5 hrs/wk → Certificate only; be honest a job isn't guaranteed.
2. Beginner + 5–15 hrs/wk + clear goal → Certificate then Bootcamp pathway.
3. Intermediate + career switch → Bootcamp.
4. Full-time + urgency ≤6mo → Talent Accelerator.
5. Employed + specific gap → Targeted Certificate or Bootcamp.
6. Business/freelance focus → Bootcamp/Accelerator with portfolio framing.
7. Budget-constrained → Start affordable; mention payment plans.
8. "Just exploring" → Certificate as low-commitment vehicle. Don't over-engineer pathway.

## Output
Use ONLY products from the provided catalog. Never invent slugs. Use the provided tool to return your structured recommendation.

Quality bar:
- Headline mentions learner's specific goal/situation (max 15 words).
- Reasoning cites specific wizard inputs (2–4 sentences).
- honest_caveat is REQUIRED and specific to this learner — not generic.
- pathway target month aligns with stated urgency.
- summary is 2–3 sentences in second person, ends with one concrete next action.
- 1–2 alternatives, at least one from a different category. If self-funding, include a lower-cost alternative.
- If no product fits well, set no_strong_match=true and provide no_match_guidance.`;

const tool = {
  type: "function",
  function: {
    name: "return_recommendation",
    description: "Return the structured learning pathway recommendation.",
    parameters: {
      type: "object",
      properties: {
        primary: {
          type: "object",
          properties: {
            product_slug: { type: "string" },
            fit_score: { type: "number", minimum: 1, maximum: 5 },
            headline: { type: "string" },
            reasoning: { type: "string" },
            outcomes: { type: "array", items: { type: "string" } },
            honest_caveat: { type: "string" },
          },
          required: ["product_slug", "fit_score", "headline", "reasoning", "outcomes", "honest_caveat"],
          additionalProperties: false,
        },
        alternatives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_slug: { type: "string" },
              fit_score: { type: "number", minimum: 1, maximum: 5 },
              vs_primary: { type: "string" },
              best_for: { type: "string" },
            },
            required: ["product_slug", "fit_score", "vs_primary", "best_for"],
            additionalProperties: false,
          },
        },
        pathway: {
          type: "array",
          items: {
            type: "object",
            properties: {
              month: { type: "number" },
              product_slug: { type: ["string", "null"] },
              milestone: { type: "string" },
              is_target: { type: "boolean" },
            },
            required: ["month", "product_slug", "milestone", "is_target"],
            additionalProperties: false,
          },
        },
        summary: { type: "string" },
        no_strong_match: { type: "boolean" },
        no_match_guidance: { type: ["string", "null"] },
      },
      required: ["primary", "alternatives", "pathway", "summary", "no_strong_match", "no_match_guidance"],
      additionalProperties: false,
    },
  },
};

async function fetchThinkificBrief(courseId: string) {
  if (!THINKIFIC_KEY) return null;
  try {
    const res = await fetch(`${THINKIFIC_BASE}/courses/${courseId}`, {
      headers: {
        "Authorization": `Bearer ${THINKIFIC_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      thinkific_description: (data.description || "").slice(0, 400),
      enrolled_student_count: data.user_count || 0,
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers } = await req.json();
    if (!answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ error: "answers required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("slug,name,category,description,price_ugx,price_usd,duration,thinkific_course_id,start_date")
      .eq("is_active", true);

    if (pErr || !products) {
      console.error("products fetch error", pErr);
      return new Response(JSON.stringify({ error: "Failed to load catalog" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enrich with Thinkific (parallel, capped at 8 to control latency)
    const enriched = await Promise.all(
      products.slice(0, 25).map(async (p: any) => {
        const brief = p.thinkific_course_id ? await fetchThinkificBrief(p.thinkific_course_id) : null;
        return {
          slug: p.slug,
          name: p.name,
          category: p.category,
          price_ugx: p.price_ugx,
          price_usd: p.price_usd,
          duration: p.duration,
          next_cohort_start: p.start_date,
          description: (p.description || "").slice(0, 600),
          ...(brief || {}),
        };
      })
    );

    const userMessage = `Learner inputs:\n${JSON.stringify(answers, null, 2)}\n\nProduct catalog:\n${JSON.stringify(enriched, null, 2)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_recommendation" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI error", aiRes.status, txt);
      if (aiRes.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiRes.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recommendation: any;
    try {
      recommendation = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("parse error", e);
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate slugs exist
    const validSlugs = new Set(enriched.map((p: any) => p.slug));
    if (recommendation.primary?.product_slug && !validSlugs.has(recommendation.primary.product_slug)) {
      console.warn("primary slug invalid:", recommendation.primary.product_slug);
      // Fallback: pick a sensible slug from catalog by category if possible
      const fallback = enriched.find((p: any) => p.category === "certificate") || enriched[0];
      if (fallback) recommendation.primary.product_slug = fallback.slug;
    }
    recommendation.alternatives = (recommendation.alternatives || []).filter((a: any) =>
      validSlugs.has(a.product_slug)
    );
    recommendation.pathway = (recommendation.pathway || []).map((step: any) =>
      step.product_slug && !validSlugs.has(step.product_slug) ? { ...step, product_slug: null } : step
    );

    // Attach full product objects for the frontend
    const productMap = Object.fromEntries(enriched.map((p: any) => [p.slug, p]));

    return new Response(
      JSON.stringify({ recommendation, products: productMap }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("advisor-recommend error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});