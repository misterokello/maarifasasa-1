import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fmtCurrency } from "@/lib/currencyFormat";

interface AffiliatePDFData {
  affiliate: any;
  links: any[];
  conversions: any[];
  stats: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: string;
    pendingAmount: string;
    approvedAmount: string;
    paidAmount: string;
    totalEarnings: string;
    totalPaid: string;
  };
}

export function generateAffiliatePDF({ affiliate, links, conversions, stats }: AffiliatePDFData) {
  const doc = new jsPDF();
  const name = affiliate.profiles?.full_name || affiliate.profiles?.email || "Affiliate";
  const now = format(new Date(), "MMM d, yyyy 'at' h:mm a");

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text("Affiliate Performance Report", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`${name}`, 14, 30);
  doc.text(`Generated: ${now}`, 14, 36);

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, 196, 40);

  // Profile info
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Profile Information", 14, 50);

  const profileData = [
    ["Name", name],
    ["Email", affiliate.profiles?.email || "—"],
    ["Phone", affiliate.profiles?.phone || "—"],
    ["Location", affiliate.profiles?.location || "—"],
    ["Status", affiliate.status || "—"],
    ["Joined", format(new Date(affiliate.created_at), "MMM d, yyyy")],
    ["Payout Method", affiliate.payout_method || "Not set"],
    ["Commission Override", affiliate.commission_rate_override ? `${affiliate.commission_rate_override}%` : "Default"],
  ];

  autoTable(doc, {
    startY: 54,
    head: [],
    body: profileData,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, textColor: [100, 100, 100] },
      1: { cellWidth: 130 },
    },
  });

  // Performance summary
  const summaryY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.text("Performance Summary", 14, summaryY);

  const summaryData = [
    ["Total Earnings", stats.totalEarnings],
    ["Total Paid", stats.totalPaid],
    ["Pending Commissions", stats.pendingAmount],
    ["Approved Commissions", stats.approvedAmount],
    ["Paid Commissions", stats.paidAmount],
    ["Total Clicks", stats.totalClicks.toLocaleString()],
    ["Total Conversions", stats.totalConversions.toString()],
    ["Conversion Rate", `${stats.conversionRate}%`],
  ];

  autoTable(doc, {
    startY: summaryY + 4,
    head: [],
    body: summaryData,
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: 50 },
    },
  });

  // Links table
  if (links.length > 0) {
    const linksY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.text(`Referral Links (${links.length})`, 14, linksY);

    autoTable(doc, {
      startY: linksY + 4,
      head: [["Product", "Code", "Clicks", "Created"]],
      body: links.map((l: any) => [
        l.products?.name || "—",
        l.code,
        l.clicks.toString(),
        format(new Date(l.created_at), "MMM d, yyyy"),
      ]),
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [50, 50, 50] },
    });
  }

  // Conversions table
  if (conversions.length > 0) {
    const convY = (doc as any).lastAutoTable.finalY + 12;

    // Check if we need a new page
    if (convY > 250) doc.addPage();
    const startY = convY > 250 ? 20 : convY;

    doc.setFontSize(13);
    doc.text(`Conversions (${conversions.length})`, 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [["Date", "Product", "Currency", "Order", "Commission", "Status"]],
      body: conversions.map((c: any) => [
        format(new Date(c.created_at), "MMM d, yyyy"),
        c.products?.name || "—",
        (c.currency || "USD").toUpperCase(),
        fmtCurrency(Number(c.order_amount), c.currency),
        fmtCurrency(Number(c.commission_amount), c.currency),
        c.status,
      ]),
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [50, 50, 50] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount} — Maarifasasa Affiliate Report`, 14, 290);
  }

  const fileName = `affiliate-report-${name.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}
