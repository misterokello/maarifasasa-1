import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdvisorAnswers, AdvisorProductBrief, Recommendation } from "@/types/advisor";

const CATEGORY_LABEL: Record<string, string> = {
  certificate: "Certificate",
  bootcamp: "Bootcamp",
  program: "Talent Accelerator",
};

// Brand colours (RGB)
const INDIGO: [number, number, number] = [99, 102, 241];
const PURPLE: [number, number, number] = [139, 92, 246];
const TEAL: [number, number, number] = [20, 184, 166];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_700: [number, number, number] = [51, 65, 85];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_200: [number, number, number] = [226, 232, 240];
const AMBER_50: [number, number, number] = [255, 251, 235];
const AMBER_700: [number, number, number] = [180, 83, 9];

function fmtUGX(n: number) {
  return `UGX ${Math.round(n).toLocaleString()}`;
}
function fmtUSD(n: number) {
  return `$${n.toFixed(0)}`;
}

function setColor(doc: jsPDF, kind: "fill" | "text" | "draw", c: [number, number, number]) {
  if (kind === "fill") doc.setFillColor(c[0], c[1], c[2]);
  else if (kind === "text") doc.setTextColor(c[0], c[1], c[2]);
  else doc.setDrawColor(c[0], c[1], c[2]);
}

function drawGradientHeader(doc: jsPDF, pageW: number, height: number) {
  // Approximate horizontal gradient via vertical bands
  const bands = 60;
  const bandW = pageW / bands;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const k = t / 0.5;
      r = INDIGO[0] + (PURPLE[0] - INDIGO[0]) * k;
      g = INDIGO[1] + (PURPLE[1] - INDIGO[1]) * k;
      b = INDIGO[2] + (PURPLE[2] - INDIGO[2]) * k;
    } else {
      const k = (t - 0.5) / 0.5;
      r = PURPLE[0] + (TEAL[0] - PURPLE[0]) * k;
      g = PURPLE[1] + (TEAL[1] - PURPLE[1]) * k;
      b = PURPLE[2] + (TEAL[2] - PURPLE[2]) * k;
    }
    doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
    doc.rect(i * bandW, 0, bandW + 0.5, height, "F");
  }
}

function ensureSpace(doc: jsPDF, cursorY: number, needed: number, pageH: number, marginBottom = 50): number {
  if (cursorY + needed > pageH - marginBottom) {
    doc.addPage();
    return 60;
  }
  return cursorY;
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, shareUrl?: string) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    setColor(doc, "draw", SLATE_200);
    doc.setLineWidth(0.5);
    doc.line(40, pageH - 36, pageW - 40, pageH - 36);
    doc.setFontSize(9);
    setColor(doc, "text", SLATE_500);
    doc.text("Maarifasasa — Knowledge Now. Opportunity Everywhere.", 40, pageH - 22);
    if (shareUrl && i === total) {
      const txt = `View online: ${shareUrl}`;
      const w = doc.getTextWidth(txt);
      doc.text(txt, pageW - 40 - w, pageH - 22);
    }
    doc.text(`${i} / ${total}`, pageW - 40 - doc.getTextWidth(`${i} / ${total}`), pageH - 8);
  }
}

export function generateAdvisorPdf(opts: {
  fullName?: string | null;
  recommendation: Recommendation;
  products: Record<string, AdvisorProductBrief>;
  answers: AdvisorAnswers;
  shareUrl?: string;
}): jsPDF {
  const { fullName, recommendation, products, answers, shareUrl } = opts;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;

  // ====== Header band ======
  drawGradientHeader(doc, pageW, 130);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, "text", [255, 255, 255]);
  doc.text("MAARIFASASA · LEARNING PATHWAY", margin, 38);
  doc.setFontSize(22);
  doc.text("Your Personal Pathway", margin, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const subtitle = fullName
    ? `Prepared for ${fullName} · ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`
    : `Prepared on ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`;
  doc.text(subtitle, margin, 92);
  doc.setFontSize(10);
  doc.text("AI-generated recommendation · Knowledge Now. Opportunity Everywhere.", margin, 110);

  let y = 160;

  // ====== Summary block ======
  if (recommendation.summary) {
    setColor(doc, "fill", [248, 250, 252]);
    doc.roundedRect(margin, y, contentW, 0, 8, 8, "F");
    setColor(doc, "text", SLATE_900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Your summary", margin + 16, y + 22);
    doc.setFont("helvetica", "normal");
    setColor(doc, "text", SLATE_700);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(recommendation.summary, contentW - 32);
    const blockH = 36 + lines.length * 14;
    setColor(doc, "fill", [248, 250, 252]);
    doc.roundedRect(margin, y, contentW, blockH, 8, 8, "F");
    setColor(doc, "text", SLATE_900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Your summary", margin + 16, y + 22);
    doc.setFont("helvetica", "normal");
    setColor(doc, "text", SLATE_700);
    doc.setFontSize(11);
    doc.text(lines, margin + 16, y + 40);
    y += blockH + 20;
  }

  // ====== Primary recommendation ======
  const primary = recommendation.primary;
  const primaryProduct = primary ? products[primary.product_slug] : null;
  if (primary && primaryProduct) {
    y = ensureSpace(doc, y, 200, pageH);
    // Title strip
    setColor(doc, "fill", INDIGO);
    doc.roundedRect(margin, y, contentW, 28, 6, 6, "F");
    setColor(doc, "text", [255, 255, 255]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("BEST FIT FOR YOU", margin + 14, y + 18);
    const stars = "★".repeat(primary.fit_score) + "☆".repeat(Math.max(0, 5 - primary.fit_score));
    const starsW = doc.getTextWidth(stars);
    doc.text(stars, pageW - margin - 14 - starsW, y + 18);
    y += 40;

    // Card body
    setColor(doc, "text", SLATE_900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const nameLines = doc.splitTextToSize(primaryProduct.name, contentW);
    doc.text(nameLines, margin, y);
    y += nameLines.length * 22;

    setColor(doc, "text", SLATE_500);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const metaParts = [
      CATEGORY_LABEL[primaryProduct.category] || primaryProduct.category,
      primaryProduct.duration || null,
      `${fmtUGX(primaryProduct.price_ugx)} · ${fmtUSD(primaryProduct.price_usd)}`,
    ].filter(Boolean) as string[];
    doc.text(metaParts.join("  ·  "), margin, y);
    y += 18;

    if (primary.headline) {
      setColor(doc, "text", SLATE_700);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      const hl = doc.splitTextToSize(primary.headline, contentW);
      doc.text(hl, margin, y);
      y += hl.length * 14 + 6;
    }

    // Reasoning
    y = ensureSpace(doc, y, 60, pageH);
    setColor(doc, "text", SLATE_900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Why this fits you", margin, y);
    y += 16;
    setColor(doc, "text", SLATE_700);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const reason = doc.splitTextToSize(primary.reasoning || "", contentW);
    doc.text(reason, margin, y);
    y += reason.length * 14 + 14;

    // Outcomes
    if (primary.outcomes?.length) {
      y = ensureSpace(doc, y, 40 + primary.outcomes.length * 16, pageH);
      setColor(doc, "text", SLATE_900);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("What you'll achieve", margin, y);
      y += 16;
      setColor(doc, "text", SLATE_700);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      primary.outcomes.forEach((o) => {
        const lines = doc.splitTextToSize(`•  ${o}`, contentW - 8);
        y = ensureSpace(doc, y, lines.length * 14 + 4, pageH);
        doc.text(lines, margin + 4, y);
        y += lines.length * 14 + 2;
      });
      y += 8;
    }

    // Honest caveat
    if (primary.honest_caveat) {
      const caveatLines = doc.splitTextToSize(primary.honest_caveat, contentW - 32);
      const blockH = 28 + caveatLines.length * 14;
      y = ensureSpace(doc, y, blockH + 10, pageH);
      setColor(doc, "fill", AMBER_50);
      doc.roundedRect(margin, y, contentW, blockH, 6, 6, "F");
      setColor(doc, "text", AMBER_700);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("AN HONEST NOTE", margin + 16, y + 18);
      setColor(doc, "text", SLATE_900);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(caveatLines, margin + 16, y + 34);
      y += blockH + 18;
    }
  }

  // ====== Alternatives ======
  if (recommendation.alternatives?.length) {
    y = ensureSpace(doc, y, 60, pageH);
    setColor(doc, "text", SLATE_900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Other paths to consider", margin, y);
    y += 18;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Programme", "vs Primary", "Best for", "Price"]],
      body: recommendation.alternatives
        .map((alt) => {
          const p = products[alt.product_slug];
          if (!p) return null;
          return [
            `${p.name}\n${CATEGORY_LABEL[p.category] || p.category}`,
            alt.vs_primary || "",
            alt.best_for || "",
            `${fmtUGX(p.price_ugx)}\n${fmtUSD(p.price_usd)}`,
          ];
        })
        .filter(Boolean) as string[][],
      styles: { font: "helvetica", fontSize: 9, cellPadding: 8, valign: "top", textColor: SLATE_700 },
      headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 130, fontStyle: "bold", textColor: SLATE_900 },
        1: { cellWidth: 145 },
        2: { cellWidth: 145 },
        3: { cellWidth: contentW - 130 - 145 - 145 },
      },
    });
    // @ts-expect-error – lastAutoTable injected by plugin
    y = doc.lastAutoTable.finalY + 20;
  }

  // ====== Pathway timeline ======
  if (recommendation.pathway?.length) {
    y = ensureSpace(doc, y, 60, pageH);
    setColor(doc, "text", SLATE_900);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Your 6–12 month roadmap", margin, y);
    y += 18;

    const sorted = [...recommendation.pathway].sort((a, b) => a.month - b.month);
    sorted.forEach((step) => {
      const product = step.product_slug ? products[step.product_slug] : null;
      const label = step.month === 0 ? "Today" : `Month ${step.month}`;
      const milestoneLines = doc.splitTextToSize(step.milestone || "", contentW - 90);
      const productLine = product ? `→ ${product.name}` : "";
      const blockH = 18 + milestoneLines.length * 14 + (productLine ? 14 : 0) + 6;
      y = ensureSpace(doc, y, blockH + 6, pageH);

      // Bullet
      const bulletColor = step.is_target ? ([245, 158, 11] as [number, number, number]) : INDIGO;
      setColor(doc, "fill", bulletColor);
      doc.circle(margin + 8, y + 6, 6, "F");
      // Connector line
      setColor(doc, "draw", SLATE_200);
      doc.setLineWidth(1);
      doc.line(margin + 8, y + 14, margin + 8, y + blockH + 4);

      // Label
      setColor(doc, "text", SLATE_500);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(label.toUpperCase() + (step.is_target ? "  ·  YOUR GOAL" : ""), margin + 24, y + 8);

      // Milestone
      setColor(doc, "text", SLATE_900);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(milestoneLines, margin + 24, y + 22);

      if (productLine) {
        setColor(doc, "text", SLATE_500);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text(productLine, margin + 24, y + 22 + milestoneLines.length * 14);
      }

      y += blockH;
    });
    y += 14;
  }

  // ====== Your inputs ======
  y = ensureSpace(doc, y, 80, pageH);
  setColor(doc, "text", SLATE_900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Your inputs", margin, y);
  y += 14;

  const labelMap: Record<string, string> = {
    career_goal: "Career goal",
    interest_area: "Interest area",
    skill_level: "Skill level",
    time_commitment: "Time commitment",
    funding_situation: "Funding",
    urgency: "Urgency",
    interest_area_freetext: "Interest details",
    freetext_context: "Context",
  };
  const rows: string[][] = Object.entries(answers as unknown as Record<string, string | undefined>)
    .filter(([, v]) => v && String(v).trim().length > 0)
    .map(([k, v]) => [labelMap[k] || k, String(v).replace(/_/g, " ")]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: rows,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6, textColor: SLATE_700 },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: "bold", textColor: SLATE_900 },
      1: { cellWidth: contentW - 140 },
    },
    theme: "grid",
    tableLineColor: SLATE_200,
    tableLineWidth: 0.5,
  });

  drawFooter(doc, pageW, pageH, shareUrl);
  return doc;
}

export function downloadAdvisorPdf(opts: Parameters<typeof generateAdvisorPdf>[0] & { filename?: string }) {
  const doc = generateAdvisorPdf(opts);
  const safeName = (opts.fullName || "learner").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  const filename = opts.filename || `maarifasasa-pathway-${safeName}.pdf`;
  doc.save(filename);
}