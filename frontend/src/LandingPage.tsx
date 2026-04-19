import React from 'react';
import { ShieldCheck, ArrowRight, Activity, FileText } from 'lucide-react';

export default function LandingPage({ onEnterApp, onDemo }: { onEnterApp: () => void, onDemo: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: '60px 20px', alignItems: 'center' }}>
      
      <div style={{ textAlign: 'center', maxWidth: '800px', marginBottom: '60px' }}>
        <ShieldCheck size={48} color="var(--accent-lime)" style={{ margin: '0 auto 20px' }} />
        <h1 style={{ fontSize: '56px', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1 }}>DealSense ESG</h1>
        <p style={{ fontSize: '20px', color: 'var(--text-muted)', marginBottom: '40px' }}>
          Every deal. Every asset. ESG-scored before it costs you.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '15px 30px', fontSize: '16px' }} onClick={onEnterApp}>
            Analyse a deal <ArrowRight size={16} style={{ display: 'inline', marginLeft: '5px' }} />
          </button>
          <button className="btn" style={{ padding: '15px 30px', fontSize: '16px', backgroundColor: 'transparent' }} onClick={onDemo}>
            View demo dashboard
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '1000px', width: '100%', marginBottom: '80px' }}>
        <div className="card" style={{ background: 'transparent' }}>
          <Activity color="var(--risk-red)" size={24} style={{ marginBottom: '15px' }} />
          <h3 style={{ marginBottom: '10px' }}>Deal risk in 60 seconds</h3>
          <p style={{ color: 'var(--text-muted)' }}>Financial, ESG, and market risk combined into one score before you present to a client.</p>
        </div>
        <div className="card" style={{ background: 'transparent' }}>
          <ShieldCheck color="var(--risk-amber)" size={24} style={{ marginBottom: '15px' }} />
          <h3 style={{ marginBottom: '10px' }}>Regulatory compliance</h3>
          <p style={{ color: 'var(--text-muted)' }}>Automatic gap detection against CSRD, SFDR, and IFRS S2 with no manual framework mapping.</p>
        </div>
        <div className="card" style={{ background: 'transparent' }}>
          <FileText color="var(--risk-green)" size={24} style={{ marginBottom: '15px' }} />
          <h3 style={{ marginBottom: '10px' }}>Board-ready output</h3>
          <p style={{ color: 'var(--text-muted)' }}>Export a structured PDF brief your investment committee can act on immediately.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px', width: '100%', padding: '40px', textAlign: 'center', backgroundColor: 'var(--card-surface)', marginBottom: '40px' }}>
        <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '100px 20px', color: 'var(--text-muted)' }}>
          [ Executive Dashboard Preview ]
        </div>
      </div>

      <div style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }} className="mono">
        Built for CBRE Hackathon 2025 &middot; Powered by Azure OpenAI + Claude AI
      </div>

    </div>
  );
}
