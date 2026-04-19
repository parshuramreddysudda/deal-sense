import React, { useState } from 'react';
import './index.css';
import FormFlow from './FormFlow';
import Dashboard from './Dashboard';
import Portfolio from './Portfolio';
import ActionPlan from './ActionPlan';
import Reports from './Reports';
import LandingPage from './LandingPage';
import { ShieldCheck } from 'lucide-react';

function App() {
  const [showLanding, setShowLanding] = useState(!window.location.search.includes('demo=true'));
  const [activeTab, setActiveTab] = useState('Analyser');
  
  const demoPayload = {
    dealRiskScore: 68,
    esgComplianceScore: 54,
    marketPositionScore: 75,
    carbonData: { footprintTonnes: 415, intensityKgPerSqm: "18.5", crremTarget: 14.0, status: "amber" },
    dealRiskBreakdown: [
      { factor: "Refinancing Risk", finding: "Loan matures in ~24 mos", severity: "High", action: "Stress test rates" },
      { factor: "LTV Limit", finding: "65%", severity: "Low", action: "None" },
      { factor: "Occupancy", finding: "85%", severity: "Low", action: "Lease effort" },
      { factor: "ESG Penalty", finding: "Score 54", severity: "Medium", action: "See Action Plan" }
    ],
    esgComplianceDetail: [
      { framework: "CSRD", status: "GAP" },
      { framework: "SFDR", status: "PARTIAL" },
      { framework: "BEE/PAT", status: "PASS" }
    ],
    actionPlan: [
      { title: "Refrigerant Tracking System", description: "Install automated leak detection to meet CSRD standards.", co2Saving: 12, dollarSaving: 5000, cost: 4500, payback: 0.9 },
      { title: "Energy Audit & Retrofit", description: "Upgrade HVAC and LED lighting to hit CRREM targets.", co2Saving: 202, dollarSaving: 24300, cost: 67500, payback: 2.7 }
    ],
    narrative: "This Grade A Office asset presents a moderate deal risk (68), primarily driven by the upcoming 2027 refinancing cliff where interest expenses will significantly increase. However, the asset is structurally sound with standard occupancy. From an ESG perspective, the Compliance Score of 54 flags immediate CSRD data gaps."
  };

  const [analysisResult, setAnalysisResult] = useState<any>(window.location.search.includes('demo=true') ? demoPayload : null);

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} onDemo={() => {
      setAnalysisResult(demoPayload);
      setShowLanding(false);
    }} />
  }

  return (
    <div className="app-container">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-logo">
          <ShieldCheck size={24} color="var(--accent-lime)" />
          DealSense ESG
        </div>
        <div>
          <span className="mode-badge">Broker Mode</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs-row">
        <div className={`tab ${activeTab === 'Analyser' ? 'active' : ''}`} onClick={() => setActiveTab('Analyser')}>
          Deal Analyser
        </div>
        <div className={`tab ${activeTab === 'Portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('Portfolio')}>
          ESG Portfolio
        </div>
        <div className={`tab ${activeTab === 'ActionPlan' ? 'active' : ''}`} onClick={() => setActiveTab('ActionPlan')}>
          Action Plan
        </div>
        <div className={`tab ${activeTab === 'Reports' ? 'active' : ''}`} onClick={() => setActiveTab('Reports')}>
          Reports
        </div>
      </nav>

      {/* Main Area */}
      <main className="main-content">
        {activeTab === 'Analyser' && (
          !analysisResult ? (
            <FormFlow onComplete={(result) => setAnalysisResult(result)} />
          ) : (
            <Dashboard data={analysisResult} onReset={() => setAnalysisResult(null)} />
          )
        )}

        {activeTab === 'Portfolio' && <Portfolio />}

        {activeTab === 'ActionPlan' && <ActionPlan analysisResult={analysisResult} />}

        {activeTab === 'Reports' && <Reports onGoToAnalysis={() => setActiveTab('Analyser')} />}
      </main>
    </div>
  );
}

export default App;
