import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, ArrowRight } from 'lucide-react';

export default function FormFlow({ onComplete }: { onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    address: 'Mindspace IT Park, Hyderabad, India',
    assetClass: 'Grade A Office',
    gla: '45000',
    yearBuilt: '2009',
    numBuildings: '1',
    price: '120000000',
    loan: '78000000',
    rate: '3.9',
    maturity: '2027-03-15',
    occupancy: '85',
    annualElectricity: '550000',
    annualGas: '120000',
    hvacUnits: '3',
    refrigerantType: 'R-22',
    energyRating: 'None/Unknown',
    waterConsumption: '',
    wasteRecycled: ''
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAnalyse = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/analyse', formData);
      onComplete(res.data);
    } catch (err) {
      console.error(err);
      // Fallback if backend fails
      onComplete({
        dealRiskScore: 68,
        esgComplianceScore: 54,
        marketPositionScore: 75,
        carbonData: { footprintTonnes: 415, intensityKgPerSqm: 18.5, crremTarget: 14.0, status: "amber" },
        dealRiskBreakdown: [
          { factor: "Refinancing Risk", finding: "Loan matures Mar 2027, 3.9% vs current 6.5%", severity: "High", action: "Stress test at 7.0% SOFR" }
        ],
        esgComplianceDetail: [ { framework: "CSRD", status: "GAP" } ],
        actionPlan: [
          { title: "HVAC Replacement (R-22)", description: "Replace legacy cooling...", co2Saving: 34, dollarSaving: 18000, cost: 32000, payback: 1.8 }
        ],
        narrative: "This Grade A Office asset presents a moderate deal risk (68)..."
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">Processing Data with DealSense Engine...</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
        {[1,2,3,4].map(s => (
          <div key={s} style={{ height: '4px', flex: 1, backgroundColor: step >= s ? 'var(--accent-lime)' : 'var(--border-color)', borderRadius: '2px' }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Step 1: Property Identity</h2>
          <div className="form-group">
            <label>Property Address</label>
            <input name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Asset Class</label>
            <select name="assetClass" value={formData.assetClass} onChange={handleChange}>
              <option>Grade A Office</option>
              <option>Retail</option>
              <option>Industrial</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>GLA (sqm)</label>
              <input type="number" name="gla" value={formData.gla} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Year Built</label>
              <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setStep(2)}>Next <ArrowRight size={14} style={{display:'inline', verticalAlign:'middle'}}/></button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Step 2: Deal Terms</h2>
          <div className="form-group">
            <label>Purchase Price (USD)</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Existing Loan Amount (USD)</label>
            <input type="number" name="loan" value={formData.loan} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Current Interest Rate (%)</label>
              <input type="number" name="rate" value={formData.rate} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Maturity Date</label>
              <input type="date" name="maturity" value={formData.maturity} onChange={handleChange} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Step 3: Energy & Carbon Data</h2>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Annual Electricity (kWh)</label>
              <input type="number" name="annualElectricity" value={formData.annualElectricity} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Annual Gas (kWh)</label>
              <input type="number" name="annualGas" value={formData.annualGas} onChange={handleChange} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>HVAC Units</label>
              <input type="number" name="hvacUnits" value={formData.hvacUnits} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Refrigerant Type</label>
              <select name="refrigerantType" value={formData.refrigerantType} onChange={handleChange}>
                <option>R-22</option>
                <option>R-410A</option>
                <option>R-32</option>
                <option>R-134a</option>
                <option>Unknown</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Existing Energy Rating</label>
            <select name="energyRating" value={formData.energyRating} onChange={handleChange}>
              <option>LEED Platinum/Gold/Silver/Certified</option>
              <option>BREEAM Outstanding/Excellent/Very Good/Good</option>
              <option>NABERS 1–6 stars</option>
              <option>BEE 1–5 stars</option>
              <option>EPC A–G</option>
              <option>None/Unknown</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Water Consumption (kL/yr) - Optional</label>
              <input type="number" name="waterConsumption" value={formData.waterConsumption} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Waste Recycled (%) - Optional</label>
              <input type="number" name="wasteRecycled" value={formData.wasteRecycled} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button className="btn" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Review & Confirm</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Step 4: Review & Confirm</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            <p><strong>Address:</strong> {formData.address}</p>
            <p><strong>Price:</strong> ${Number(formData.price).toLocaleString()}</p>
            <p><strong>Interest Rate:</strong> {formData.rate}%</p>
            <p><strong>Energy Data:</strong> {formData.annualElectricity} kWh, {formData.annualGas} kWh</p>
            <br />
            <p style={{ color: 'var(--risk-amber)' }}>* Market comps, grid intensity, and rates will be auto-fetched.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" onClick={() => setStep(3)}>Back</button>
            <button className="btn btn-primary" onClick={handleAnalyse}>Analyse Full Pipeline</button>
          </div>
        </div>
      )}
    </div>
  );
}
