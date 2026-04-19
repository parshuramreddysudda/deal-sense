import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Plus, X, Info, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

const COUNTRY_OPTIONS = [
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' },
  { code: 'OTHER', name: 'Other' },
];

const COUNTRY_GRID: Record<string, number> = {
  IN: 0.71, GB: 0.21, US: 0.37, DE: 0.38, FR: 0.055, AU: 0.63, SG: 0.408, AE: 0.46, OTHER: 0.48,
};
const COUNTRY_RATE: Record<string, number> = {
  IN: 6.50, GB: 5.25, US: 4.50, DE: 3.75, FR: 3.75, AU: 4.35, SG: 3.50, AE: 5.40, OTHER: 4.50,
};
const EU_COUNTRIES = ['DE', 'FR'];

const REFRIGERANTS = ['R-22', 'R-410A', 'R-32', 'R-134a', 'R-600a', 'Unknown'];

const ENERGY_RATINGS: { group: string; options: string[] }[] = [
  { group: 'LEED', options: ['LEED Platinum', 'LEED Gold', 'LEED Silver', 'LEED Certified'] },
  { group: 'BREEAM', options: ['BREEAM Outstanding', 'BREEAM Excellent', 'BREEAM Very Good', 'BREEAM Good', 'BREEAM Pass'] },
  { group: 'NABERS', options: ['NABERS 6 Star', 'NABERS 5 Star', 'NABERS 4 Star', 'NABERS 3 Star', 'NABERS 2 Star', 'NABERS 1 Star'] },
  { group: 'BEE', options: ['BEE 5 Star', 'BEE 4 Star', 'BEE 3 Star', 'BEE 2 Star', 'BEE 1 Star'] },
  { group: 'EPC', options: ['EPC A', 'EPC B', 'EPC C', 'EPC D', 'EPC E', 'EPC F', 'EPC G'] },
];

type HvacUnit = { label: string; refrigerant: string; age: string; capacityKw: string };

type FormState = {
  address: string;
  country: string;
  assetClass: string;
  gla: string;
  yearBuilt: string;
  numBuildings: string;
  envelope: 'Poor' | 'Standard' | 'Good';
  officePct: string;
  otherPct: string;
  isEuListed: boolean;
  isFundManager: boolean;
  isPubliclyListed: boolean;
  price: string;
  loan: string;
  rate: string;
  rateType: 'Fixed' | 'Floating';
  maturity: string;
  occupancy: string;
  carbonPrice: string;
  annualElectricity: string;
  annualGas: string;
  hvacList: HvacUnit[];
  energyRating: string;
  waterConsumption: string;
  wasteRecycled: string;
  scope1: string;
  scope2: string;
  scope3: string;
};

const INITIAL_STATE: FormState = {
  address: 'Mindspace IT Park, Hyderabad, India',
  country: 'IN',
  assetClass: 'Grade A Office',
  gla: '45000',
  yearBuilt: '2009',
  numBuildings: '1',
  envelope: 'Standard',
  officePct: '100',
  otherPct: '0',
  isEuListed: false,
  isFundManager: false,
  isPubliclyListed: false,
  price: '120000000',
  loan: '78000000',
  rate: '3.9',
  rateType: 'Fixed',
  maturity: '2027-03-15',
  occupancy: '85',
  carbonPrice: '',
  annualElectricity: '550000',
  annualGas: '120000',
  hvacList: [
    { label: 'Unit 1', refrigerant: 'R-22', age: '16', capacityKw: '85' },
    { label: 'Unit 2', refrigerant: 'R-410A', age: '8', capacityKw: '120' },
    { label: 'Unit 3', refrigerant: 'Unknown', age: '22', capacityKw: '95' },
  ],
  energyRating: 'None/Unknown',
  waterConsumption: '18500',
  wasteRecycled: '35',
  scope1: '',
  scope2: '',
  scope3: '',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 12,
};

const banner = (bg: string, border: string, color: string): React.CSSProperties => ({
  background: bg, border: `1px solid ${border}`, color, padding: '8px 12px', borderRadius: 6,
  fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 14px',
});

export default function FormFlow({ onComplete }: { onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [f, setF] = useState<FormState>(INITIAL_STATE);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(prev => ({ ...prev, [k]: v }));

  const totalPct = Number(f.officePct || 0) + Number(f.otherPct || 0);
  const pctValid = totalPct === 100;

  const addHvac = () => {
    if (f.hvacList.length >= 50) return;
    set('hvacList', [...f.hvacList, {
      label: `Unit ${f.hvacList.length + 1}`,
      refrigerant: 'R-410A', age: '', capacityKw: '',
    }]);
  };
  const removeHvac = (idx: number) => {
    if (idx === 0) return;
    set('hvacList', f.hvacList.filter((_, i) => i !== idx).map((u, i) => ({ ...u, label: `Unit ${i + 1}` })));
  };
  const updateHvac = (idx: number, patch: Partial<HvacUnit>) => {
    set('hvacList', f.hvacList.map((u, i) => (i === idx ? { ...u, ...patch } : u)));
  };

  const countryMeta = useMemo(() => ({
    grid: COUNTRY_GRID[f.country] ?? 0.48,
    rate: COUNTRY_RATE[f.country] ?? 4.5,
    name: COUNTRY_OPTIONS.find(c => c.code === f.country)?.name ?? 'Other',
  }), [f.country]);

  const applicableFrameworks = useMemo(() => {
    const out: string[] = [];
    if (EU_COUNTRIES.includes(f.country) || f.isEuListed) out.push('CSRD');
    if (f.isFundManager) out.push('SFDR');
    if (f.isPubliclyListed) out.push('IFRS S2');
    if (f.country === 'IN' && Number(f.annualElectricity) > 500_000) out.push('BEE/PAT');
    out.push('GHG Scope 1/2');
    return out;
  }, [f.country, f.isEuListed, f.isFundManager, f.isPubliclyListed, f.annualElectricity]);

  const estimatedDefaults = useMemo(() => {
    const d: { label: string; value: string }[] = [];
    if (!f.carbonPrice) d.push({ label: 'Carbon price', value: '$0 / tonne (no scheme)' });
    if (!f.scope1) d.push({ label: 'Scope 1', value: 'Auto-calculated from gas + refrigerants' });
    if (!f.scope2) d.push({ label: 'Scope 2', value: `Auto-calculated: ${(Number(f.annualElectricity || 0) * countryMeta.grid / 1000).toFixed(0)} t` });
    if (!f.scope3) d.push({ label: 'Scope 3', value: 'Excluded (0 t)' });
    if (!f.waterConsumption) d.push({ label: 'Water consumption', value: 'Not assessed (not penalised)' });
    if (!f.wasteRecycled) d.push({ label: 'Waste diversion', value: 'Not assessed (not penalised)' });
    return d;
  }, [f, countryMeta.grid]);

  const buildPayload = () => ({
    ...f,
    numBuildings: Number(f.numBuildings || 1),
    officePct: Number(f.officePct || 0),
    otherPct: Number(f.otherPct || 0),
    carbonPrice: f.carbonPrice === '' ? 0 : Number(f.carbonPrice),
    waterConsumption: f.waterConsumption === '' ? null : Number(f.waterConsumption),
    wasteRecycled: f.wasteRecycled === '' ? null : Number(f.wasteRecycled),
    scope1: f.scope1 === '' ? null : Number(f.scope1),
    scope2: f.scope2 === '' ? null : Number(f.scope2),
    scope3: f.scope3 === '' ? null : Number(f.scope3),
  });

  const handleAnalyse = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await axios.post('http://localhost:3001/api/analyse', buildPayload(), {
        timeout: 15000,
      });
      onComplete(res.data);
    } catch (err: any) {
      console.error('Analyse request failed:', err);
      let message: string;
      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        message = 'Could not reach the DealSense backend on http://localhost:3001. Make sure it is running (npm start from the repo root, or npm run start:backend).';
      } else if (err?.response) {
        message = `Backend returned ${err.response.status}: ${err.response.data?.error || err.response.statusText || 'unknown error'}`;
      } else if (err?.code === 'ECONNABORTED') {
        message = 'Request timed out after 15s. The backend may be slow or stuck.';
      } else {
        message = err?.message || 'Unknown error while calling the scoring engine.';
      }
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseOfflineFallback = () => {
    // Build a best-effort local payload so the user is never stuck on Step 4
    // even if the backend is unreachable. Flagged as offline in the narrative.
    const p = buildPayload();
    const elec = Number(p.annualElectricity) || 0;
    const gas  = Number(p.annualGas) || 0;
    const scope2Auto = (elec * (COUNTRY_GRID[p.country] ?? 0.48)) / 1000;
    const scope1Auto = (gas * 0.202) / 1000;
    const intensity = ((scope1Auto + scope2Auto) * 1000) / Math.max(1, Number(p.gla) || 1);
    onComplete({
      dealRiskScore: 60,
      esgComplianceScore: 55,
      marketPositionScore: 70,
      carbonData: {
        footprintTonnes: Math.round(scope1Auto + scope2Auto),
        intensityKgPerSqm: +intensity.toFixed(1),
        crremTarget: 14,
        baseCrrem: 14,
        envelopeFactor: 1,
        status: intensity > 14 ? 'amber' : 'green',
        scope1: +scope1Auto.toFixed(1),
        scope2: +scope2Auto.toFixed(1),
        scope3: 0,
      },
      dealRiskBreakdown: [
        { factor: 'Offline fallback', finding: 'Backend unreachable — scores are placeholder estimates', severity: 'Medium', action: 'Start the backend for a full scoring run' },
      ],
      esgComplianceDetail: [
        { framework: 'GHG Scope 1', status: 'PASS', note: 'Auto-calculated (offline)' },
        { framework: 'GHG Scope 2', status: 'PASS', note: 'Auto-calculated (offline)' },
      ],
      applicability: { CSRD: false, SFDR: false, 'IFRS S2': false, 'GHG Scope 1': true, 'GHG Scope 2': true },
      context: {
        country: p.country, countryName: p.country, gridIntensity: COUNTRY_GRID[p.country] ?? 0.48,
        benchmarkRate: COUNTRY_RATE[p.country] ?? 4.5, tariff: 0.15,
        assetClass: p.assetClass, address: p.address,
        numBuildings: p.numBuildings, envelope: p.envelope, rateType: p.rateType,
        carbonPrice: p.carbonPrice, energyRating: p.energyRating,
      },
      actionPlan: [],
      narrative: 'Backend unreachable — this is an offline fallback result. Start the backend and click Retry for a full scoring run.',
      portfolioAssets: null,
    });
  };

  if (loading) return <div className="loading">Processing Data with DealSense Engine…</div>;

  return (
    <div className="card" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', gap: 5 }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ height: 4, flex: 1, backgroundColor: step >= s ? 'var(--accent-lime)' : 'var(--border-color)', borderRadius: 2 }} />
        ))}
      </div>

      {/* ================== STEP 1 ================== */}
      {step === 1 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>Step 1: Property Identity</h2>

          <div className="form-group">
            <label>Property Address</label>
            <input value={f.address} onChange={e => set('address', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 15 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Country *</label>
              <select value={f.country} onChange={e => set('country', e.target.value)}>
                {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Grid intensity {countryMeta.grid} kgCO₂/kWh · Benchmark rate {countryMeta.rate}%
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Asset Class</label>
              <select value={f.assetClass} onChange={e => set('assetClass', e.target.value)}>
                <option>Grade A Office</option>
                <option>Retail</option>
                <option>Industrial</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 15 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>GLA (sqm)</label>
              <input type="number" value={f.gla} onChange={e => set('gla', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Year Built</label>
              <input type="number" value={f.yearBuilt} onChange={e => set('yearBuilt', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Number of Buildings</label>
            <input type="number" min={1} value={f.numBuildings}
              onChange={e => set('numBuildings', e.target.value)} />
            {Number(f.numBuildings) > 1 ? (
              <div style={banner('rgba(74,158,255,0.08)', '#4a9eff', '#4a9eff')}>
                <Info size={14} /> Asset Manager Mode active — portfolio analysis enabled.
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Broker Mode — single deal analysis.</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <label style={{ ...labelStyle }}>
              <input type="checkbox" checked={f.isFundManager}
                onChange={e => set('isFundManager', e.target.checked)} style={{ marginRight: 8 }} />
              I am a fund manager or asset manager (SFDR applies)
            </label>
            <label style={{ ...labelStyle }}>
              <input type="checkbox" checked={f.isEuListed}
                onChange={e => set('isEuListed', e.target.checked)} style={{ marginRight: 8 }} />
              Company is EU-listed or operates in EU (CSRD applies)
            </label>
            <label style={{ ...labelStyle }}>
              <input type="checkbox" checked={f.isPubliclyListed}
                onChange={e => set('isPubliclyListed', e.target.checked)} style={{ marginRight: 8 }} />
              Company is publicly listed (IFRS S2 applies)
            </label>
          </div>

          <div className="form-group">
            <label>Building Envelope Quality</label>
            <select value={f.envelope} onChange={e => set('envelope', e.target.value as any)}>
              <option value="Poor">Poor — pre-1990 unimproved construction</option>
              <option value="Standard">Standard — 1990 to 2010 or basic retrofit</option>
              <option value="Good">Good — post-2010 or substantially retrofitted</option>
            </select>
          </div>

          <div className="form-group">
            <label>Primary Building Use (must sum to 100%)</label>
            <div style={{ display: 'flex', gap: 15 }}>
              <div style={{ flex: 1 }}>
                <input type="number" placeholder="Office %" value={f.officePct}
                  onChange={e => set('officePct', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <input type="number" placeholder="Other %" value={f.otherPct}
                  onChange={e => set('otherPct', e.target.value)} />
              </div>
            </div>
            {!pctValid && (
              <div style={{ color: 'var(--risk-red)', fontSize: 11, marginTop: 4 }}>
                Office % + Other % must equal 100 (currently {totalPct}%).
              </div>
            )}
          </div>

          <button className="btn btn-primary" disabled={!pctValid} onClick={() => setStep(2)}>
            Next <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {/* ================== STEP 2 ================== */}
      {step === 2 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>Step 2: Deal Terms</h2>
          <div className="form-group">
            <label>Purchase Price (USD)</label>
            <input type="number" value={f.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Existing Loan Amount (USD)</label>
            <input type="number" value={f.loan} onChange={e => set('loan', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 15 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Current Interest Rate (%)</label>
              <input type="number" step="0.1" value={f.rate} onChange={e => set('rate', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Maturity Date</label>
              <input type="date" value={f.maturity} onChange={e => set('maturity', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Loan Interest Rate Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['Fixed', 'Floating'] as const).map(rt => (
                <button key={rt} type="button"
                  className={`btn ${f.rateType === rt ? 'btn-primary' : ''}`}
                  style={{ flex: 1 }} onClick={() => set('rateType', rt)}>
                  {rt}
                </button>
              ))}
            </div>
            {f.rateType === 'Floating' && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                We will compare against the current benchmark rate for {countryMeta.name} ({countryMeta.rate}%) automatically.
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Occupancy (%)</label>
            <input type="number" value={f.occupancy} onChange={e => set('occupancy', e.target.value)} />
          </div>

          <div className="form-group">
            <label title="EU ETS, UK ETS, or other compliance carbon market price">
              Carbon Price (USD per tonne — optional)
            </label>
            <input type="number" placeholder="Leave blank if not in a carbon pricing scheme"
              value={f.carbonPrice} onChange={e => set('carbonPrice', e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              If covered by EU ETS, UK ETS, or another compliance market, enter the current price per tonne.
              This increases the calculated ROI of emission-reduction actions.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next</button>
          </div>
        </div>
      )}

      {/* ================== STEP 3 ================== */}
      {step === 3 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>Step 3: Energy &amp; Carbon Data</h2>

          <div style={{ display: 'flex', gap: 15 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Annual Electricity (kWh)</label>
              <input type="number" value={f.annualElectricity}
                onChange={e => set('annualElectricity', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Annual Gas (kWh)</label>
              <input type="number" value={f.annualGas} onChange={e => set('annualGas', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>HVAC Units (per-unit entry, max 50)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {f.hvacList.map((u, idx) => {
                const isUnknown = u.refrigerant === 'Unknown';
                return (
                  <div key={idx} style={{
                    border: '1px solid var(--border-color)', borderRadius: 6, padding: 10,
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 60, fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {u.label}
                      </div>
                      <select value={u.refrigerant} onChange={e => updateHvac(idx, { refrigerant: e.target.value })}
                        style={{ flex: 1, background: 'var(--card-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: 8, borderRadius: 6 }}>
                        {REFRIGERANTS.map(r => <option key={r}>{r}</option>)}
                      </select>
                      <input type="number" placeholder="Age (yrs)" value={u.age}
                        onChange={e => updateHvac(idx, { age: e.target.value })}
                        style={{ width: 80, background: 'var(--card-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: 8, borderRadius: 6 }} />
                      <input type="number" placeholder="kW" value={u.capacityKw}
                        onChange={e => updateHvac(idx, { capacityKw: e.target.value })}
                        style={{ width: 70, background: 'var(--card-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: 8, borderRadius: 6 }} />
                      {idx > 0 && (
                        <button type="button" onClick={() => removeHvac(idx)}
                          style={{ background: 'transparent', border: `1px solid var(--risk-red)`, color: 'var(--risk-red)', borderRadius: 6, padding: 6, cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {isUnknown && (
                      <div style={{ color: 'var(--risk-red)', fontSize: 11, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={12} /> This unit will be flagged as a CSRD compliance gap.
                      </div>
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={addHvac}
                style={{
                  alignSelf: 'flex-start', background: 'transparent', color: '#4a9eff',
                  border: '1px dashed #4a9eff', borderRadius: 6, padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12,
                }}>
                <Plus size={14} /> Add another HVAC unit
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Existing Energy Rating</label>
            <select value={f.energyRating} onChange={e => set('energyRating', e.target.value)}>
              {ENERGY_RATINGS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </optgroup>
              ))}
              <option value="None/Unknown">None or Unknown</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 15 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Water Consumption (kL/yr) — Optional</label>
              <input type="number" value={f.waterConsumption}
                onChange={e => set('waterConsumption', e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                If unknown, this dimension will be excluded from your ESG score rather than penalised.
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Waste Diversion % from landfill — Optional</label>
              <input type="number" min={0} max={100} value={f.wasteRecycled}
                onChange={e => set('wasteRecycled', e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Enter 0 if all waste goes to landfill. Leave blank to exclude from scoring.
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 10, padding: 12, border: '1px solid var(--border-color)',
            borderRadius: 6, background: 'rgba(200,255,0,0.03)',
          }}>
            <div className="mono-label" style={{ marginBottom: 8 }}>GHG Emissions — Scopes</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Scope 1 (t CO₂/yr)</label>
                <input type="number" placeholder="auto" value={f.scope1}
                  onChange={e => set('scope1', e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Scope 2 (t CO₂/yr)</label>
                <input type="number" placeholder="auto" value={f.scope2}
                  onChange={e => set('scope2', e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Scope 3 (t CO₂/yr)</label>
                <input type="number" placeholder="optional" value={f.scope3}
                  onChange={e => set('scope3', e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Scope 1 and 2 will be calculated automatically from your energy inputs if left blank.
              Scope 3 is optional but improves regulatory compliance scoring.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Review &amp; Confirm</button>
          </div>
        </div>
      )}

      {/* ================== STEP 4 ================== */}
      {step === 4 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>Step 4: Review &amp; Confirm</h2>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="mono-label" style={{ marginBottom: 10 }}>Your inputs</div>
            <table style={{ width: '100%', fontSize: 12 }}>
              <tbody>
                <Row k="Address" v={f.address} />
                <Row k="Country" v={countryMeta.name} />
                <Row k="Asset Class" v={f.assetClass} />
                <Row k="GLA" v={`${Number(f.gla).toLocaleString()} sqm`} />
                <Row k="Year Built" v={f.yearBuilt} />
                <Row k="Number of Buildings" v={f.numBuildings} />
                <Row k="Envelope" v={f.envelope} />
                <Row k="Use Mix" v={`${f.officePct}% Office / ${f.otherPct}% Other`} />
                <Row k="Price" v={`$${Number(f.price).toLocaleString()}`} />
                <Row k="Loan" v={`$${Number(f.loan).toLocaleString()}`} />
                <Row k="Rate" v={`${f.rate}% (${f.rateType})`} />
                <Row k="Maturity" v={f.maturity} />
                <Row k="Occupancy" v={`${f.occupancy}%`} />
                <Row k="Carbon Price" v={f.carbonPrice ? `$${f.carbonPrice}/t` : '—'} />
                <Row k="Electricity" v={`${Number(f.annualElectricity).toLocaleString()} kWh`} />
                <Row k="Gas" v={`${Number(f.annualGas).toLocaleString()} kWh`} />
                <Row k="HVAC Units" v={`${f.hvacList.length} — ${f.hvacList.map(u => u.refrigerant).join(', ')}`} />
                <Row k="Energy Rating" v={f.energyRating} />
                <Row k="Water" v={f.waterConsumption ? `${f.waterConsumption} kL` : '—'} />
                <Row k="Waste diverted" v={f.wasteRecycled ? `${f.wasteRecycled}%` : '—'} />
                <Row k="Scope 1 / 2 / 3" v={`${f.scope1 || 'auto'} / ${f.scope2 || 'auto'} / ${f.scope3 || 'n/a'}`} />
                <Row k="Disclosure flags" v={[
                  f.isEuListed && 'EU-listed',
                  f.isFundManager && 'Fund Mgr',
                  f.isPubliclyListed && 'Publicly Listed',
                ].filter(Boolean).join(', ') || 'None'} />
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="mono-label" style={{ marginBottom: 10, color: 'var(--accent-lime)' }}>Auto-fetched data</div>
            <table style={{ width: '100%', fontSize: 12 }}>
              <tbody>
                <Row k="Grid carbon intensity" v={`${countryMeta.grid} kgCO₂/kWh (${countryMeta.name})`} />
                <Row k="Benchmark interest rate" v={`${countryMeta.rate}% (${countryMeta.name})`} />
                <Row k="Applicable frameworks" v={applicableFrameworks.join(', ')} />
              </tbody>
            </table>
          </div>

          {estimatedDefaults.length > 0 && (
            <div className="card" style={{ marginBottom: 16, borderColor: 'var(--risk-amber)' }}>
              <div className="mono-label" style={{ marginBottom: 10, color: 'var(--risk-amber)' }}>Estimated defaults (blank fields)</div>
              <table style={{ width: '100%', fontSize: 12 }}>
                <tbody>
                  {estimatedDefaults.map((d, i) => <Row key={i} k={d.label} v={d.value} />)}
                </tbody>
              </table>
            </div>
          )}

          {submitError && (
            <div style={{
              padding: '12px 14px', borderRadius: 6, marginBottom: 16,
              background: 'rgba(255,77,106,0.08)',
              border: '1px solid var(--risk-red)',
              color: 'var(--risk-red)', fontSize: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <WifiOff size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Analyse pipeline failed</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{submitError}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setStep(3)}>Back</button>
            {submitError ? (
              <>
                <button className="btn btn-primary" onClick={handleAnalyse}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} /> Retry
                </button>
                <button className="btn" onClick={handleUseOfflineFallback}
                  title="Render a placeholder dashboard without the backend">
                  Continue offline
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleAnalyse}>
                Analyse Full Pipeline
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td style={{ color: 'var(--text-muted)', padding: '4px 8px 4px 0', width: '45%' }}>{k}</td>
      <td style={{ padding: 4, fontFamily: 'var(--font-dm-mono)' }}>{v}</td>
    </tr>
  );
}
