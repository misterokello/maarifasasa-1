/**
 * Shared discount-code helpers for edge functions.
 * All amounts are in whole currency units (UGX) or whole dollars (USD)
 * unless stated otherwise.
 */

import { notifyPartner } from "./partnerNotify.ts";

export interface ResolvedDiscount {
  codeId: string;
  code: string;
  percentOff: number;
  commissionPercent: number;
}

export function applyDiscount(amount: number, percentOff: number): number {
  const discounted = amount - (amount * percentOff) / 100;
  return Math.max(0, Math.ceil(discounted));
}

/**
 * Resolve a discount code server-side for a given product.
 * Returns null when the code is missing, invalid, expired, capped or
 * not scoped to this product — the caller then charges full price.
 */
export async function resolveDiscountForProduct(
  supabase: any,
  rawCode: string | null | undefined,
  productId: string,
): Promise<ResolvedDiscount | null> {
  const code = (rawCode || "").trim();
  if (!code) return null;

  const { data: row, error } = await supabase
    .from("discount_codes")
    .select(
      "id, code, percent_off, commission_percent, is_active, starts_at, ends_at, max_redemptions, redemptions_count, applies_to_all_products",
    )
    .ilike("code", code)
    .maybeSingle();

  if (error) {
    console.error("[discount] lookup error", error);
    return null;
  }
  if (!row || !row.is_active) return null;

  const now = Date.now();
  if (row.starts_at && now < new Date(row.starts_at).getTime()) return null;
  if (row.ends_at && now > new Date(row.ends_at).getTime()) return null;
  if (row.max_redemptions != null && (row.redemptions_count ?? 0) >= row.max_redemptions) return null;

  if (!row.applies_to_all_products) {
    const { data: scope } = await supabase
      .from("discount_code_products")
      .select("id")
      .eq("discount_code_id", row.id)
      .eq("product_id", productId)
      .maybeSingle();
    if (!scope) return null;
  }

  return {
    codeId: row.id,
    code: row.code,
    percentOff: Number(row.percent_off),
    commissionPercent: Number(row.commission_percent ?? 0),
  };
}

/** Record a pending redemption for a payment created at checkout. */
export async function createPendingRedemption(
  supabase: any,
  params: {
    discount: ResolvedDiscount;
    paymentId: string;
    productId: string;
    userId?: string | null;
    payerEmail?: string | null;
    currency: string;
    originalAmount: number;
    chargedAmount: number;
  },
): Promise<void> {
  const discountAmount = Math.max(0, params.originalAmount - params.chargedAmount);
  const commissionAmount =
    Math.round(((params.chargedAmount * params.discount.commissionPercent) / 100) * 100) / 100;

  const { error } = await supabase.from("discount_code_redemptions").insert({
    discount_code_id: params.discount.codeId,
    payment_id: params.paymentId,
    product_id: params.productId,
    user_id: params.userId || null,
    payer_email: params.payerEmail || null,
    currency: params.currency,
    original_amount: params.originalAmount,
    discount_amount: discountAmount,
    charged_amount: params.chargedAmount,
    commission_percent: params.discount.commissionPercent,
    commission_amount: commissionAmount,
    status: "pending",
  });

  if (error) console.error("[discount] failed to record redemption", error);
}

/**
 * Mark a redemption as paid once the payment completes and roll the
 * counters up onto the code. Idempotent: only pending rows transition.
 */
export async function markRedemptionPaid(supabase: any, paymentId: string): Promise<void> {
  const { data: rows, error } = await supabase
    .from("discount_code_redemptions")
    .update({ status: "paid" })
    .eq("payment_id", paymentId)
    .eq("status", "pending")
    .select("id, discount_code_id, commission_amount, currency, charged_amount, product_id, payer_email");

  if (error) {
    console.error("[discount] failed to mark redemption paid", error);
    return;
  }
  const row = rows?.[0];
  if (!row) return;

  const { data: code } = await supabase
    .from("discount_codes")
    .select("redemptions_count, total_commission")
    .eq("id", row.discount_code_id)
    .maybeSingle();

  if (!code) return;

  await supabase
    .from("discount_codes")
    .update({
      redemptions_count: (code.redemptions_count ?? 0) + 1,
      total_commission: Number(code.total_commission ?? 0) + Number(row.commission_amount ?? 0),
    })
    .eq("id", row.discount_code_id);

  // Notify the partner: a referral paid, and a commission was earned.
  let productName: string | null = null;
  if (row.product_id) {
    const { data: prod } = await supabase
      .from("products")
      .select("name")
      .eq("id", row.product_id)
      .maybeSingle();
    productName = prod?.name ?? null;
  }

  await notifyPartner(supabase, row.discount_code_id, {
    event: "payment",
    personName: row.payer_email,
    productName,
    currency: row.currency,
    amount: Number(row.charged_amount ?? 0),
  });

  if (Number(row.commission_amount ?? 0) > 0) {
    await notifyPartner(supabase, row.discount_code_id, {
      event: "commission_earned",
      productName,
      currency: row.currency,
      commissionAmount: Number(row.commission_amount ?? 0),
    });
  }
}