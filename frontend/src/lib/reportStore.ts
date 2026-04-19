// Lightweight localStorage-backed store of completed analyses so that
// the Reports tab can re-open / re-download their PDFs later.

export type SavedReport = {
  id: string;
  property: string;
  date: string;            // ISO timestamp
  dealRisk: number;
  esg: number;
  co2Saving: number;
  topRisk: string;
  payload: any;            // full backend response used to re-render the PDF
};

const KEY = 'dealsense.reports.v1';
const MAX = 50;

export function loadSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedReports(rs: SavedReport[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rs.slice(0, MAX)));
  } catch {
    // quota exceeded or storage disabled — fall through silently
  }
}

export function saveReport(payload: any): SavedReport {
  const property = (payload?.context?.address || 'Untitled Analysis').split(',')[0];
  const co2Saving = (payload?.actionPlan || [])
    .reduce((a: number, c: any) => a + (Number(c.co2Saving) || 0), 0);
  const topRisk = (payload?.dealRiskBreakdown || [])
    .find((r: any) => r.severity === 'High')?.finding
    || payload?.dealRiskBreakdown?.[0]?.finding
    || 'No critical risk detected.';

  const report: SavedReport = {
    id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    property,
    date: new Date().toISOString(),
    dealRisk: Number(payload?.dealRiskScore) || 0,
    esg: Number(payload?.esgComplianceScore) || 0,
    co2Saving: +co2Saving.toFixed(1),
    topRisk,
    payload,
  };
  const existing = loadSavedReports();
  writeSavedReports([report, ...existing]);
  return report;
}

export function deleteReport(id: string): SavedReport[] {
  const next = loadSavedReports().filter(r => r.id !== id);
  writeSavedReports(next);
  return next;
}

export function clearReports(): void {
  writeSavedReports([]);
}
