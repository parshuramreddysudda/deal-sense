import { useMemo, useState } from 'react';
import { FileText, Download, Eye, PlusCircle, Trash2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { downloadBrief, previewBrief } from './lib/pdf';
import type { SavedReport } from './lib/reportStore';

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-syne)', fontSize: 10, textTransform: 'uppercase',
  color: '#6b7a99', letterSpacing: '0.08em', marginBottom: 10,
};

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-US', { month: 'short' })}`;
}

function formatDateFull(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Reports({
  onGoToAnalysis,
  savedReports,
  onDelete,
}: {
  onGoToAnalysis: () => void;
  savedReports: SavedReport[];
  onDelete: (id: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'download' | 'preview' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reports = savedReports;

  const avgEsg = reports.length ? reports.reduce((a, r) => a + r.esg, 0) / reports.length : 0;
  const totalCo2 = reports.reduce((a, r) => a + r.co2Saving, 0);
  const esgColor = avgEsg < 40 ? 'var(--risk-red)' : avgEsg < 70 ? 'var(--risk-amber)' : 'var(--risk-green)';

  const trendData = useMemo(
    () => reports.slice().reverse().map(r => ({ date: formatDateShort(r.date), esg: r.esg })),
    [reports],
  );

  const getScoreColor = (score: number, invert = false) => {
    if (invert) {
      if (score < 40) return 'var(--risk-red)';
      if (score < 70) return 'var(--risk-amber)';
      return 'var(--risk-green)';
    }
    if (score > 70) return 'var(--risk-red)';
    if (score > 40) return 'var(--risk-amber)';
    return 'var(--risk-green)';
  };

  const handleDownload = async (r: SavedReport) => {
    setBusyId(r.id); setBusyAction('download'); setError(null);
    try {
      await downloadBrief(r.payload, `${r.property}_${formatDateShort(r.date)}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to download PDF.');
    } finally {
      setBusyId(null); setBusyAction(null);
    }
  };

  const handlePreview = async (r: SavedReport) => {
    setBusyId(r.id); setBusyAction('preview'); setError(null);
    try {
      await previewBrief(r.payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to preview PDF.');
    } finally {
      setBusyId(null); setBusyAction(null);
    }
  };

  const handleDelete = (r: SavedReport) => {
    if (window.confirm(`Delete report for "${r.property}"?`)) {
      onDelete(r.id);
    }
  };

  return (
    <div>
      {/* Summary stat cards */}
      <div className="scores-grid" style={{ marginBottom: 20 }}>
        <div className="card score-card">
          <div className="mono-label">Total Reports Generated</div>
          <div className="mono-score">{reports.length}</div>
        </div>
        <div className="card score-card">
          <div className="mono-label">Average ESG Score</div>
          <div className="mono-score" style={{ color: esgColor }}>{reports.length ? Math.round(avgEsg) : '—'}</div>
        </div>
        <div className="card score-card">
          <div className="mono-label">Total CO₂ Reduction Identified</div>
          <div className="mono-score" style={{ color: 'var(--risk-green)' }}>
            {totalCo2.toFixed(1)}t
          </div>
        </div>
      </div>

      {/* Trend chart */}
      {reports.length > 0 && (
        <div className="card" style={{ marginBottom: 30 }}>
          <div style={SECTION_TITLE}>ESG score trend across reports</div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#1e2535" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="date"
                  tick={{ fill: '#9aa2b5', fontSize: 11, fontFamily: 'DM Mono' }}
                  axisLine={{ stroke: '#1e2535' }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]}
                  tick={{ fill: '#9aa2b5', fontSize: 11, fontFamily: 'DM Mono' }}
                  axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#161b24', border: '1px solid #2a3348', color: '#fff' }} />
                <Line type="monotone" dataKey="esg" stroke="#c8ff00" strokeWidth={2}
                  dot={{ r: 4, fill: '#c8ff00', stroke: '#c8ff00' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Board Brief Archive</h2>
        <button className="btn btn-primary" onClick={onGoToAnalysis}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusCircle size={16} /> New Analysis
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 15,
          background: 'rgba(255,77,106,0.08)',
          border: '1px solid var(--risk-red)', color: 'var(--risk-red)', fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <FileText size={64} color="var(--border-color)" style={{ margin: '0 auto 20px' }} />
          <h3 style={{ marginBottom: 10 }}>No reports generated yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Run an analysis from the Deal Analyser tab to create your first board brief.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {reports.map(r => {
            const isBusy = busyId === r.id;
            return (
              <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', minWidth: 320, flex: 1 }}>
                  <div style={{ background: 'var(--bg-color)', padding: 15, borderRadius: 8 }}>
                    <FileText size={32} color="var(--accent-lime)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 18, marginBottom: 5 }}>{r.property}</h4>
                    <div className="mono-metric" style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>
                      Generated: {formatDateFull(r.date)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--risk-red)' }}>Top Risk:</span> {r.topRisk}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="mode-badge" style={{ borderColor: getScoreColor(r.dealRisk, false), color: getScoreColor(r.dealRisk, false) }}>
                      Deal Risk: {r.dealRisk}
                    </div>
                    <div className="mode-badge" style={{ borderColor: getScoreColor(r.esg, true), color: getScoreColor(r.esg, true) }}>
                      ESG: {r.esg}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn"
                      onClick={() => handlePreview(r)}
                      disabled={isBusy}
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Eye size={14} />
                      {isBusy && busyAction === 'preview' ? 'Opening…' : 'Preview'}
                    </button>
                    <button className="btn btn-primary"
                      onClick={() => handleDownload(r)}
                      disabled={isBusy}
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Download size={14} />
                      {isBusy && busyAction === 'download' ? 'Generating…' : 'Download'}
                    </button>
                    <button className="btn"
                      onClick={() => handleDelete(r)}
                      title="Delete report"
                      style={{ padding: '8px 10px', color: 'var(--risk-red)', borderColor: 'var(--border-color)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
