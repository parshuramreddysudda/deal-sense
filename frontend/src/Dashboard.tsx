import React, { useEffect, useState } from 'react';
import { Download, Eye } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer,
  Cell,
} from 'recharts';
import { downloadBrief, previewBrief } from './lib/pdf';

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-syne)',
  fontSize: 10,
  textTransform: 'uppercase',
  color: '#6b7a99',
  letterSpacing: '0.08em',
  marginBottom: 10,
};

export default function Dashboard({ data, onReset }: { data: any; onReset: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const filenameHint = data?.context?.address
    ? `deal_brief_${data.context.address}`
    : 'deal_brief';

  const handleExportPdf = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadBrief(data, filenameHint);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setError(err?.message || 'PDF export failed. Is the backend running?');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreviewPdf = async () => {
    setPreviewing(true);
    setError(null);
    try {
      await previewBrief(data);
    } catch (err: any) {
      console.error('Failed to preview PDF:', err);
      setError(err?.message || 'PDF preview failed. Is the backend running?');
    } finally {
      setPreviewing(false);
    }
  };

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

  const getEsgStatus = (score: number) =>
    score < 40 ? 'Critical gaps' : score < 70 ? 'Needs work' : 'Compliant';
  const getDealRiskStatus = (score: number) =>
    score < 40 ? 'Low risk' : score < 70 ? 'Medium risk' : 'High risk';

  const getComplianceColor = (status: string) => {
    if (status === 'PASS') return 'bg-green-dim';
    if (status === 'GAP' || status === 'NOT TRACKED') return 'bg-red-dim';
    if (status === 'N/A' || status === 'NOT ASSESSED') return 'bg-grey-dim';
    return 'bg-amber-dim';
  };

  const circumference = 2 * Math.PI * 40;
  const esgOffset = circumference - (data.esgComplianceScore / 100) * circumference;

  // ---- Fix 4: Radar chart data (Financial Risk inverted) ----
  const radarData = [
    { dim: 'Financial', value: 100 - (data.dealRiskScore ?? 0) },
    { dim: 'ESG Compliance', value: data.esgComplianceScore ?? 0 },
    { dim: 'Market', value: data.marketPositionScore ?? 0 },
  ];

  // ---- Fix 4: Carbon intensity vs CRREM ----
  const carbon = data.carbonData || {};
  const intensity = Number(carbon.intensityKgPerSqm ?? 0);
  const target = Number(carbon.crremTarget ?? 14);
  const barColor = intensity > target ? '#ff4d6a' : '#00d68f';
  const carbonBarData = [{
    name: data.context?.address ? data.context.address.split(',')[0] : 'Asset',
    value: intensity,
  }];

  return (
    <div className="analyser-grid">
      <div className="left-col">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Deal Brief {data.context?.address ? `— ${data.context.address.split(',')[0]}` : ''}</h2>
          <button className="btn" onClick={onReset}>New Analysis</button>
        </div>

        {/* Scores */}
        <div className="scores-grid">
          <div className="card score-card">
            <div className="mono-label">Deal Risk Score</div>
            <div className="mono-score" style={{ color: getScoreColor(data.dealRiskScore, false) }}>
              {data.dealRiskScore}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{getDealRiskStatus(data.dealRiskScore)}</div>
            <div className="score-fill-bar" style={{ width: mounted ? `${data.dealRiskScore}%` : '0', backgroundColor: getScoreColor(data.dealRiskScore, false) }} />
          </div>

          <div className="card score-card">
            <div className="mono-label">ESG Compliance Score</div>
            <div className="mono-score" style={{ color: getScoreColor(data.esgComplianceScore, true) }}>
              {data.esgComplianceScore}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{getEsgStatus(data.esgComplianceScore)}</div>
            <div className="score-fill-bar" style={{ width: mounted ? `${data.esgComplianceScore}%` : '0', backgroundColor: getScoreColor(data.esgComplianceScore, true) }} />
          </div>

          <div className="card score-card">
            <div className="mono-label">Market Position</div>
            <div className="mono-score" style={{ color: 'var(--accent-lime)' }}>
              {data.marketPositionScore}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Top Quartile</div>
            <div className="score-fill-bar" style={{ width: mounted ? `${data.marketPositionScore}%` : '0' }} />
          </div>
        </div>

        {/* Narrative & Risk Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="mono-label" style={{ marginBottom: 10, color: 'var(--accent-lime)' }}>AI Executive Summary</div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{data.narrative}</p>
          </div>

          <div className="card">
            <div className="mono-label" style={{ marginBottom: 15 }}>Risk Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(data.dealRiskBreakdown || []).map((risk: any, i: number) => {
                const dotColor = risk.severity === 'High' ? 'var(--risk-red)'
                  : risk.severity === 'Medium' ? 'var(--risk-amber)' : 'var(--risk-green)';
                const bgColor = risk.severity === 'High' ? 'bg-red-dim'
                  : risk.severity === 'Medium' ? 'bg-amber-dim' : 'bg-green-dim';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${dotColor}`, paddingLeft: 10 }}>
                    <div>
                      <div className="mono-metric">{risk.factor}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{risk.finding}</div>
                    </div>
                    <div className={`mode-badge ${bgColor}`}>{risk.severity}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fix 4 — Radar + Carbon vs CRREM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={SECTION_TITLE}>Score dimensions</div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="#1e2535" />
                  <PolarAngleAxis dataKey="dim"
                    tick={{ fill: '#6b7a99', fontSize: 11, fontFamily: 'DM Mono' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#c8ff00" strokeWidth={1.5}
                    fill="#c8ff00" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div style={SECTION_TITLE}>Carbon intensity vs pathway</div>
            <div style={{ width: '100%', height: 120 }}>
              <ResponsiveContainer>
                <BarChart data={carbonBarData} layout="vertical"
                  margin={{ top: 10, right: 40, left: 10, bottom: 20 }}>
                  <XAxis type="number" domain={[0, Math.max(intensity * 1.4, target * 1.4)]}
                    tick={{ fill: '#6b7a99', fontSize: 10, fontFamily: 'DM Mono' }}
                    label={{ value: 'kgCO₂ / sqm / year', fill: '#6b7a99', fontSize: 10,
                      fontFamily: 'DM Mono', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="category" dataKey="name" hide />
                  <ReferenceLine x={target} stroke="#f5a623" strokeDasharray="4 3"
                    label={{ value: 'CRREM 2030 target', position: 'top', fill: '#f5a623',
                      fontSize: 10, fontFamily: 'DM Mono' }} />
                  <Bar dataKey="value" barSize={24} fill={barColor}>
                    <Cell fill={barColor} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {intensity.toFixed(1)} kgCO₂/sqm · target {target.toFixed(1)} · status {carbon.status}
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div>
          <h3 style={{ marginBottom: 15 }}>Prioritised Action Plan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data.actionPlan || []).map((action: any, idx: number) => (
              <div key={idx} className="card action-item" style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.4s ease-out ${idx * 0.1}s`,
              }}>
                <div className="action-item-content">
                  <h4 className="mono-metric">{idx + 1}. {action.title}</h4>
                  <p>{action.description}</p>
                  {action.carbonPriceContribution > 0 && (
                    <p style={{ color: 'var(--accent-lime)', fontSize: 11 }}>
                      Includes USD {action.carbonPriceContribution.toLocaleString()} from carbon pricing.
                    </p>
                  )}
                </div>
                <div className="action-item-stats">
                  <div className="mono-metric" style={{ color: 'var(--risk-green)' }}>-{action.co2Saving}t CO₂</div>
                  <div className="mono-metric" style={{ color: 'var(--accent-lime)' }}>+${Number(action.dollarSaving).toLocaleString()}/yr</div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>{action.payback}y payback</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="right-sidebar">
        <button className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={handleExportPdf} disabled={downloading || previewing}>
          <Download size={16} />
          {downloading ? 'Generating PDF…' : 'Export Board Brief PDF'}
        </button>
        <button className="btn"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={handlePreviewPdf} disabled={downloading || previewing}>
          <Eye size={16} />
          {previewing ? 'Opening…' : 'Preview PDF'}
        </button>
        {error && (
          <div style={{
            padding: '8px 10px', borderRadius: 6,
            background: 'rgba(255,77,106,0.08)',
            border: '1px solid var(--risk-red)',
            color: 'var(--risk-red)', fontSize: 11,
          }}>
            {error}
          </div>
        )}

        {/* ESG Ring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div className="mono-label">ESG Status</div>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <svg width="100" height="100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="6" />
              <circle cx="50" cy="50" r="40" fill="none"
                stroke={getScoreColor(data.esgComplianceScore, true)}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={mounted ? esgOffset : circumference}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mono-score">
              {data.esgComplianceScore}
            </div>
          </div>
        </div>

        {/* Dynamic Compliance Checklist — Fix 10 */}
        <div className="card">
          <div className="mono-label" style={{ marginBottom: 15 }}>Regulatory Frameworks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data.esgComplianceDetail || []).length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>No frameworks apply for this deal.</div>
            )}
            {(data.esgComplianceDetail || []).map((item: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: 8, borderBottom: '1px solid var(--border-color)', gap: 8,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono-metric" style={{ opacity: item.status === 'N/A' ? 0.55 : 1 }}>
                    {item.framework}
                  </div>
                  {item.note && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {item.note}
                    </div>
                  )}
                </div>
                <span className={`mode-badge ${getComplianceColor(item.status)}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asset metadata */}
        {data.context && (
          <div className="card">
            <div className="mono-label" style={{ marginBottom: 10 }}>Asset Metadata</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>{data.context.countryName} · {data.context.assetClass}</div>
              <div>{data.context.numBuildings} building{data.context.numBuildings > 1 ? 's' : ''} · {data.context.envelope} envelope</div>
              <div>Grid {data.context.gridIntensity} · Benchmark {data.context.benchmarkRate}%</div>
              <div>Loan: {data.context.rateType}{data.context.carbonPrice > 0 ? ` · Carbon $${data.context.carbonPrice}/t` : ''}</div>
              <div>Rating: {data.context.energyRating}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
