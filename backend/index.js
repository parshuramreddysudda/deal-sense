const express = require('express');
const cors = require('cors');
const multer = require('multer');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Helper to simulate artificial delay
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// GET /api/market-data?address=&assetClass=
app.get('/api/market-data', async (req, res) => {
    const { address, assetClass } = req.query;
    
    await delay(500); // Simulate network

    // Default demo data for Hyderabad
    res.json({
        submarketVacancy: 14.5,
        recentSalePricePerSqm: 2400,
        benchmarkInterestRate: 6.5,
        gridCarbonIntensity: 0.71, // India average kg/kWh
        localElectricityTariff: 0.12, // USD approx
    });
});

// POST /api/upload-bills
app.post('/api/upload-bills', upload.single('file'), async (req, res) => {
    await delay(1000); // Simulate OCR
    
    res.json({
        extracted: {
            annual_kwh: 550000,
            annual_gas_kwh: 120000,
            billing_period: "Jan 2024 - Dec 2024",
            property_address_on_bill: "Mindspace IT Park, Hyderabad",
            utility_provider: "TSSPDCL"
        }
    });
});

const GRID_INTENSITY = 0.71; 
const GAS_INTENSITY = 0.202;
const GWP_MAPPING = { 'R-22': 1810, 'R-410A': 2088, 'R-32': 675, 'R-134a': 1430, 'Unknown': 2000 };

// POST /api/analyse
app.post('/api/analyse', async (req, res) => {
    await delay(1000); 
    const { 
        assetClass, gla, price, loan, rate, maturity, occupancy,
        annualElectricity, annualGas, hvacUnits, refrigerantType,
        waterConsumption, wasteRecycled
    } = req.body;

    const kwh = Number(annualElectricity) || 0;
    const gasKwh = Number(annualGas) || 0;
    const hvac = Number(hvacUnits) || 0;
    const refGwp = GWP_MAPPING[refrigerantType] || 2000;
    
    // 1. Carbon calculations
    const carbonFootprint = (kwh * GRID_INTENSITY / 1000) + (gasKwh * GAS_INTENSITY / 1000) + (hvac * 2 * refGwp / 1000);
    const intensity = (carbonFootprint * 1000) / (Number(gla) || 1);
    const crremTarget = 14.0;
    
    let carbonStatus = "green";
    let pctAbove = 0;
    if (intensity > crremTarget) {
        pctAbove = (intensity - crremTarget) / crremTarget;
        carbonStatus = pctAbove > 0.4 ? "red" : "amber";
    }

    // 2. ESG Compliance Score
    let esgScore = 0;
    if (kwh > 0 && gasKwh > 0) esgScore += 20;
    else if (kwh > 0) esgScore += 12;

    if (carbonStatus === "green") esgScore += 25;
    else if (carbonStatus === "amber") esgScore += 15;
    else if (carbonStatus === "red") esgScore += 5;

    if (refrigerantType !== 'Unknown' && hvac > 0) esgScore += 15;
    else if (hvac === 0) esgScore += 15;
    
    let frameworkPoints = 25;
    if (refrigerantType === 'Unknown') frameworkPoints -= 8;
    esgScore += frameworkPoints;

    if (waterConsumption && Number(waterConsumption) > 0) esgScore += 7;
    if (wasteRecycled && Number(wasteRecycled) > 0) esgScore += 8;
    
    esgScore = Math.min(100, Math.max(0, esgScore));

    // 3. Deal Risk Score
    let riskScore = 0;
    const maturityDate = new Date(maturity);
    const monthsToMaturity = (maturityDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsToMaturity < 24 && Number(rate) < 5.0) riskScore += 30; 
    else if (monthsToMaturity < 36 && Number(rate) < 5.5) riskScore += 20;
    
    const ltv = (Number(loan) / Number(price)) * 100;
    if (ltv > 70) riskScore += 10;
    if (Number(occupancy) < 80.5) riskScore += 10;

    if (esgScore < 40) riskScore += 25;
    else if (esgScore <= 60) riskScore += 15;
    else riskScore += 5;
    
    if (refrigerantType === 'Unknown') riskScore += 10;
    riskScore += 8; // Market proxy
    riskScore = Math.min(100, riskScore);

    // 4. Action Plan
    const actionPlan = [];
    if (refrigerantType === 'Unknown') {
        actionPlan.push({
            title: "Refrigerant Tracking System",
            description: "Install automated leak detection to meet CSRD standards.",
            co2Saving: hvac * 2 * 2000 / 1000,
            dollarSaving: 5000, cost: hvac * 1500, payback: (hvac * 1500) / 5000
        });
    }
    if (intensity > crremTarget) {
        actionPlan.push({
            title: "Energy Audit & Retrofit",
            description: "Upgrade HVAC and LED lighting to hit CRREM targets.",
            co2Saving: (intensity - crremTarget) * Number(gla) / 1000,
            dollarSaving: (intensity - crremTarget) * Number(gla) * 0.12, 
            cost: Number(gla) * 1.5,
            payback: (Number(gla) * 1.5) / ((intensity - crremTarget) * Number(gla) * 0.12 || 1)
        });
    }

    res.json({
        dealRiskScore: Math.round(riskScore),
        esgComplianceScore: Math.round(esgScore),
        marketPositionScore: 75,
        carbonData: {
            footprintTonnes: Math.round(carbonFootprint),
            intensityKgPerSqm: intensity.toFixed(1),
            crremTarget: 14.0,
            status: carbonStatus
        },
        dealRiskBreakdown: [
            { factor: "Refinancing Risk", finding: `Loan matures in ~${Math.round(monthsToMaturity)} mos`, severity: monthsToMaturity < 24 ? "High" : "Low", action: "Stress test rates" },
            { factor: "LTV Limit", finding: `${Math.round(ltv)}%`, severity: ltv > 70 ? "High" : "Low", action: "None" },
            { factor: "Occupancy", finding: `${occupancy}%`, severity: Number(occupancy) < 80.5 ? "High" : "Low", action: "Lease effort" },
            { factor: "ESG Penalty", finding: `Score ${Math.round(esgScore)}`, severity: esgScore < 60 ? "Medium" : "Low", action: "See Action Plan" }
        ],
        esgComplianceDetail: [
            { framework: "CSRD", status: refrigerantType === 'Unknown' ? "GAP" : "PASS" },
            { framework: "SFDR", status: "PARTIAL" },
            { framework: "BEE/PAT", status: kwh > 500000 ? "PASS" : "NOT TRACKED" }
        ],
        actionPlan: actionPlan.sort((a,b) => a.payback - b.payback),
        narrative: `This ${assetClass} presents a deal risk of ${Math.round(riskScore)}, driven by financial positioning and an ESG score of ${Math.round(esgScore)}. At ${intensity.toFixed(1)} kgCO2/sqm, the asset is ${carbonStatus} against CRREM pathways.`
    });
});

// POST /api/export-pdf
app.post('/api/export-pdf', async (req, res) => {
    try {
        const data = req.body;
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; color: #161b24; }
                        h1 { color: #0a0b0e; }
                        .score { font-size: 32px; font-weight: bold; background: #161b24; color: #fff; padding: 20px; border-radius: 8px; display: inline-block; margin-right: 15px; }
                        .section { margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f5f5f5; }
                    </style>
                </head>
                <body>
                    <h1>DealSense Executive Brief</h1>
                    <div class="section">
                        <h2>Scores</h2>
                        <div class="score">Deal Risk: ${data.dealRiskScore || 'N/A'}</div>
                        <div class="score">ESG Compliance: ${data.esgComplianceScore || 'N/A'}</div>
                    </div>
                    <div class="section">
                        <h2>Narrative</h2>
                        <p>${data.narrative || 'No narrative provided.'}</p>
                    </div>
                    <div class="section">
                        <h2>Risk Breakdown</h2>
                        <table>
                            <tr><th>Factor</th><th>Finding</th><th>Severity</th><th>Action</th></tr>
                            ${data.dealRiskBreakdown ? data.dealRiskBreakdown.map(r => `<tr><td>${r.factor}</td><td>${r.finding}</td><td>${r.severity}</td><td>${r.action}</td></tr>`).join('') : ''}
                        </table>
                    </div>
                </body>
            </html>
        `;

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(html);
        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=Deal_Brief.pdf',
            'Content-Length': pdfBuffer.length
        });
        
        res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
