// -----------------------------------------------------------------------------
// Client-side PDF generation for the DealSense board brief.
//
// Previously this went to POST /api/export-pdf which spawned a headless
// Chromium via Puppeteer. That made the backend unfit for serverless
// deployment (~300MB bundle, slow cold starts). jsPDF is ~300KB, runs entirely
// in the browser, and has zero backend dependency — so the PDF still works
// even if the scoring API is down.
// -----------------------------------------------------------------------------
import { jsPDF } from 'jspdf';

type AnalysisPayload = {
  dealRiskScore?: number;
  esgComplianceScore?: number;
  marketPositionScore?: number;
  narrative?: string;
  context?: {
    address?: string;
    countryName?: string;
    assetClass?: string;
    numBuildings?: number;
    envelope?: string;
    rateType?: string;
  };
  carbonData?: {
    footprintTonnes?: number;
    intensityKgPerSqm?: number;
    crremTarget?: number;
    scope1?: number;
    scope2?: number;
    scope3?: number;
    status?: string;
  };
  dealRiskBreakdown?: Array<{ factor: string; finding: string; severity: string; action: string }>;
  esgComplianceDetail?: Array<{ framework: string; status: string; note?: string }>;
  actionPlan?: Array<{
    title: string;
    description?: string;
    co2Saving?: number;
    dollarSaving?: number;
    cost?: number;
    payback?: number;
  }>;
};

function slugify(s: string): string {
  return (s || 'deal_brief')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'deal_brief';
}

const COLORS = {
  ink: '#161b24',
  muted: '#5f6672',
  line: '#d7dae0',
  accent: '#0a0b0e',
  green: '#2e7d32',
  amber: '#b26a00',
  red: '#b42318',
  zebra: '#f7f8fa',
};

function severityColor(sev?: string): string {
  const s = (sev || '').toLowerCase();
  if (s.includes('high') || s === 'gap' || s === 'red') return COLORS.red;
  if (s.includes('med') || s.includes('partial') || s === 'amber') return COLORS.amber;
  if (s.includes('pass') || s.includes('low') || s === 'green') return COLORS.green;
  return COLORS.muted;
}

function buildPdf(payload: AnalysisPayload): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const setText = (color: string) => doc.setTextColor(color);

  // ------------------------------------------------------------ Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setText(COLORS.accent);
  doc.text('DealSense Executive Brief', margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setText(COLORS.muted);
  const subLine = [
    payload.context?.address,
    payload.context?.countryName,
    payload.context?.assetClass,
  ].filter(Boolean).join('  ·  ');
  if (subLine) {
    doc.text(subLine, margin, y);
    y += 14;
  }
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 22;

  // ------------------------------------------------------------ Score tiles
  const scores: Array<[string, number | undefined]> = [
    ['Deal Risk', payload.dealRiskScore],
    ['ESG Compliance', payload.esgComplianceScore],
    ['Market Position', payload.marketPositionScore],
  ];
  const tileW = (contentWidth - 20) / 3;
  const tileH = 60;
  scores.forEach(([label, val], i) => {
    const x = margin + i * (tileW + 10);
    doc.setFillColor(22, 27, 36);
    doc.roundedRect(x, y, tileW, tileH, 6, 6, 'F');
    setText('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(String(val ?? '—'), x + 14, y + 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, x + 14, y + 50);
  });
  y += tileH + 22;

  // ------------------------------------------------------------ Narrative
  if (payload.narrative) {
    ensureSpace(80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setText(COLORS.accent);
    doc.text('Narrative', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setText(COLORS.ink);
    const lines = doc.splitTextToSize(payload.narrative, contentWidth) as string[];
    lines.forEach(line => {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 12;
    });
    y += 10;
  }

  // ------------------------------------------------------------ Carbon footprint card
  if (payload.carbonData) {
    ensureSpace(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setText(COLORS.accent);
    doc.text('Carbon Footprint', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setText(COLORS.ink);
    const c = payload.carbonData;
    const parts = [
      `Total: ${c.footprintTonnes ?? '—'} tCO₂e/yr`,
      `Intensity: ${c.intensityKgPerSqm ?? '—'} kg/sqm`,
      `CRREM 2030: ${c.crremTarget ?? '—'}`,
      `Status: ${(c.status || '—').toUpperCase()}`,
    ];
    doc.text(parts.join('    ·    '), margin, y);
    y += 14;
    const scopeLine = `Scope 1: ${c.scope1 ?? 0}   ·   Scope 2: ${c.scope2 ?? 0}   ·   Scope 3: ${c.scope3 ?? 0}   (tCO₂e)`;
    setText(COLORS.muted);
    doc.text(scopeLine, margin, y);
    y += 20;
  }

  // ------------------------------------------------------------ Helper: table renderer
  const renderTable = (
    title: string,
    columns: Array<{ header: string; key: string; width: number; colorKey?: string }>,
    rows: any[]
  ) => {
    if (!rows || rows.length === 0) return;
    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setText(COLORS.accent);
    doc.text(title, margin, y);
    y += 14;

    const totalRatio = columns.reduce((s, c) => s + c.width, 0);
    const colXs: number[] = [];
    let cursorX = margin;
    columns.forEach(col => {
      colXs.push(cursorX);
      cursorX += (col.width / totalRatio) * contentWidth;
    });
    const rowHeight = 18;

    // Header row
    doc.setFillColor(240, 242, 245);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setText(COLORS.ink);
    columns.forEach((col, i) => {
      doc.text(col.header, colXs[i] + 6, y + 12);
    });
    y += rowHeight;

    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(215, 218, 224);

    rows.forEach((row, idx) => {
      // Wrap cell content to compute row height
      const cellLines: string[][] = columns.map((col) => {
        const w = ((col.width / totalRatio) * contentWidth) - 12;
        const raw = row[col.key] == null ? '' : String(row[col.key]);
        return doc.splitTextToSize(raw, w) as string[];
      });
      const thisRowHeight = Math.max(rowHeight, 4 + cellLines.reduce((m, ls) => Math.max(m, ls.length * 11), 0) + 6);
      ensureSpace(thisRowHeight + 2);

      if (idx % 2 === 0) {
        doc.setFillColor(247, 248, 250);
        doc.rect(margin, y, contentWidth, thisRowHeight, 'F');
      }

      columns.forEach((col, i) => {
        if (col.colorKey) {
          setText(severityColor(row[col.colorKey]));
          doc.setFont('helvetica', 'bold');
        } else {
          setText(COLORS.ink);
          doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(9);
        cellLines[i].forEach((line, li) => {
          doc.text(line, colXs[i] + 6, y + 12 + li * 11);
        });
      });

      doc.setDrawColor(225, 228, 233);
      doc.line(margin, y + thisRowHeight, margin + contentWidth, y + thisRowHeight);
      y += thisRowHeight;
    });
    y += 14;
  };

  // ------------------------------------------------------------ Risk breakdown
  renderTable(
    'Risk Breakdown',
    [
      { header: 'Factor', key: 'factor', width: 2 },
      { header: 'Finding', key: 'finding', width: 3 },
      { header: 'Severity', key: 'severity', width: 1, colorKey: 'severity' },
      { header: 'Action', key: 'action', width: 3 },
    ],
    payload.dealRiskBreakdown || []
  );

  // ------------------------------------------------------------ Compliance
  renderTable(
    'Regulatory Applicability',
    [
      { header: 'Framework', key: 'framework', width: 2 },
      { header: 'Status', key: 'status', width: 1, colorKey: 'status' },
      { header: 'Note', key: 'note', width: 4 },
    ],
    payload.esgComplianceDetail || []
  );

  // ------------------------------------------------------------ Action plan
  const actionRows = (payload.actionPlan || []).map(a => ({
    title: a.title,
    co2: a.co2Saving ?? 0,
    savings: `$${(a.dollarSaving ?? 0).toLocaleString()}`,
    cost: `$${(a.cost ?? 0).toLocaleString()}`,
    payback: `${a.payback ?? '—'}y`,
  }));
  renderTable(
    'Action Plan',
    [
      { header: 'Action', key: 'title', width: 4 },
      { header: 'CO₂ t/yr', key: 'co2', width: 1 },
      { header: '$/yr', key: 'savings', width: 1.5 },
      { header: 'Cost', key: 'cost', width: 1.5 },
      { header: 'Payback', key: 'payback', width: 1 },
    ],
    actionRows
  );

  // ------------------------------------------------------------ Footer on every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    setText(COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`DealSense · Board Brief · Page ${p}/${pageCount}`, margin, pageHeight - 18);
  }

  return doc;
}

export async function downloadBrief(payload: AnalysisPayload, filenameHint?: string): Promise<void> {
  const doc = buildPdf(payload);
  const name = slugify(filenameHint || payload.context?.address || 'deal_brief');
  doc.save(`${name}.pdf`);
}

export async function previewBrief(payload: AnalysisPayload): Promise<void> {
  const doc = buildPdf(payload);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
