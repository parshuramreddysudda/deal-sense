import React, { useEffect, useState } from 'react';
import { Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function Dashboard({ data, onReset }: { data: any, onReset: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // trigger animation frames
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleExportPdf = async () => {
    setDownloading(true);
    try {
      const response = await fetch('http://localhost:3001/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Deal_Brief.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
    setDownloading(false);
  };

  const getScoreColor = (score: number, invert = false) => {
    // Deal risk: higher is red
    // ESG score: higher is green
    if (invert) {
      if (score < 40) return 'var(--risk-red)';
      if (score < 70) return 'var(--risk-amber)';
      return 'var(--risk-green)';
    } else {
      if (score > 70) return 'var(--risk-red)';
      if (score > 40) return 'var(--risk-amber)';
      return 'var(--risk-green)';
    }
  };

  const getEsgStatus = (score: number) => {
    if (score < 40) return "Critical gaps";
    if (score < 70) return "Needs work";
    return "Compliant";
  };

  const getDealRiskStatus = (score: number) => {
    if (score < 40) return "Low risk";
    if (score < 70) return "Medium risk";
    return "High risk";
  };

  const getComplianceColor = (status: string) => {
    if (status === 'PASS') return 'bg-green-dim';
    if (status === 'GAP' || status === 'NOT TRACKED') return 'bg-red-dim';
    return 'bg-amber-dim';
  };

  // Ring styles
  const circumference = 2 * Math.PI * 40; // r=40
  const esgOffset = circumference - (data.esgComplianceScore / 100) * circumference;

  return (
    <>
      <div className="left-col">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Deal Brief</h2>
          <button className="btn" onClick={onReset}>New Analysis</button>
        </div>

        {/* Scores Grid */}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <div className="mono-label" style={{ marginBottom: '10px', color: 'var(--accent-lime)' }}>AI Executive Summary</div>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{data.narrative}</p>
          </div>
          
          <div className="card">
            <div className="mono-label" style={{ marginBottom: '15px' }}>Risk Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.dealRiskBreakdown && data.dealRiskBreakdown.map((risk: any, i: number) => {
                const isHigh = risk.severity === 'High';
                const isMedium = risk.severity === 'Medium';
                const dotColor = isHigh ? 'var(--risk-red)' : (isMedium ? 'var(--risk-amber)' : 'var(--risk-green)');
                const bgColor = isHigh ? 'bg-red-dim' : (isMedium ? 'bg-amber-dim' : 'bg-green-dim');
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${dotColor}`, paddingLeft: '10px' }}>
                    <div>
                      <div className="mono-metric">{risk.factor}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{risk.finding}</div>
                    </div>
                    <div className={`mode-badge ${bgColor}`}>{risk.severity}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div>
          <h3 style={{ marginBottom: '15px' }}>Prioritised Action Plan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.actionPlan.map((action: any, idx: number) => (
              <div key={idx} className="card action-item" style={{ 
                opacity: mounted ? 1 : 0, 
                transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.4s ease-out ${idx * 0.1}s` 
              }}>
                <div className="action-item-content">
                  <h4 className="mono-metric">{idx + 1}. {action.title}</h4>
                  <p>{action.description}</p>
                </div>
                <div className="action-item-stats">
                  <div className="mono-metric" style={{ color: 'var(--risk-green)' }}>-{action.co2Saving}t CO₂</div>
                  <div className="mono-metric" style={{ color: 'var(--accent-lime)' }}>+${action.dollarSaving}/yr</div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>{action.payback}y payback</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="right-sidebar">
        {/* PDF Export Button */}
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleExportPdf}
          disabled={downloading}
        >
          <Download size={16} />
          {downloading ? 'Generating PDF...' : 'Export Board Brief PDF'}
        </button>

        {/* ESG Ring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div className="mono-label">ESG Status</div>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg width="100" height="100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke={getScoreColor(data.esgComplianceScore, true)} 
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={mounted ? esgOffset : circumference}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mono-score">
              {data.esgComplianceScore}
            </div>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="card">
          <div className="mono-label" style={{ marginBottom: '15px' }}>Regulatory Frameworks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.esgComplianceDetail.map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="mono-metric">{item.framework}</span>
                <span className={`mode-badge ${getComplianceColor(item.status)}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
