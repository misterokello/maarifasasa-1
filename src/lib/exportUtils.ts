/**
 * Utility functions for exporting data to CSV
 */

export const downloadCSV = (data: string, filename: string) => {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const convertToCSV = <T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string; formatter?: (value: unknown) => string }[]
): string => {
  if (data.length === 0) return "";

  const headers = columns.map((col) => `"${col.header}"`).join(",");
  
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value) : String(value ?? "");
        // Escape quotes and wrap in quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headers, ...rows].join("\n");
};

export const formatDateForCSV = (date: string | null | undefined): string => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

export const formatAmountForCSV = (amount: number, currency: string): string => {
  if (currency === "UGX") {
    return `UGX ${amount.toLocaleString()}`;
  }
  return `$${(amount / 100).toFixed(2)}`;
};
