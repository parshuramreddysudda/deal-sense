import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis, Label,
} from 'recharts';

type Asset = {
  name: string;
  class: string;
  country?: string;
  gla: number;
  intensity: number;
  crrem: number;
  esg: number;
  dealRisk: number;
  compliance: 'PASS' | 'GAP' | 'PARTIAL' | string;
  address?: string;
};

const DEMO_PORTFOLIO: Asset[] = [
  { name: 'Mindspace IT Park',  class: 'Office',     gla: 45000, intensity: 18.5, crrem: 14.0, esg: 54, dealRisk: 68, compliance: 'GAP',     address: 'Hyderabad, India' },
  { name: 'London Tower',       class: 'Office',     gla: 22000, intensity: 11.2, crrem: 14.0, esg: 82, dealRisk: 35, compliance: 'PASS',    address: 'London, UK' },
  { name: 'Paris Retail Hub',   class: 'Retail',     gla: 18000, intensity: 27.5, crrem: 22.0, esg: 35, dealRisk: 80, compliance: 'GAP',     address: 'Paris, France' },
  { name: 'Berlin Logistics',   class: 'Industrial', gla: 85000, intensity: 8.5,  crrem: 10.0, esg: 75, dealRisk: 42, compliance: 'PASS',    address: 'Berlin, Germany' },
  { name: 'Madrid Plaza',       class: 'Retail',     gla: 12000, intensity: 24.0, crrem: 22.0, esg: 65, dealRisk: 55, compliance: 'PARTIAL', address: 'Madrid, Spain' },
];

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-syne)', fontSize: 10, textTransform: 'uppercase',
  color: '#6b7a99', letterSpacing: '0.08em', marginBottom: 10,
};

function hslForScore(score: number) {
  const hue = Math.max(0, Math.min(100, score)) * 1.2; // 0 red → 120 green
  return `hsl(${hue}, 70%, 45%)`;
}

function getComplianceBadge(status: string) {
  if (status === 'PASS') return 'bg-green-dim';
  if (status === 'GAP') return 'bg-red-dim';
  return 'bg-amber-dim';
}

export default function Portfolio({ analysisResult }: { analysisResult?: any }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Derive portfolio: prefer live scoring payload, fall back to demo fleet
  const portfolio: Asset[] = useMemo(() => {
    if (analysisResult?.portfolioAssets?.length) {
      return analysisResult.portfolioAssets.map((a: any) => ({ ...a, address: a.address || '' }));
    }
    if (analysisResult) {
      const ctx = analysisResult.context || {};
      const live: Asset = {
        name: (ctx.address || 'Asset').split(',')[0],
        class: ctx.assetClass || 'Office',
        country: ctx.country || 'IN',
        gla: analysisResult?.carbonData?.footprintTonnes
          ? Math.round((analysisResult.carbonData.footprintTonnes * 1000) / (analysisResult.carbonData.intensityKgPerSqm || 1))
          : 10000,
        intensity: Number(analysisResult?.carbonData?.intensityKgPerSqm ?? 15),
        crrem: Number(analysisResult?.carbonData?.crremTarget ?? 14),
        esg: analysisResult.esgComplianceScore ?? 50,
        dealRisk: analysisResult.dealRiskScore ?? 50,
        compliance: (analysisResult.esgComplianceDetail || []).some((d: any) => d.status === 'GAP') ? 'GAP'
          : (analysisResult.esgComplianceDetail || []).some((d: any) => d.status === 'PARTIAL') ? 'PARTIAL' : 'PASS',
        address: ctx.address || '',
      };
      // If broker mode (single deal), show the live asset alongside the demo fleet
      // so the portfolio view is still populated.
      return [live, ...DEMO_PORTFOLIO.slice(1)];
    }
    return DEMO_PORTFOLIO;
  }, [analysisResult]);

  const totalAssets = portfolio.length;
  const totalFootprint = portfolio.reduce((acc, a) => acc + (a.intensity * a.gla) / 1000, 0);
  const avgEsg = portfolio.reduce((acc, a) => acc + a.esg, 0) / totalAssets;
  const criticalGaps = portfolio.filter(a => a.compliance === 'GAP').length;

  const getScoreColor = (score: number) => {
    if (score < 40) return 'var(--risk-red)';
    if (score < 70) return 'var(--risk-amber)';
    return 'var(--risk-green)';
  };

  // Real donut counts
  const pieData = [
    { name: 'Critical (0-40)', value: portfolio.filter(a => a.esg < 40).length, color: '#ff4d6a' },
    { name: 'Needs Work (40-70)', value: portfolio.filter(a => a.esg >= 40 && a.esg < 70).length, color: '#f5a623' },
    { name: 'Compliant (70-100)', value: portfolio.filter(a => a.esg >= 70).length, color: '#00d68f' },
  ].filter(p => p.value > 0);

  // Portfolio-average CRREM reference line (because assets may differ)
  const avgCrrem = portfolio.reduce((a, c) => a + c.crrem, 0) / totalAssets;

  const barData = portfolio.map(a => ({
    name: a.name.length > 16 ? a.name.slice(0, 14) + '…' : a.name,
    intensity: a.intensity,
    crrem: a.crrem,
    color: a.intensity > a.crrem ? '#ff4d6a' : '#00d68f',
  }));

  // Scatter matrix data
  const scatterData = portfolio.map(a => ({
    x: a.dealRisk, y: a.esg, name: a.name, color: hslForScore(a.esg),
  }));

  return (
    <div>
      {/* Summary */}
      <div className="scores-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="card score-card"><div className="mono-label">Total Assets</div>
          <div className="mono-score">{totalAssets}</div></div>
        <div className="card score-card"><div className="mono-label">Portfolio Carbon Footprint</div>
          <div className="mono-score">{Math.round(totalFootprint).toLocaleString()}t/yr</div></div>
        <div className="card score-card"><div className="mono-label">Average ESG Score</div>
          <div className="mono-score" style={{ color: getScoreColor(avgEsg) }}>{Math.round(avgEsg)}</div></div>
        <div className="card score-card"><div className="mono-label">Assets w/ Critical Gaps</div>
          <div className="mono-score" style={{ color: 'var(--risk-red)' }}>{criticalGaps}</div></div>
      </div>

      {/* HSL Heatmap */}
      <div className="card" style={{ marginBottom: 20, padding: 15, position: 'relative' }}>
        <div style={SECTION_TITLE}>ESG Health Heatmap</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {portfolio.slice().sort((a, b) => b.esg - a.esg).map((asset, i) => (
            <div key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                width: 40, height: 40,
                backgroundColor: hslForScore(asset.esg),
                borderRadius: 4, cursor: 'pointer',
                transition: 'transform .15s ease',
                transform: hoveredIdx === i ? 'scale(1.08)' : 'scale(1)',
                position: 'relative',
              }}>
              {hoveredIdx === i && (
                <div style={{
                  position: 'absolute',
                  bottom: 48, left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#161b24',
                  border: '1px solid #2a3348',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}>
                  <div style={{ fontWeight: 600 }}>{asset.name}</div>
                  {asset.address && <div style={{ color: '#9aa2b5' }}>{asset.address}</div>}
                  <div style={{ color: hslForScore(asset.esg), fontFamily: 'DM Mono' }}>ESG {asset.esg}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CRREM bars + Donut */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 2, minWidth: 320 }}>
          <h3 style={{ marginBottom: 20 }}>Asset Carbon Intensity vs CRREM Targets</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" style={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--border-color)', color: '#fff' }} />
                <ReferenceLine x={avgCrrem} stroke="#f5a623" strokeDasharray="4 3">
                  <Label value="Portfolio average CRREM target" position="top"
                    fill="#f5a623" fontSize={10} fontFamily="DM Mono" />
                </ReferenceLine>
                <Bar dataKey="intensity" barSize={22}>
                  {barData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ marginBottom: 20 }}>ESG Score Distribution</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={4} dataKey="value"
                  label={({ value, percent }) => `${value} · ${Math.round((percent || 0) * 100)}%`}
                  labelLine={false}>
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--border-color)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fix 6 — Risk vs ESG scatter matrix */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={SECTION_TITLE}>Risk vs ESG matrix</div>
        <div style={{ height: 320, position: 'relative' }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="1 3" />
              <XAxis type="number" dataKey="x" domain={[0, 100]} name="Deal Risk"
                tick={{ fill: '#9aa2b5', fontSize: 11, fontFamily: 'DM Mono' }}>
                <Label value="Deal Risk Score →" offset={-15} position="insideBottom"
                  fill="#6b7a99" fontSize={10} fontFamily="DM Mono" />
              </XAxis>
              <YAxis type="number" dataKey="y" domain={[0, 100]} name="ESG Compliance"
                tick={{ fill: '#9aa2b5', fontSize: 11, fontFamily: 'DM Mono' }}>
                <Label value="ESG Compliance →" angle={-90} position="insideLeft"
                  fill="#6b7a99" fontSize={10} fontFamily="DM Mono" />
              </YAxis>
              <ZAxis range={[140, 140]} />
              <ReferenceLine x={50} stroke="#6b7a99" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="#6b7a99" strokeDasharray="3 3" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#161b24', border: '1px solid #2a3348', color: '#fff', fontSize: 11 }}
                formatter={(val: any, key: any) => [val, key === 'x' ? 'Deal Risk' : 'ESG']}
                labelFormatter={(_, payload) => (payload && payload[0]?.payload?.name) || ''} />
              <Scatter data={scatterData}>
                {scatterData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Quadrant labels */}
          <QuadrantLabel top={14} left={50}>LOW RISK · HIGH ESG · ideal</QuadrantLabel>
          <QuadrantLabel top={14} right={50}>HIGH RISK · HIGH ESG · overpriced green</QuadrantLabel>
          <QuadrantLabel bottom={42} left={50}>LOW RISK · LOW ESG · hidden liability</QuadrantLabel>
          <QuadrantLabel bottom={42} right={50}>HIGH RISK · LOW ESG · avoid</QuadrantLabel>
        </div>
      </div>

      {/* Asset table */}
      <div className="card">
        <h3 style={{ marginBottom: 15 }}>Asset Directory</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}>Property</th>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}>Asset Class</th>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}>GLA (sqm)</th>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}>Intensity</th>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}>ESG Score</th>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}>Risk Score</th>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}>Compliance</th>
              <th style={{ padding: 12, color: 'var(--text-muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((p, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid var(--border-color)',
                borderLeft: `3px solid ${p.compliance === 'GAP' ? 'var(--risk-red)' : p.compliance === 'PASS' ? 'var(--risk-green)' : 'transparent'}`,
              }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: 12 }}>{p.class}</td>
                <td className="mono-metric" style={{ padding: 12 }}>{p.gla.toLocaleString()}</td>
                <td className="mono-metric" style={{ padding: 12, color: p.intensity > p.crrem ? 'var(--risk-red)' : 'var(--risk-green)' }}>{p.intensity.toFixed(1)}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono-metric">{p.esg}</span>
                    <div style={{ width: 40, height: 4, background: 'var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${p.esg}%`, height: '100%', background: getScoreColor(p.esg) }} />
                    </div>
                  </div>
                </td>
                <td className="mono-metric" style={{ padding: 12 }}>{p.dealRisk}</td>
                <td style={{ padding: 12 }}>
                  <span className={`mode-badge ${getComplianceBadge(p.compliance)}`}>{p.compliance}</span>
                </td>
                <td style={{ padding: 12, textAlign: 'right' }}>
                  <button className="btn" style={{ padding: '6px 12px', fontSize: 11 }}>Actions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuadrantLabel({ children, top, bottom, left, right }: {
  children: React.ReactNode;
  top?: number; bottom?: number; left?: number; right?: number;
}) {
  return (
    <div style={{
      position: 'absolute',
      top, bottom, left, right,
      fontSize: 10, fontFamily: 'DM Mono',
      color: '#6b7a99', letterSpacing: '0.05em',
      pointerEvents: 'none',
    }}>
      {children}
    </div>
  );
}
