import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReferrerKind = "affiliate" | "discount_code";

export interface ReferrerBalance {
  key: string;
  kind: ReferrerKind;
  affiliateId: string | null;
  discountCodeId: string | null;
  label: string;
  email: string | null;
  currency: string;
  earned: number;
  paid: number;
  pending: number;
  outstanding: number;
  conversions: number;
}

export interface PayoutRecord {
  id: string;
  affiliate_id: string | null;
  discount_code_id: string | null;
  referrer_label: string | null;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  status: "pending" | "paid" | "failed";
  notes: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
}

export const EARNED_STATUSES = new Set(["approved", "paid", "completed"]);

export const usePayouts = () =>
  useQuery({
    queryKey: ["affiliate-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PayoutRecord[];
    },
  });

/**
 * Builds a commission balance per referrer per currency, combining
 * affiliate conversions and discount-code redemptions with recorded payouts.
 */
export const useReferrerBalances = () => {
  const payoutsQuery = usePayouts();

  const sourcesQuery = useQuery({
    queryKey: ["referrer-commission-sources"],
    queryFn: async () => {
      const [affiliates, conversions, codes, redemptions] = await Promise.all([
        supabase.from("affiliates").select("id, status, profiles(full_name, email)"),
        supabase.from("affiliate_conversions").select("affiliate_id, commission_amount, currency, status"),
        supabase.from("discount_codes").select("id, code, label, owner_name, owner_email"),
        supabase
          .from("discount_code_redemptions")
          .select("discount_code_id, commission_amount, currency, status"),
      ]);

      const firstError =
        affiliates.error || conversions.error || codes.error || redemptions.error;
      if (firstError) throw firstError;

      return {
        affiliates: affiliates.data || [],
        conversions: conversions.data || [],
        codes: codes.data || [],
        redemptions: redemptions.data || [],
      };
    },
  });

  const balances: ReferrerBalance[] = (() => {
    const src = sourcesQuery.data;
    if (!src) return [];
    const map = new Map<string, ReferrerBalance>();

    const upsert = (
      base: Omit<ReferrerBalance, "earned" | "paid" | "pending" | "outstanding" | "conversions" | "key">,
    ) => {
      const key = `${base.kind}:${base.affiliateId ?? base.discountCodeId}:${base.currency}`;
      let row = map.get(key);
      if (!row) {
        row = { ...base, key, earned: 0, paid: 0, pending: 0, outstanding: 0, conversions: 0 };
        map.set(key, row);
      }
      return row;
    };

    for (const conv of src.conversions as any[]) {
      if (!conv.affiliate_id || !EARNED_STATUSES.has(conv.status)) continue;
      const aff = (src.affiliates as any[]).find((a) => a.id === conv.affiliate_id);
      const row = upsert({
        kind: "affiliate",
        affiliateId: conv.affiliate_id,
        discountCodeId: null,
        label: aff?.profiles?.full_name || aff?.profiles?.email || "Affiliate",
        email: aff?.profiles?.email ?? null,
        currency: (conv.currency || "USD").toUpperCase(),
      });
      row.earned += Number(conv.commission_amount || 0);
      row.conversions += 1;
    }

    for (const red of src.redemptions as any[]) {
      if (!red.discount_code_id || !EARNED_STATUSES.has(red.status)) continue;
      const code = (src.codes as any[]).find((c) => c.id === red.discount_code_id);
      const row = upsert({
        kind: "discount_code",
        affiliateId: null,
        discountCodeId: red.discount_code_id,
        label: code ? `${code.owner_name || code.label || "Partner"} (${code.code})` : "Discount partner",
        email: code?.owner_email ?? null,
        currency: (red.currency || "USD").toUpperCase(),
      });
      row.earned += Number(red.commission_amount || 0);
      row.conversions += 1;
    }

    for (const payout of payoutsQuery.data || []) {
      const kind: ReferrerKind = payout.affiliate_id ? "affiliate" : "discount_code";
      const row = upsert({
        kind,
        affiliateId: payout.affiliate_id,
        discountCodeId: payout.discount_code_id,
        label: payout.referrer_label || "Referrer",
        email: null,
        currency: (payout.currency || "USD").toUpperCase(),
      });
      if (payout.status === "paid") row.paid += Number(payout.amount || 0);
      if (payout.status === "pending") row.pending += Number(payout.amount || 0);
    }

    return Array.from(map.values())
      .map((r) => ({ ...r, outstanding: Math.max(r.earned - r.paid - r.pending, 0) }))
      .sort((a, b) => b.outstanding - a.outstanding || b.earned - a.earned);
  })();

  return {
    balances,
    payouts: payoutsQuery.data || [],
    isLoading: sourcesQuery.isLoading || payoutsQuery.isLoading,
    error: sourcesQuery.error || payoutsQuery.error,
  };
};