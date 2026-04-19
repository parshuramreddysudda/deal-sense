import React from 'react';
import { FileText, Download, Eye, PlusCircle } from 'lucide-react';

export default function Reports({ onGoToAnalysis }: { onGoToAnalysis: () => void }) {
  // Hardcoded for demo state as requested. A real app would fetch logs.
  const reports = [
    { 
      property: "Mindspace IT Park", 
      date: new Date().toLocaleDateString(), 
      dealRisk: 68, 
      esg: 54, 
      topRisk: "Loan matures in ~24 mos (High Refinancing Risk)",
      url: "#"
    },
    { 
      property: "London Tower Portfolio", 
      date: "10/12/2025", 
      dealRisk: 35, 
      esg: 82, 
      topRisk: "None critical. Asset performs top quartile.",
      url: "#"
    }
  ];

  const avgEsg = reports.reduce((acc, r) => acc + r.esg, 0) / (reports.length || 1);

  const getScoreColor = (score: number, invert = false) => {
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

  return (
    <div>
      {/* Stats Strip */}
      <div className="scores-grid" style={{ marginBottom: '30px' }}>
         <div className="card score-card"><div className="mono-label">Total Reports Generated</div><div className="mono-score" style={{color: 'var(--text-main)'}}>{reports.length}</div></div>
         <div className="card score-card"><div className="mono-label">Average ESG Score</div><div className="mono-score" style={{color: getScoreColor(avgEsg, true)}}>{Math.round(avgEsg)}</div></div>
         <div className="card score-card"><div className="mono-label">Total CO₂ Reduction Identified</div><div className="mono-score" style={{color: 'var(--risk-green)'}}>214t</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Board Brief Archive</h2>
        <button className="btn btn-primary" onClick={onGoToAnalysis} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={16} /> New Analysis
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="card" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <FileText size={64} color="var(--border-color)" style={{ margin: '0 auto 20px' }} />
          <h3 style={{ marginBottom: '10px' }}>No reports generated yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Run an analysis from the Deal Analyser tab to create your first board brief.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reports.map((r, i) => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '8px' }}>
                  <FileText size={32} color="var(--accent-lime)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', marginBottom: '5px' }}>{r.property}</h4>
                  <div className="mono-metric" style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>Generated: {r.date}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><span style={{ color: 'var(--risk-red)' }}>Top Risk:</span> {r.topRisk}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="mode-badge" style={{ borderColor: getScoreColor(r.dealRisk, false), color: getScoreColor(r.dealRisk, false) }}>
                    Deal Risk: {r.dealRisk}
                  </div>
                  <div className="mode-badge" style={{ borderColor: getScoreColor(r.esg, true), color: getScoreColor(r.esg, true) }}>
                    ESG: {r.esg}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Eye size={14} /> Preview
                  </button>
                  <button className="btn btn-primary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
