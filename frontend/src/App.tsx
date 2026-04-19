import { useState } from 'react';
import './index.css';
import FormFlow from './FormFlow';
import Dashboard from './Dashboard';
import Portfolio from './Portfolio';
import ActionPlan from './ActionPlan';
import Reports from './Reports';
import LandingPage from './LandingPage';
import { ShieldCheck } from 'lucide-react';
import { loadSavedReports, saveReport, deleteReport, type SavedReport } from './lib/reportStore';

// Demo seed mirrors the new scoring engine contract (Fix 8)
const DEMO_PAYLOAD = {
  dealRiskScore: 68,
  esgComplianceScore: 54,
  marketPositionScore: 75,
  carbonData: {
    footprintTonnes: 415,
    intensityKgPerSqm: 18.5,
    crremTarget: 14.0,
    baseCrrem: 14.0,
    envelopeFactor: 1.0,
    status: 'amber',
    scope1: 36.6,
    scope2: 390.5,
    scope3: 0,
  },
  dealRiskBreakdown: [
    { factor: 'Refinancing Risk', finding: 'Loan matures in ~24 mos at 3.9% (benchmark 6.5%)', severity: 'High', action: 'Stress-test at 7.0%' },
    { factor: 'LTV Limit', finding: '65%', severity: 'Low', action: 'None' },
    { factor: 'Occupancy', finding: '85%', severity: 'Low', action: 'Monitor' },
    { factor: 'ESG Penalty', finding: 'Score 54', severity: 'Medium', action: 'See Action Plan' },
  ],
  esgComplianceDetail: [
    { framework: 'GHG Scope 1', status: 'PASS', note: 'Auto-calculated' },
    { framework: 'GHG Scope 2', status: 'PASS', note: 'Auto-calculated' },
    { framework: 'GHG Scope 3', status: 'PARTIAL', note: 'Not mandatory — optional input' },
    { framework: 'Refrigerant Tracking', status: 'N/A', note: 'Not required in this jurisdiction' },
    { framework: 'BEE/PAT', status: 'PASS', note: 'Indian Bureau of Energy Efficiency' },
    { framework: 'Water', status: 'PASS', note: '4/7 pts' },
    { framework: 'Waste', status: 'PARTIAL', note: '2/8 pts' },
  ],
  applicability: {
    CSRD: false, SFDR: false, 'IFRS S2': false,
    'GHG Scope 1': true, 'GHG Scope 2': true,
    'Refrigerant Tracking': false, 'BEE/PAT': true,
  },
  context: {
    country: 'IN', countryName: 'India',
    gridIntensity: 0.71, benchmarkRate: 6.5, tariff: 0.12,
    assetClass: 'Grade A Office', address: 'Mindspace IT Park, Hyderabad, India',
    numBuildings: 1, envelope: 'Standard', rateType: 'Fixed', carbonPrice: 0,
    energyRating: 'None/Unknown',
    hvacList: [
      { label: 'Unit 1', refrigerant: 'R-22',   age: 16, capacityKw: 85 },
      { label: 'Unit 2', refrigerant: 'R-410A', age: 8,  capacityKw: 120 },
      { label: 'Unit 3', refrigerant: 'Unknown', age: 22, capacityKw: 95 },
    ],
  },
  actionPlan: [
    { title: 'Refrigerant Tracking & Retrofit', description: 'Replace 2 legacy/unknown unit(s). Improves operating reliability and ESG score.', co2Saving: 7.6, dollarSaving: 8000, cost: 13000, payback: 1.6 },
    { title: 'Energy Audit & Retrofit', description: 'Upgrade HVAC and LED lighting to hit CRREM 2030 target (14.0 kgCO₂/sqm/yr).', co2Saving: 202, dollarSaving: 24300, cost: 67500, payback: 2.78 },
    { title: 'Waste Diversion Programme', description: 'Contract with recycling partner; target >75% diversion from landfill.', co2Saving: 8, dollarSaving: 6000, cost: 9000, payback: 1.5 },
  ],
  narrative:
    'This Grade A Office in India presents a deal risk of 68 and an ESG compliance score of 54. At 18.5 kgCO₂/sqm against a 14.0 benchmark, the asset is amber. Refinancing in ~24 months at 3.9% vs 6.5% benchmark is the primary risk.',
  portfolioAssets: null,
};

function App() {
  const isDemo = window.location.search.includes('demo=true');
  const [showLanding, setShowLanding] = useState(!isDemo);
  const [activeTab, setActiveTab] = useState('Analyser');
  const [analysisResult, setAnalysisResult] = useState<any>(isDemo ? DEMO_PAYLOAD : null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(loadSavedReports);

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    saveReport(result);
    setSavedReports(loadSavedReports());
  };

  const handleDeleteReport = (id: string) => {
    setSavedReports(deleteReport(id));
  };

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} onDemo={() => {
      setAnalysisResult(DEMO_PAYLOAD);
      saveReport(DEMO_PAYLOAD);
      setSavedReports(loadSavedReports());
      setShowLanding(false);
    }} />;
  }

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="top-bar-logo">
          <ShieldCheck size={24} color="var(--accent-lime)" />
          DealSense ESG
        </div>
        <div>
          <span className="mode-badge">
            {analysisResult?.context?.numBuildings > 1 ? 'Asset Manager Mode' : 'Broker Mode'}
          </span>
        </div>
      </header>

      <nav className="tabs-row">
        {['Analyser', 'Portfolio', 'ActionPlan', 'Reports'].map(t => (
          <div key={t}
            className={`tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>
            {t === 'Analyser' ? 'Deal Analyser' : t === 'ActionPlan' ? 'Action Plan' : t === 'Portfolio' ? 'ESG Portfolio' : 'Reports'}
          </div>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === 'Analyser' && (
          !analysisResult ? (
            <FormFlow onComplete={handleAnalysisComplete} />
          ) : (
            <Dashboard data={analysisResult} onReset={() => setAnalysisResult(null)} />
          )
        )}

        {activeTab === 'Portfolio' && <Portfolio analysisResult={analysisResult} />}

        {activeTab === 'ActionPlan' && <ActionPlan analysisResult={analysisResult} />}

        {activeTab === 'Reports' && (
          <Reports
            onGoToAnalysis={() => setActiveTab('Analyser')}
            savedReports={savedReports}
            onDelete={handleDeleteReport}
          />
        )}
      </main>
    </div>
  );
}

export default App;
