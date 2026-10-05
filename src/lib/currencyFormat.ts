/**
 * Format an amount with the correct currency symbol.
 * UGX amounts are shown as integers (no decimals), USD with 2 decimals.
 */
export function fmtCurrency(amount: number, currency: string = "USD"): string {
  const cur = (currency || "USD").toUpperCase();
  if (cur === "UGX") {
    return `UGX ${Math.round(amount).toLocaleString()}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Group conversions by currency and sum a numeric field.
 * Returns a display string like "$200.00 / UGX 500,000"
 */
export function fmtMultiCurrency(
  items: Array<{ commission_amount: number; currency?: string }>,
  field: "commission_amount" | "order_amount" = "commission_amount"
): string {
  const byCurrency: Record<string, number> = {};
  items.forEach((item: any) => {
    const cur = (item.currency || "USD").toUpperCase();
    byCurrency[cur] = (byCurrency[cur] || 0) + Number(item[field] || 0);
  });
  const parts = Object.entries(byCurrency).map(([cur, total]) => fmtCurrency(total, cur));
  return parts.join(" / ") || "$0.00";
}
