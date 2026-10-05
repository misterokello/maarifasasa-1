import * as XLSX from "xlsx";
import { format } from "date-fns";

export interface ExcelColumn<T> {
  key: keyof T;
  header: string;
  formatter?: (value: unknown) => string | number;
  width?: number;
}

export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  columns: ExcelColumn<T>[],
  filename: string,
  sheetName: string = "Data"
): void => {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Create worksheet data with headers
  const headers = columns.map((col) => col.header);
  
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (col.formatter) {
        return col.formatter(value);
      }
      return value ?? "";
    })
  );

  const worksheetData = [headers, ...rows];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length, 15),
  }));
  worksheet["!cols"] = colWidths;

  // Style the header row (basic styling - xlsx-style would be needed for more)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename with timestamp
  const timestampedFilename = `${filename}-${format(new Date(), "yyyy-MM-dd-HHmmss")}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, timestampedFilename);
};

export const exportAnalyticsToExcel = (
  data: Array<{ date: string; name: string; success: number; pending: number; failed: number; views: number }>,
  dateRange: string
): void => {
  const columns: ExcelColumn<typeof data[0]>[] = [
    { key: "date", header: "Date", width: 12 },
    { key: "name", header: "Day", width: 10 },
    { key: "success", header: "Successful Payments", width: 20 },
    { key: "pending", header: "Pending Payments", width: 18 },
    { key: "failed", header: "Failed Payments", width: 16 },
    { key: "views", header: "Blog Views", width: 15 },
  ];

  exportToExcel(data, columns, `platform-analytics-${dateRange}`, "Analytics");
};
