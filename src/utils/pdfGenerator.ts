import { jsPDF } from "jspdf";
import { SavedDecision, DecisionItem } from "../types";

export function getOptionStats(decision: SavedDecision, optionName: string) {
  const { optionsAnalysis } = decision.analysis;
  
  // Pros
  const aiPros = optionsAnalysis.find(o => o.optionName === optionName)?.pros ?? [];
  const customPros = decision.customPros[optionName] ?? [];
  const pros = [...aiPros, ...customPros];

  // Cons
  const aiCons = optionsAnalysis.find(o => o.optionName === optionName)?.cons ?? [];
  const customCons = decision.customCons[optionName] ?? [];
  const cons = [...aiCons, ...customCons];

  // Calculate sum of pro weights
  let totalProWeight = 0;
  pros.forEach(p => {
    const w = decision.customProWeights[p.id] ?? p.impact;
    totalProWeight += w;
  });

  // Calculate sum of con weights
  let totalConWeight = 0;
  cons.forEach(c => {
    const w = decision.customConWeights[c.id] ?? c.impact;
    totalConWeight += w;
  });

  return {
    pros,
    cons,
    totalProWeight,
    totalConWeight,
    netScore: totalProWeight - totalConWeight
  };
}

class PDFContext {
  doc: jsPDF;
  y: number = 22;
  margin: number = 20;
  width: number = 210;
  height: number = 297;
  usableWidth: number = 170;
  pageCount: number = 1;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.drawHeader();
  }

  checkPageOverflow(neededHeight: number) {
    if (this.y + neededHeight > 265) {
      this.doc.addPage();
      this.pageCount++;
      this.y = 22;
      this.drawHeader();
    }
  }

  drawHeader() {
    // Top banner border rule
    this.doc.setDrawColor(226, 232, 240); // slate-200
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, 14, this.width - this.margin, 14);

    // Decorative tiny line to emphasize page design
    this.doc.setDrawColor(37, 99, 235); // primary blue
    this.doc.line(this.margin, 14, this.margin + 12, 14);

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(37, 99, 235); // primary blue
    this.doc.text("THE TIEBREAKER AI", this.margin, 10);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(148, 163, 184); // slate-400
    this.doc.text("Core Analytical Consensus Report", this.margin + 42, 10);
  }

  drawFooter() {
    const totalPages = this.pageCount;
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setDrawColor(241, 245, 249);
      this.doc.line(this.margin, 280, this.width - this.margin, 280);

      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text(
        `Page ${i} of ${totalPages}`,
        this.width - this.margin - 18,
        286
      );
      this.doc.text(
        "Confidential report generated securely on client local device.",
        this.margin,
        286
      );
    }
  }

  printText(
    text: string,
    fontSize: number = 10,
    style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
    color: [number, number, number] = [30, 41, 59],
    spacing: number = 4
  ): number {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    
    const lines: string[] = this.doc.splitTextToSize(text, this.usableWidth);
    const lineHeight = fontSize * 0.42; // standard spacing multiplier
    const neededHeight = lines.length * lineHeight + spacing;
    
    this.checkPageOverflow(neededHeight);
    
    lines.forEach((line) => {
      this.doc.text(line, this.margin, this.y);
      this.y += lineHeight;
    });
    
    this.y += spacing;
    return neededHeight;
  }

  printSectionHeader(title: string) {
    this.y += 4;
    this.checkPageOverflow(12);
    
    // Draw small visual line label indicator
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(this.margin, this.y - 4, 3, 5, "F");

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(11);
    this.doc.setTextColor(15, 23, 42); // slate-900
    this.doc.text(title, this.margin + 5, this.y);
    this.y += 2;

    this.doc.setDrawColor(226, 232, 240); // slate-200
    this.doc.line(this.margin, this.y, this.width - this.margin, this.y);
    this.y += 5;
  }
}

export function generateDecisionPDF(decision: SavedDecision) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const ctx = new PDFContext(doc);
  const analysis = decision.analysis;
  const formattedDate = new Date(decision.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ==================== COVER SECTION ====================
  ctx.y += 10;
  ctx.printText("DECISION DOSSIER", 9, "bold", [37, 99, 235], 0);
  ctx.y += 1;
  ctx.printText(analysis.title || "Dilemma Analysis Summary", 20, "bold", [15, 23, 42], 5);
  ctx.printText(`Dated Analysed: ${formattedDate}`, 9, "normal", [100, 116, 139], 10);

  // Core Dilemma Question Spotlight
  ctx.checkPageOverflow(30);
  ctx.doc.setFillColor(248, 250, 252); // slate-50
  ctx.doc.setDrawColor(226, 232, 240); // slate-200
  ctx.doc.roundedRect(ctx.margin, ctx.y, ctx.usableWidth, 24, 2, 2, "FD");

  // Border accent on left
  ctx.doc.setFillColor(37, 99, 235);
  ctx.doc.rect(ctx.margin, ctx.y, 1.5, 24, "F");

  // Adjust local cursor inside panel
  const originalY = ctx.y;
  ctx.y += 6;
  ctx.printText("Core Focal Dilemma:", 9, "bold", [37, 99, 235], 1);
  ctx.printText(`"${decision.question}"`, 9.5, "italic", [15, 23, 42], 0);
  ctx.y = originalY + 30; // resume cursor position after panel

  // Overview Introduction
  if (analysis.overview) {
    ctx.printText(analysis.overview, 10, "normal", [71, 85, 105], 8);
  }

  // ==================== SECTION 1: AI RECOMMENDATION / VERDICT ====================
  ctx.printSectionHeader("AI Focus & Prime Verdict");

  ctx.checkPageOverflow(38);
  ctx.doc.setFillColor(240, 253, 250); // emerald-50/10
  ctx.doc.setDrawColor(16, 185, 129); // emerald-500
  ctx.doc.roundedRect(ctx.margin, ctx.y, ctx.usableWidth, 34, 2, 2, "FD");

  // Border strip at left
  ctx.doc.setFillColor(16, 185, 129);
  ctx.doc.rect(ctx.margin, ctx.y, 2, 34, "F");

  const verdictY = ctx.y;
  ctx.y += 6;
  ctx.printText(`RECOMMENDED CHOICE: ${analysis.verdict.recommendedOption}`, 11, "bold", [6, 95, 70], 1.5);
  ctx.printText(`Consensus Confidence Gauge: ${analysis.verdict.confidenceScore}%`, 9, "bold", [4, 120, 87], 3);
  ctx.printText(`"${analysis.verdict.reasoning}"`, 9, "italic", [55, 65, 81], 0);
  ctx.y = verdictY + 40;

  // Confidence ring/meter drawn vectorially
  ctx.checkPageOverflow(26);
  ctx.y += 2;
  const confidenceX = ctx.margin + 4;
  const barWidth = ctx.usableWidth - 8;
  ctx.doc.setFillColor(241, 245, 249); // background track (slate-100)
  ctx.doc.roundedRect(confidenceX, ctx.y, barWidth, 6, 3, 3, "F");

  // Filled portion
  const percentage = analysis.verdict.confidenceScore;
  const filledWidth = (barWidth * percentage) / 100;
  ctx.doc.setFillColor(16, 185, 129); // emerald track filled
  ctx.doc.roundedRect(confidenceX, ctx.y, filledWidth, 6, 3, 3, "F");

  ctx.y += 8;
  ctx.printText("Consensus confidence highlights of the system parameters.", 8, "italic", [148, 163, 184], 4);

  // ==================== SECTION 2: PATH TILT & BALANCE LEDGER (VISUAL CHART) ====================
  ctx.printSectionHeader("Dynamic Balance & Weighted Ledger Chart");
  ctx.printText("Displays absolute weights for compared pathways. Pro values extend as positives, Cons values act as friction offsets. Scores adjust in real-time as customized.", 9.5, "normal", [100, 116, 139], 6);

  // Draw Horizontal Bar Chart of Option Stats
  analysis.options.forEach((optName) => {
    const stats = getOptionStats(decision, optName);
    ctx.checkPageOverflow(33);

    // Option title
    ctx.printText(optName.toUpperCase(), 9, "bold", [15, 23, 42], 2);

    // Track rows side by side
    const scaleFactor = 6.5; // multiplier for visualizing weights cleanly (max 25 * 6.5 = 162.5 usable width)
    const chartY = ctx.y;

    // Draw Pros bar in green
    const prosBarWidth = Math.min(stats.totalProWeight * scaleFactor, ctx.usableWidth / 2 - 10);
    ctx.doc.setFillColor(209, 250, 229); // light green
    ctx.doc.rect(ctx.margin, chartY, prosBarWidth, 5, "F");
    ctx.doc.setFontSize(8);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setTextColor(5, 150, 105);
    ctx.doc.text(`+${stats.totalProWeight} Pros`, ctx.margin + 2, chartY + 4);

    // Draw Cons bar in red/slate
    const consBarX = ctx.margin + ctx.usableWidth / 2 + 5;
    const consBarWidth = Math.min(stats.totalConWeight * scaleFactor, ctx.usableWidth / 2 - 10);
    ctx.doc.setFillColor(254, 226, 226); // light red
    ctx.doc.rect(consBarX, chartY, consBarWidth, 5, "F");
    ctx.doc.setTextColor(220, 38, 38);
    ctx.doc.text(`-${stats.totalConWeight} Cons`, consBarX + 2, chartY + 4);

    ctx.y += 8;

    // Net Ledger calculation
    const netColor: [number, number, number] = stats.netScore >= 0 ? [5, 150, 105] : [220, 38, 38];
    const sign = stats.netScore > 0 ? "+" : "";
    ctx.printText(`Net Path Leverage Score: ${sign}${stats.netScore}`, 8.5, "bold", netColor, 6);
  });

  // ==================== SECTION 3: SWOT QUADRANTS ====================
  ctx.printSectionHeader("SWOT Force Fields Mapping");
  ctx.printText("A grid analysis mapping both internal assets and direct external friction dynamics surrounding each pathway choice.", 9, "normal", [100, 116, 139], 6);

  analysis.optionsAnalysis.forEach((optAnal) => {
    ctx.checkPageOverflow(70);
    ctx.printText(`Pathway: ${optAnal.optionName}`, 11, "bold", [15, 23, 42], 4);

    // Draw SWOT boxes in a structured grid or full width list representation for legibility
    const swot = optAnal.swot;

    // 1. Strengths
    ctx.printText("  ✦ STRENGTHS (Internal advantages)", 9, "bold", [16, 185, 129], 1.5);
    if (swot.strengths.length > 0) {
      swot.strengths.forEach(s => ctx.printText(`    • ${s}`, 8.5, "normal", [71, 85, 105], 1));
    } else {
      ctx.printText("    • None identified", 8.5, "italic", [148, 163, 184], 1);
    }
    ctx.y += 2;

    // 2. Weaknesses
    ctx.checkPageOverflow(15);
    ctx.printText("  ✦ WEAKNESSES (Internal liabilities)", 9, "bold", [244, 63, 94], 1.5);
    if (swot.weaknesses.length > 0) {
      swot.weaknesses.forEach(w => ctx.printText(`    • ${w}`, 8.5, "normal", [71, 85, 105], 1));
    } else {
      ctx.printText("    • None identified", 8.5, "italic", [148, 163, 184], 1);
    }
    ctx.y += 2;

    // 3. Opportunities
    ctx.checkPageOverflow(15);
    ctx.printText("  ✦ OPPORTUNITIES (External growth prospects)", 9, "bold", [59, 130, 246], 1.5);
    if (swot.opportunities.length > 0) {
      swot.opportunities.forEach(o => ctx.printText(`    • ${o}`, 8.5, "normal", [71, 85, 105], 1));
    } else {
      ctx.printText("    • None identified", 8.5, "italic", [148, 163, 184], 1);
    }
    ctx.y += 2;

    // 4. Threats
    ctx.checkPageOverflow(15);
    ctx.printText("  ✦ THREATS (External hazards)", 9, "bold", [245, 158, 11], 1.5);
    if (swot.threats.length > 0) {
      swot.threats.forEach(t => ctx.printText(`    • ${t}`, 8.5, "normal", [71, 85, 105], 1));
    } else {
      ctx.printText("    • None identified", 8.5, "italic", [148, 163, 184], 1);
    }
    ctx.y += 6;
  });

  // ==================== SECTION 4: SIDE-BY-SIDE EVALUATION MATRIX ====================
  ctx.printSectionHeader("Objective Comparison Matrix");
  
  // Custom manual table drawing
  const tableRows = analysis.comparisonTable.rows;
  const colWidth = ctx.usableWidth / (analysis.options.length + 1);

  // Header row height
  ctx.checkPageOverflow(15);
  ctx.doc.setFillColor(241, 245, 249); // slate-100
  ctx.doc.rect(ctx.margin, ctx.y, ctx.usableWidth, 8, "F");
  
  // Table Headings
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(8.5);
  ctx.doc.setTextColor(15, 23, 42);
  ctx.doc.text("CRITERION", ctx.margin + 3, ctx.y + 5);

  analysis.options.forEach((opt, i) => {
    ctx.doc.text(
      opt.toUpperCase(),
      ctx.margin + colWidth * (i + 1) + 2,
      ctx.y + 5,
      { maxWidth: colWidth - 4 }
    );
  });
  ctx.y += 9;

  // Render Rows
  tableRows.forEach((row, rIdx) => {
    // Height estimation based on cells wrapped size
    const criterionLines = ctx.doc.splitTextToSize(row.criterion, colWidth - 4);
    const cellsLines = row.values.map(val => ctx.doc.splitTextToSize(val, colWidth - 4));
    const maxLines = Math.max(criterionLines.length, ...cellsLines.map(cl => cl.length));
    const rowHeight = maxLines * 4.5 + 4;

    ctx.checkPageOverflow(rowHeight + 4);

    // Striped row bg
    if (rIdx % 2 === 1) {
      ctx.doc.setFillColor(248, 250, 252);
      ctx.doc.rect(ctx.margin, ctx.y, ctx.usableWidth, rowHeight, "F");
    }

    // Border line bottom
    ctx.doc.setDrawColor(241, 245, 249);
    ctx.doc.line(ctx.margin, ctx.y + rowHeight, ctx.margin + ctx.usableWidth, ctx.y + rowHeight);

    // Draw Column 1 cell
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(8);
    ctx.doc.setTextColor(15, 23, 42);
    criterionLines.forEach((line: string, lineIdx: number) => {
      ctx.doc.text(line, ctx.margin + 3, ctx.y + 4 + lineIdx * 4);
    });

    // Draw Option cells
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setTextColor(71, 85, 105);
    row.values.forEach((val, i) => {
      const cellTextLines = cellsLines[i];
      cellTextLines.forEach((line: string, lineIdx: number) => {
        ctx.doc.text(line, ctx.margin + colWidth * (i + 1) + 2, ctx.y + 4 + lineIdx * 4);
      });
    });

    ctx.y += rowHeight + 1.5;
  });
  ctx.y += 5;

  // ==================== SECTION 5: ACTION ROAMDAP AND PIVOTS ====================
  ctx.printSectionHeader("Execution Plan & Strategic Pivots");

  // Pivots
  ctx.checkPageOverflow(25);
  ctx.printText("Cognitive Reflection Prompts:", 9.5, "bold", [15, 23, 42], 3);
  analysis.verdict.pivotQuestions.forEach((q, idx) => {
    ctx.printText(`  [0${idx + 1}]  ${q}`, 8.5, "normal", [71, 85, 105], 2);
  });
  ctx.y += 4;

  // Next steps
  ctx.checkPageOverflow(25);
  ctx.printText("Action Roadmap Checklist items:", 9.5, "bold", [15, 23, 42], 3);
  analysis.verdict.nextSteps.forEach((step, idx) => {
    ctx.printText(`  [  ]  ${step}`, 8.5, "normal", [71, 85, 105], 2);
  });

  // Finish and compute numbers
  ctx.drawFooter();

  // Trigger Save File
  const formattedFileName = `Tiebreaker_Report_${analysis.title.replace(/\s+/g, "_")}.pdf`;
  doc.save(formattedFileName);
}
