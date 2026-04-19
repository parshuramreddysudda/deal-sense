import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ActionPlan({ analysisResult }: { analysisResult: any }) {
  const [filter, setFilter] = useState('All');

  if (!analysisResult) {
    return (
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Enterprise Action Plan</h2>
        <p style={{ color: 'var(--text-muted)' }}>Run a Deal Analysis to populate proposed actions.</p>
      </div>
    );
  }

  const actions = analysisResult.actionPlan || [];
  const totalCo2 = actions.reduce((acc: number, curr: any) => acc + curr.co2Saving, 0);
  const totalDollar = actions.reduce((acc: number, curr: any) => acc + curr.dollarSaving, 0);
  const totalCost = actions.reduce((acc: number, curr: any) => acc + curr.cost, 0);

  let filteredActions = actions;
  if (filter === 'Quick Wins') {
    filteredActions = actions.filter((a: any) => a.payback <= 2.0);
  } else if (filter === 'High Priority') {
    filteredActions = actions.filter((a: any) => a.payback < 1.0 || a.title.includes('Refrigerant'));
  } else if (filter === 'Compliance-Driven') {
    filteredActions = actions.filter((a: any) => a.title.includes('Refrigerant') || a.description.toLowerCase().includes('csrd'));
  }

  // Generate 10-year projection data based on selected actions
  const selectedCo2 = filteredActions.reduce((acc: number, curr: any) => acc + curr.co2Saving, 0);
  const selectedDollar = filteredActions.reduce((acc: number, curr: any) => acc + curr.dollarSaving, 0);
  
  const chartData = Array.from({ length: 11 }, (_, i) => ({
    year: `Year ${i}`,
    co2: i * selectedCo2,
    dollar: i * selectedDollar
  }));

  const filters = ['All', 'High Priority', 'Quick Wins', 'Compliance-Driven'];

  return (
    <div>
      {/* Header Row */}
      <div className="scores-grid" style={{ marginBottom: '20px' }}>
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

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {filters.map(f => (
          <button 
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : ''}`}
            onClick={() => setFilter(f)}
            style={{ borderRadius: '20px', padding: '6px 15px', fontSize: '12px' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Action Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        {filteredActions.map((action: any, idx: number) => {
          let priorityColor = 'var(--risk-green)';
          if (idx === 0) priorityColor = 'var(--accent-lime)';
          if (idx >= 2) priorityColor = '#3b82f6'; // blue for lowest
          
          return (
            <div key={idx} className="card action-item" style={{ borderLeftColor: priorityColor, flexDirection: 'row', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{idx + 1}. {action.title}</h4>
                  <span className="mode-badge">Mindspace IT Park</span>
                </div>
                <p style={{ color: 'var(--text-muted)' }}>{action.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>CO₂ Saved</div>
                  <div className="mono-metric" style={{ color: 'var(--risk-green)' }}>{action.co2Saving.toFixed(1)}t</div>
                </div>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>Annual Saving</div>
                  <div className="mono-metric" style={{ color: 'var(--accent-lime)' }}>${action.dollarSaving.toLocaleString()}</div>
                </div>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>Install Cost</div>
                  <div className="mono-metric" style={{ color: 'var(--risk-amber)' }}>${action.cost.toLocaleString()}</div>
                </div>
                <div>
                  <div className="mono-label" style={{ color: 'var(--text-muted)' }}>Payback</div>
                  <div className="mono-metric" style={{ color: '#fff' }}>{action.payback.toFixed(1)}y</div>
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

      {/* Cumulative Savings Chart */}
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>10-Year Cumulative Savings Projection</h3>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="year" stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" stroke="var(--risk-green)" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--accent-lime)" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-surface)', borderColor: 'var(--border-color)', color: '#fff' }} />
              <Line yAxisId="left" type="monotone" dataKey="co2" stroke="var(--risk-green)" strokeWidth={3} dot={false} name="Cumulative CO₂ Saved (t)" />
              <Line yAxisId="right" type="monotone" dataKey="dollar" stroke="var(--accent-lime)" strokeWidth={3} dot={false} name="Cumulative Dollar Saved ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
