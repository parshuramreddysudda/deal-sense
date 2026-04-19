import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from 'recharts';

const CONTRIB_COLORS = ['#c8ff00', '#00d68f', '#4a9eff'];

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-syne)', fontSize: 10, textTransform: 'uppercase',
  color: '#6b7a99', letterSpacing: '0.08em', marginBottom: 10,
};

export default function ActionPlan({ analysisResult }: { analysisResult: any }) {
  const [filter, setFilter] = useState('All');

  if (!analysisResult) {
    return (
      <div style={{ padding: 0 }}>
        <div className="card">
          <h2 style={{ marginBottom: 20 }}>Enterprise Action Plan</h2>
          <p style={{ color: 'var(--text-muted)' }}>Run a Deal Analysis to populate proposed actions.</p>
        </div>
      </div>
    );
  }

  const actions: any[] = analysisResult.actionPlan || [];
  const totalCo2    = actions.reduce((a, c) => a + (c.co2Saving || 0), 0);
  const totalDollar = actions.reduce((a, c) => a + (c.dollarSaving || 0), 0);
  const totalCost   = actions.reduce((a, c) => a + (c.cost || 0), 0);

  let filteredActions = actions;
  if (filter === 'Quick Wins') filteredActions = actions.filter(a => a.payback <= 2.0);
  else if (filter === 'High Priority') filteredActions = actions.filter(a => a.payback < 1.0 || /Refrigerant/i.test(a.title));
  else if (filter === 'Compliance-Driven') filteredActions = actions.filter(a => /Refrigerant|CSRD/i.test(a.title) || (a.description || '').toLowerCase().includes('csrd'));

  const selectedCo2    = filteredActions.reduce((a, c) => a + (c.co2Saving || 0), 0);
  const selectedDollar = filteredActions.reduce((a, c) => a + (c.dollarSaving || 0), 0);

  const chartData = Array.from({ length: 11 }, (_, i) => ({
    year: `Y${i}`, co2: i * selectedCo2, dollar: i * selectedDollar,
  }));

  // ---- Fix 5 contribution chart ----
  const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const contribData = filteredActions.map((a, i) => ({
    name: truncate(a.title, 25),
    value: a.dollarSaving || 0,
    color: CONTRIB_COLORS[i] || '#3a4560',
  }));
  const contribChartHeight = Math.max(100, contribData.length * 48 + 32);

  const filters = ['All', 'High Priority', 'Quick Wins', 'Compliance-Driven'];

  return (
    <div>
      {/* Summary cards */}
      <div className="scores-grid" style={{ marginBottom: 20 }}>
        <div className="card score-card">
          <div className="mono-label">Total Potential CO₂ Savings</div>
          <div className="mono-score" style={{ color: 'var(--risk-green)' }}>{Math.round(totalCo2)}t/yr</div>
        </div>
        <div className="card score-card">
          <div className="mono-label">Total Dollar Savings</div>
          <div className="mono-score" style={{ color: 'var(--accent-lime)' }}>${Math.round(totalDollar).toLocaleString()}/yr</div>
        </div>
        <div className="card score-card">
          <div className="mono-label">Estimated Capital Required</div>
          <div className="mono-score" style={{ color: 'var(--risk-amber)' }}>${Math.round(totalCost).toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {filters.map(f => (
          <button key={f}
            className={`btn ${filter === f ? 'btn-primary' : ''}`}
            onClick={() => setFilter(f)}
            style={{ borderRadius: 20, padding: '6px 15px', fontSize: 12 }}>
            {f}
          </button>
        ))}
      </div>

      {/* Action cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 30 }}>
        {filteredActions.map((action, idx) => {
          let priorityColor = 'var(--risk-green)';
          if (idx === 0) priorityColor = 'var(--accent-lime)';
          if (idx >= 2) priorityColor = '#3b82f6';
          return (
            <div key={idx} className="card action-item" style={{ borderLeftColor: priorityColor, flexDirection: 'row', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>{idx + 1}. {action.title}</h4>
                  {analysisResult.context?.address && (
                    <span className="mode-badge">{analysisResult.context.address.split(',')[0]}</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted)' }}>{action.description}</p>
                {action.carbonPriceContribution > 0 && (
                  <p style={{ color: 'var(--accent-lime)', fontSize: 11, marginTop: 6 }}>
                    Includes USD {action.carbonPriceContribution.toLocaleString()} from carbon pricing.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>CO₂ Saved</div>
                  <div className="mono-metric" style={{ color: 'var(--risk-green)' }}>{Number(action.co2Saving).toFixed(1)}t</div>
                </div>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>Annual Saving</div>
                  <div className="mono-metric" style={{ color: 'var(--accent-lime)' }}>${Number(action.dollarSaving).toLocaleString()}</div>
                </div>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>Install Cost</div>
                  <div className="mono-metric" style={{ color: 'var(--risk-amber)' }}>${Number(action.cost).toLocaleString()}</div>
                </div>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>Payback</div>
                  <div className="mono-metric" style={{ color: '#fff' }}>{Number(action.payback).toFixed(1)}y</div>
                </div>
                <button className="btn btn-primary" style={{ padding: '8px 15px' }}>Add to report</button>
              </div>
            </div>
          );
        })}
        {filteredActions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No actions match this filter.</div>
        )}
      </div>

      {/* Fix 5 — Contribution breakdown */}
      {contribData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={SECTION_TITLE}>Annual savings by action</div>
          <div style={{ width: '100%', height: contribChartHeight }}>
            <ResponsiveContainer>
              <BarChart data={contribData} layout="vertical"
                margin={{ top: 8, right: 90, left: 10, bottom: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={180}
                  tick={{ fill: '#9aa2b5', fontSize: 11, fontFamily: 'DM Mono' }}
                  axisLine={false} tickLine={false} />
                <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                  {contribData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  <LabelList dataKey="value" position="right"
                    formatter={(val: any) => `$${Number(val).toLocaleString()}`}
                    style={{ fill: '#f0f0f0', fontFamily: 'DM Mono', fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Existing 10-year cumulative chart */}
      <div className="card">
        <h3 style={{ marginBottom: 20 }}>10-Year Cumulative Savings Projection</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="year" stroke="var(--text-muted)" style={{ fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="var(--risk-green)" style={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--accent-lime)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--border-color)', color: '#fff' }} />
              <Line yAxisId="left" type="monotone" dataKey="co2" stroke="var(--risk-green)" strokeWidth={3} dot={false} name="Cumulative CO₂ (t)" />
              <Line yAxisId="right" type="monotone" dataKey="dollar" stroke="var(--accent-lime)" strokeWidth={3} dot={false} name="Cumulative $ Saved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
