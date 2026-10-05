// Shared helpers for Phase 4 identity-first enrollment.
// These are called from payment webhooks (stripe-webhook, iotec-status)
// after a payment reaches "success". They:
//   1. Insert / upsert a local `enrollments` row (source of truth).
//   2. Enqueue a `thinkific_sync_queue` job for the background worker.
//   3. Fire-and-forget invoke the `thinkific-sync` edge function so the
//      learner gets access as fast as possible, while the cron drain
//      remains the retry safety net.
//
// This decouples payment success from Thinkific API uptime — Thinkific can
// be down and the payment / enrollment record stays consistent locally.

// deno-lint-ignore-file no-explicit-any

export interface EnqueueContext {
  payment: Record<string, any>;
  product: Record<string, any> | null;
}

export async function enqueueEnrollment(
  supabase: any,
  { payment, product }: EnqueueContext,
): Promise<{ enrollmentId: string | null; queueId: string | null }> {
  if (!product?.thinkific_course_id) {
    console.log("[enrollments] product has no thinkific_course_id, skipping");
    return { enrollmentId: null, queueId: null };
  }

  const customerEmail = (payment.payer_email || "").toLowerCase().trim();
  if (!customerEmail) {
    console.log("[enrollments] payment has no payer_email");
    return { enrollmentId: null, queueId: null };
  }

  // Resolve the local Maarifasasa profile that owns this email.
  // Identity-first checkout guarantees this exists for new orders.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, thinkific_user_id")
    .ilike("email", customerEmail)
    .maybeSingle();

  if (!profile?.id) {
    console.warn("[enrollments] no local profile for", customerEmail);
    // Still enqueue — worker will retry once profile lands (rare edge case
    // for legacy guest checkout).
  }

  let enrollmentId: string | null = null;
  if (profile?.id) {
    // Upsert on the unique (user_id, thinkific_course_id) constraint.
    const { data: enrollment, error: enrollErr } = await supabase
      .from("enrollments")
      .upsert(
        {
          user_id: profile.id,
          product_id: product.id,
          thinkific_course_id: String(product.thinkific_course_id),
          payment_id: payment.id,
          status: "pending_sync",
          metadata: { source: "payment_webhook" },
        },
        { onConflict: "user_id,thinkific_course_id" },
      )
      .select("id")
      .maybeSingle();

    if (enrollErr) {
      console.error("[enrollments] upsert enrollment failed:", enrollErr);
    } else {
      enrollmentId = enrollment?.id ?? null;
    }
  }

  // Enqueue the sync job (idempotent — worker checks enrollment state).
  const { data: queueRow, error: queueErr } = await supabase
    .from("thinkific_sync_queue")
    .insert({
      kind: "enroll",
      payload: {
        payment_id: payment.id,
        product_id: product.id,
        course_id: String(product.thinkific_course_id),
        email: customerEmail,
        full_name: payment.payer_name || "",
        phone: payment.payer_phone || null,
        country: payment.metadata?.country || null,
      },
      related_enrollment_id: enrollmentId,
      related_user_id: profile?.id ?? null,
    })
    .select("id")
    .maybeSingle();

  if (queueErr) {
    console.error("[enrollments] enqueue failed:", queueErr);
    return { enrollmentId, queueId: null };
  }

  const queueId = queueRow?.id ?? null;

  // Fire-and-forget: invoke the sync worker so the learner gets access
  // quickly. If this call fails, the cron drain will pick it up.
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
    // Do NOT await — keep webhook fast.
    fetch(`${supabaseUrl}/functions/v1/thinkific-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({ queue_id: queueId }),
    }).catch((err) =>
      console.error("[enrollments] worker kick failed (cron will retry):", err),
    );
  } catch (err) {
    console.error("[enrollments] worker kick threw (cron will retry):", err);
  }

  return { enrollmentId, queueId };
}