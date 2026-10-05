import { supabase } from "@/integrations/supabase/client";

export interface DiscountCodeRow {
  id: string;
  code: string;
  label: string | null;
  owner_user_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  percent_off: number;
  commission_percent: number;
  max_redemptions: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  applies_to_all_products: boolean;
  notes: string | null;
  clicks: number;
  signups_count: number;
  redemptions_count: number;
  total_commission: number;
  created_at: string;
  portal_invited_at: string | null;
  portal_reminded_at: string | null;
  portal_activated_at: string | null;
}

export interface DiscountApplicationRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  channel: string | null;
  audience_size: string | null;
  social_links: string | null;
  motivation: string | null;
  requested_code: string | null;
  status: "pending" | "approved" | "declined";
  decline_reason: string | null;
  discount_code_id: string | null;
  created_at: string;
}

export interface RedemptionRow {
  id: string;
  discount_code_id: string;
  payment_id: string | null;
  product_id: string | null;
  payer_email: string | null;
  currency: string;
  original_amount: number;
  discount_amount: number;
  charged_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

/** Turn a name into a clean, unique-ish code, e.g. "Jane Doe" -> "JANEDOE7K2". */
export function suggestCode(seed: string): string {
  const base = (seed || "PARTNER")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10) || "PARTNER";
  const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  return `${base}${suffix}`;
}

export async function fetchDiscountCodes(): Promise<DiscountCodeRow[]> {
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as DiscountCodeRow[];
}

export async function fetchCodeProductIds(codeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("discount_code_products")
    .select("product_id")
    .eq("discount_code_id", codeId);
  if (error) throw error;
  return (data || []).map((r: { product_id: string }) => r.product_id);
}

export async function setCodeProducts(codeId: string, productIds: string[]): Promise<void> {
  const { error: delErr } = await supabase
    .from("discount_code_products")
    .delete()
    .eq("discount_code_id", codeId);
  if (delErr) throw delErr;
  if (productIds.length === 0) return;
  const { error } = await supabase
    .from("discount_code_products")
    .insert(productIds.map((product_id) => ({ discount_code_id: codeId, product_id })));
  if (error) throw error;
}

export interface PartnerInviteResult {
  sent: number;
  skipped: number;
  failed: number;
  results: Array<{ code: string; email: string; status: string; detail?: string }>;
}

/**
 * Emails partners a link to create their password and open the Partner Portal.
 * mode "invite" targets the given codes; mode "remind" nudges every partner
 * who has not activated their portal login yet.
 */
export async function sendPartnerInvites(
  mode: "invite" | "remind",
  discountCodeIds: string[] = [],
): Promise<PartnerInviteResult> {
  const { data, error } = await supabase.functions.invoke("partner-invite", {
    body: { mode, discount_code_ids: discountCodeIds },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as PartnerInviteResult;
}