import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Portfolio() {
  // Hardcoded portfolio data for the demo
  const portfolio = [
    { name: 'Mindspace IT Park', class: 'Office', gla: 45000, intensity: 18.5, crrem: 14.0, esg: 54, dealRisk: 68, compliance: 'GAP' },
    { name: 'London Tower', class: 'Office', gla: 22000, intensity: 11.2, crrem: 14.0, esg: 82, dealRisk: 35, compliance: 'PASS' },
    { name: 'Paris Retail Hub', class: 'Retail', gla: 18000, intensity: 27.5, crrem: 22.0, esg: 35, dealRisk: 80, compliance: 'GAP' },
    { name: 'Berlin Logistics', class: 'Industrial', gla: 85000, intensity: 8.5, crrem: 10.0, esg: 75, dealRisk: 42, compliance: 'PASS' },
    { name: 'Madrid Plaza', class: 'Retail', gla: 12000, intensity: 24.0, crrem: 22.0, esg: 65, dealRisk: 55, compliance: 'PARTIAL' },
  ];

  const totalAssets = portfolio.length;
  const totalFootprint = portfolio.reduce((acc, a) => acc + (a.intensity * a.gla / 1000), 0);
  const avgEsg = portfolio.reduce((acc, a) => acc + a.esg, 0) / totalAssets;
  const criticalGaps = portfolio.filter(a => a.compliance === 'GAP').length;

  const getComplianceColor = (status: string) => {
    if (status === 'PASS') return 'bg-green-dim';
    if (status === 'GAP') return 'bg-red-dim';
    return 'bg-amber-dim';
  };

  const getScoreColor = (score: number) => {
    if (score < 40) return 'var(--risk-red)';
    if (score < 70) return 'var(--risk-amber)';
    return 'var(--risk-green)';
  };

  // Pie chart data
  const pieData = [
    { name: 'Critical (0-40)', value: portfolio.filter(a => a.esg < 40).length, color: 'var(--risk-red)' },
    { name: 'Needs Work (40-70)', value: portfolio.filter(a => a.esg >= 40 && a.esg < 70).length, color: 'var(--risk-amber)' },
    { name: 'Compliant (70-100)', value: portfolio.filter(a => a.esg >= 70).length, color: 'var(--risk-green)' }
  ];

  // Bar chart needs coloring based on CRREM target
  const barData = portfolio.map(a => ({
    name: a.name.split(' ')[0], // short name
    intensity: a.intensity,
    crrem: a.crrem,
    color: a.intensity > a.crrem ? 'var(--risk-red)' : 'var(--risk-green)'
  }));

  return (
    <div>
      {/* Summary Bar */}
      <div className="scores-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
         <div className="card score-card"><div className="mono-label">Total Assets</div><div className="mono-score" style={{color: 'var(--text-main)'}}>{totalAssets}</div></div>
         <div className="card score-card"><div className="mono-label">Portfolio Carbon Footprint</div><div className="mono-score" style={{color: 'var(--text-main)'}}>{Math.round(totalFootprint).toLocaleString()}t CO₂/yr</div></div>
         <div className="card score-card"><div className="mono-label">Average ESG Score</div><div className="mono-score" style={{color: getScoreColor(avgEsg)}}>{Math.round(avgEsg)}</div></div>
         <div className="card score-card"><div className="mono-label">Assets w/ Critical Gaps</div><div className="mono-score" style={{color: 'var(--risk-red)'}}>{criticalGaps}</div></div>
      </div>

      {/* Heatmap Strip */}
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        <div className="mono-label" style={{ marginBottom: '10px' }}>ESG Health Heatmap</div>
        <div style={{ display: 'flex', gap: '4px', height: '30px' }}>
          {portfolio.sort((a,b) => b.esg - a.esg).map((asset, i) => (
            <div 
              key={i} 
              title={`${asset.name}: ESG ${asset.esg}`}
              style={{ flex: 1, backgroundColor: getScoreColor(asset.esg), borderRadius: '2px', cursor: 'pointer' }} 
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Carbon Intensity Chart */}
        <div className="card" style={{ flex: 2 }}>
           <h3 style={{ marginBottom: '20px' }}>Asset Carbon Intensity vs CRREM Targets</h3>
           <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                 <XAxis type="number" stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                 <YAxis type="category" dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '11px' }} />
                 <Tooltip contentStyle={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--border-color)', color: '#fff' }} />
                 {/* Hack: The CRREM line for the entire portfolio isn't a single line in vertical mode if targets differ, but prompt asks for "vertical dashed line across all bars". We'll draw an average target line for visual proxy or just draw lines per bar. Let's use a reference line at x=14 for the Office proxy */}
                 <ReferenceLine x={14} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'CRREM Office Avg', fill: 'var(--text-muted)', fontSize: 10 }} />
                 <Bar dataKey="intensity">
                   {barData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Donut Chart */}
        <div className="card" style={{ flex: 1 }}>
           <h3 style={{ marginBottom: '20px' }}>ESG Score Distribution</h3>
           <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--border-color)', color: '#fff' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Asset Directory</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Property</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Asset Class</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>GLA (sqm)</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Intensity</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>ESG Score</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Risk Score</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Compliance</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', borderLeft: `3px solid ${p.compliance === 'GAP' ? 'var(--risk-red)' : (p.compliance === 'PASS' ? 'var(--risk-green)' : 'transparent')}` }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '12px' }}>{p.class}</td>
                <td className="mono-metric" style={{ padding: '12px' }}>{p.gla.toLocaleString()}</td>
                <td className="mono-metric" style={{ padding: '12px', color: p.intensity > p.crrem ? 'var(--risk-red)' : 'var(--risk-green)' }}>{p.intensity.toFixed(1)}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="mono-metric">{p.esg}</span>
                    <div style={{ width: '40px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${p.esg}%`, height: '100%', background: getScoreColor(p.esg) }} />
                    </div>
                  </div>
                </td>
                <td className="mono-metric" style={{ padding: '12px' }}>{p.dealRisk}</td>
                <td style={{ padding: '12px' }}><span className={`mode-badge ${getComplianceColor(p.compliance)}`}>{p.compliance}</span></td>
                <td style={{ padding: '12px', textAlign: 'right' }}><button className="btn" style={{ padding: '6px 12px', fontSize: '11px' }}>Actions</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
