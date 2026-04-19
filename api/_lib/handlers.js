// -----------------------------------------------------------------------------
// DealSense scoring engine and HTTP handlers (CommonJS).
// Used by both the Vercel serverless functions (api/*.js) and the thin local
// Express wrapper (backend/index.js) so there is exactly one copy of the logic.
// -----------------------------------------------------------------------------

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// --------------------------------------------------------------------
// Input sanitisation constants
// --------------------------------------------------------------------
const DEFAULTS = {
    country: 'IN',
    assetClass: 'Grade A Office',
    gla: 10000,
    yearBuilt: 2005,
    numBuildings: 1,
    envelope: 'Standard',
    officePct: 100,
    otherPct: 0,
    price: 1,
    loan: 0,
    rate: 5,
    occupancy: 85,
    rateType: 'Fixed',
    carbonPrice: 0,
    annualElectricity: 0,
    annualGas: 0,
    waterConsumption: null,
    wasteRecycled: null,
    scope1: null,
    scope2: null,
    scope3: null,
    energyRating: 'None/Unknown',
    refrigerantType: 'Unknown',
    hvacUnits: 0,
    maturity: null,
    isEuListed: false,
    isFundManager: false,
    isPubliclyListed: false,
};

const MAX = {
    gla: 10_000_000,
    yearBuilt: 2100,
    numBuildings: 10_000,
    officePct: 100,
    otherPct: 100,
    price: 1e12,
    loan: 1e12,
    rate: 100,
    occupancy: 100,
    carbonPrice: 10_000,
    annualElectricity: 1e9,
    annualGas: 1e9,
    waterConsumption: 1e9,
    wasteRecycled: 100,
    scope1: 1e7,
    scope2: 1e7,
    scope3: 1e7,
    hvacUnits: 5000,
};

function num(field, value, { allowNull = false } = {}) {
    if (value === undefined || value === null || value === '' || value === 'null') {
        return allowNull ? null : (DEFAULTS[field] ?? 0);
    }
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return allowNull ? null : (DEFAULTS[field] ?? 0);
    let out = parsed < 0 ? 0 : parsed;
    if (MAX[field] !== undefined && out > MAX[field]) out = MAX[field];
    return out;
}

function str(field, value, allowed) {
    if (value === undefined || value === null || value === '') return DEFAULTS[field];
    if (allowed && !allowed.includes(value)) return DEFAULTS[field];
    return value;
}

function bool(value) {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    return false;
}

// --------------------------------------------------------------------
// Reference data
// --------------------------------------------------------------------
const COUNTRY_DATA = {
    IN:    { name: 'India',          grid: 0.71,  rate: 6.50, tariff: 0.12, region: 'APAC',   eu: false },
    GB:    { name: 'United Kingdom', grid: 0.21,  rate: 5.25, tariff: 0.32, region: 'Europe', eu: false },
    US:    { name: 'United States',  grid: 0.37,  rate: 4.50, tariff: 0.16, region: 'NA',     eu: false },
    DE:    { name: 'Germany',        grid: 0.38,  rate: 3.75, tariff: 0.35, region: 'Europe', eu: true  },
    FR:    { name: 'France',         grid: 0.055, rate: 3.75, tariff: 0.25, region: 'Europe', eu: true  },
    AU:    { name: 'Australia',      grid: 0.63,  rate: 4.35, tariff: 0.28, region: 'APAC',   eu: false },
    SG:    { name: 'Singapore',      grid: 0.408, rate: 3.50, tariff: 0.24, region: 'APAC',   eu: false },
    AE:    { name: 'UAE',            grid: 0.46,  rate: 5.40, tariff: 0.11, region: 'MENA',   eu: false },
    OTHER: { name: 'Other',          grid: 0.48,  rate: 4.50, tariff: 0.18, region: 'Global', eu: false },
};

const GAS_INTENSITY = 0.202;

const GWP_MAPPING = {
    'R-22':   1810,
    'R-410A': 2088,
    'R-32':   675,
    'R-134a': 1430,
    'R-600a': 3,
    'Unknown': 2000,
};

const CRREM_2030_BY_CLASS = {
    'Grade A Office': 14.0,
    'Office':         14.0,
    'Retail':         22.0,
    'Industrial':     10.0,
};

const ENVELOPE_FACTOR = {
    'Poor':     1.25,
    'Standard': 1.00,
    'Good':     0.80,
};

const ENERGY_RATING_BONUS = {
    'LEED Platinum': 10, 'LEED Gold': 7, 'LEED Silver': 4, 'LEED Certified': 2,
    'BREEAM Outstanding': 10, 'BREEAM Excellent': 7, 'BREEAM Very Good': 4, 'BREEAM Good': 2, 'BREEAM Pass': 1,
    'NABERS 6 Star': 10, 'NABERS 5 Star': 7, 'NABERS 4 Star': 4, 'NABERS 3 Star': 2, 'NABERS 2 Star': 1, 'NABERS 1 Star': 0,
    'BEE 5 Star': 8, 'BEE 4 Star': 5, 'BEE 3 Star': 3, 'BEE 2 Star': 1, 'BEE 1 Star': 0,
    'EPC A': 10, 'EPC B': 7, 'EPC C': 4, 'EPC D': 2, 'EPC E': 0, 'EPC F': -3, 'EPC G': -5,
    'None/Unknown': 0,
};

// --------------------------------------------------------------------
// Rules engine — regulatory applicability
// --------------------------------------------------------------------
function computeApplicability({ country, isEuListed, isFundManager, isPubliclyListed, annualElectricity }) {
    const countryInfo = COUNTRY_DATA[country] || COUNTRY_DATA.OTHER;
    return {
        CSRD: countryInfo.eu || !!isEuListed,
        SFDR: !!isFundManager,
        'IFRS S2': !!isPubliclyListed,
        'GHG Scope 1': true,
        'GHG Scope 2': true,
        'Refrigerant Tracking': countryInfo.eu || !!isEuListed,
        'BEE/PAT': country === 'IN' && annualElectricity > 500_000,
    };
}

// --------------------------------------------------------------------
// GET /api/market-data
// --------------------------------------------------------------------
async function marketData(req, res) {
    await delay(300);
    const country = str('country', (req.query && req.query.country) || 'IN', Object.keys(COUNTRY_DATA));
    const info = COUNTRY_DATA[country];
    res.json({
        country,
        countryName: info.name,
        submarketVacancy: 14.5,
        recentSalePricePerSqm: 2400,
        benchmarkInterestRate: info.rate,
        gridCarbonIntensity: info.grid,
        localElectricityTariff: info.tariff,
    });
}

// --------------------------------------------------------------------
// POST /api/analyse
// --------------------------------------------------------------------
async function analyse(req, res) {
    await delay(300);
    const body = req.body || {};

    const country     = str('country', body.country, Object.keys(COUNTRY_DATA));
    const countryInfo = COUNTRY_DATA[country];
    const gridIntensity = countryInfo.grid;
    const benchmarkRate = countryInfo.rate;
    const assetClass  = str('assetClass', body.assetClass, Object.keys(CRREM_2030_BY_CLASS));
    const gla         = Math.max(1, num('gla', body.gla));
    const yearBuilt   = num('yearBuilt', body.yearBuilt);
    const numBuildings = Math.max(1, Math.round(num('numBuildings', body.numBuildings)));
    const envelope    = str('envelope', body.envelope, Object.keys(ENVELOPE_FACTOR));
    const officePct   = num('officePct', body.officePct);
    const otherPct    = num('otherPct', body.otherPct);

    const price      = Math.max(1, num('price', body.price));
    const loan       = num('loan', body.loan);
    const rate       = num('rate', body.rate);
    const maturity   = body.maturity || null;
    const occupancy  = num('occupancy', body.occupancy);
    const rateType   = str('rateType', body.rateType, ['Fixed', 'Floating']);
    const carbonPrice = num('carbonPrice', body.carbonPrice);

    const annualElectricity = num('annualElectricity', body.annualElectricity);
    const annualGas         = num('annualGas', body.annualGas);
    const waterConsumption  = num('waterConsumption', body.waterConsumption, { allowNull: true });
    const wasteRecycled     = num('wasteRecycled', body.wasteRecycled, { allowNull: true });
    const scope1In          = num('scope1', body.scope1, { allowNull: true });
    const scope2In          = num('scope2', body.scope2, { allowNull: true });
    const scope3In          = num('scope3', body.scope3, { allowNull: true });
    const energyRating      = str('energyRating', body.energyRating, Object.keys(ENERGY_RATING_BONUS));

    const isEuListed        = bool(body.isEuListed);
    const isFundManager     = bool(body.isFundManager);
    const isPubliclyListed  = bool(body.isPubliclyListed);

    let hvacList = Array.isArray(body.hvacList) ? body.hvacList : null;
    if (!hvacList) {
        const legacyCount = Math.round(num('hvacUnits', body.hvacUnits));
        const legacyType  = str('refrigerantType', body.refrigerantType, Object.keys(GWP_MAPPING));
        hvacList = Array.from({ length: legacyCount }, (_, i) => ({
            label: `Unit ${i + 1}`,
            refrigerant: legacyType,
            age: 10,
            capacityKw: 80,
        }));
    }
    hvacList = hvacList.slice(0, MAX.hvacUnits).map((u, i) => ({
        label: u.label || `Unit ${i + 1}`,
        refrigerant: str('refrigerantType', u.refrigerant || u.refrigerantType, Object.keys(GWP_MAPPING)),
        age: num('yearBuilt', u.age ?? 10),
        capacityKw: u.capacityKw !== undefined && u.capacityKw !== '' ? num('rate', u.capacityKw) : null,
    }));
    const hvacCount = hvacList.length;

    const applicability = computeApplicability({
        country, isEuListed, isFundManager, isPubliclyListed, annualElectricity,
    });

    // Carbon footprint — Scope 1/2/3
    const scope2Auto = (annualElectricity * gridIntensity) / 1000;
    const scope2 = scope2In != null ? scope2In : scope2Auto;

    const gasEmissions = (annualGas * GAS_INTENSITY) / 1000;
    const refrigerantEmissions = hvacList.reduce((acc, u) => {
        const gwp = GWP_MAPPING[u.refrigerant] ?? GWP_MAPPING.Unknown;
        return acc + (2 * gwp) / 1000;
    }, 0);
    const scope1Auto = gasEmissions + refrigerantEmissions;
    const scope1 = scope1In != null ? scope1In : scope1Auto;

    const scope3 = scope3In != null ? scope3In : 0;

    const carbonFootprint = scope1 + scope2 + scope3;
    const intensity = (carbonFootprint * 1000) / gla;

    const baseTarget = CRREM_2030_BY_CLASS[assetClass] || 14.0;
    const mixOfficeTarget = CRREM_2030_BY_CLASS['Grade A Office'];
    const mixOtherTarget  = CRREM_2030_BY_CLASS['Retail'];
    const weightedTarget = ((officePct / 100) * mixOfficeTarget) + ((otherPct / 100) * mixOtherTarget);
    const crremTarget = (officePct + otherPct >= 99 ? weightedTarget : baseTarget);
    const effectiveBenchmark = crremTarget * (ENVELOPE_FACTOR[envelope] ?? 1.0);

    let carbonStatus = 'green';
    let pctAbove = 0;
    if (intensity > effectiveBenchmark) {
        pctAbove = (intensity - effectiveBenchmark) / effectiveBenchmark;
        carbonStatus = pctAbove > 0.4 ? 'red' : 'amber';
    }

    // ESG Compliance Score
    let esgScore = 0;
    if (annualElectricity > 0 && annualGas > 0) esgScore += 20;
    else if (annualElectricity > 0) esgScore += 12;

    if (carbonStatus === 'green') esgScore += 25;
    else if (carbonStatus === 'amber') esgScore += 15;
    else esgScore += 5;

    const anyUnknown = hvacList.some(u => u.refrigerant === 'Unknown');
    if (hvacCount === 0) esgScore += 15;
    else if (!anyUnknown) esgScore += 15;
    else if (applicability.CSRD) esgScore += 3;
    else esgScore += 10;

    let frameworkPoints = 25;
    if (applicability.CSRD && anyUnknown) frameworkPoints -= 8;
    esgScore += frameworkPoints;

    let waterScore = 0;
    let waterAssessed = false;
    if (waterConsumption != null) {
        waterAssessed = true;
        const waterIntensity = waterConsumption / gla;
        if (waterIntensity < 0.5) waterScore = 7;
        else if (waterIntensity <= 1.5) waterScore = 4;
        else waterScore = 1;
    }
    esgScore += waterScore;

    let wasteScore = 0;
    let wasteAssessed = false;
    if (wasteRecycled != null) {
        wasteAssessed = true;
        if (wasteRecycled >= 75) wasteScore = 8;
        else if (wasteRecycled >= 50) wasteScore = 5;
        else if (wasteRecycled >= 25) wasteScore = 2;
        else wasteScore = 0;
    }
    esgScore += wasteScore;

    esgScore += (ENERGY_RATING_BONUS[energyRating] ?? 0);
    esgScore = Math.min(100, Math.max(0, Math.round(esgScore)));

    // Deal Risk Score
    let riskScore = 0;
    const refinancingBreakdown = {};
    let monthsToMaturity = 999;
    if (maturity) {
        const d = new Date(maturity);
        if (!Number.isNaN(d.getTime())) {
            monthsToMaturity = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
        }
    }

    if (rateType === 'Floating') {
        riskScore += 15;
        refinancingBreakdown.severity = 'Medium';
        refinancingBreakdown.finding = 'Floating rate — exposed to benchmark movements';
        refinancingBreakdown.action = `Hedge against ${countryInfo.name} benchmark (${benchmarkRate}%)`;
    } else {
        if (monthsToMaturity < 24 && rate < benchmarkRate - 1.0) {
            riskScore += 30;
            refinancingBreakdown.severity = 'High';
        } else if (monthsToMaturity < 36 && rate < benchmarkRate - 0.5) {
            riskScore += 20;
            refinancingBreakdown.severity = 'High';
        } else {
            refinancingBreakdown.severity = 'Low';
        }
        refinancingBreakdown.finding = `Loan matures in ~${Math.max(0, Math.round(monthsToMaturity))} mos at ${rate}% (benchmark ${benchmarkRate}%)`;
        refinancingBreakdown.action = monthsToMaturity < 36 ? `Stress-test at ${(benchmarkRate + 0.5).toFixed(1)}%` : 'Monitor';
    }

    const ltv = (loan / price) * 100;
    if (ltv > 70) riskScore += 10;
    if (occupancy < 80.5) riskScore += 10;

    if (esgScore < 40) riskScore += 25;
    else if (esgScore <= 60) riskScore += 15;
    else riskScore += 5;

    if (anyUnknown && applicability.CSRD) riskScore += 10;
    riskScore += 8;
    riskScore = Math.min(100, Math.round(riskScore));

    // Action Plan
    const actionPlan = [];

    const problemUnits = hvacList.filter(u => u.refrigerant === 'Unknown' || u.refrigerant === 'R-22');
    if (problemUnits.length > 0) {
        const unitCo2 = problemUnits.reduce((acc, u) => {
            const gwp = GWP_MAPPING[u.refrigerant] ?? GWP_MAPPING.Unknown;
            return acc + (2 * gwp) / 1000;
        }, 0);
        const base$ = 5000 + problemUnits.length * 1500;
        const cost = problemUnits.length * 6500;
        actionPlan.push({
            title: 'Refrigerant Tracking & Retrofit',
            description: `Replace ${problemUnits.length} legacy/unknown unit(s). ${applicability.CSRD ? 'Closes CSRD leakage gap.' : 'Improves operating reliability and ESG score.'}`,
            co2Saving: +unitCo2.toFixed(1),
            dollarSaving: Math.round(base$),
            cost,
            payback: +(cost / Math.max(1, base$)).toFixed(2),
        });
    }

    if (intensity > effectiveBenchmark) {
        const co2Saving = ((intensity - effectiveBenchmark) * gla) / 1000;
        const dollarSaving = (intensity - effectiveBenchmark) * gla * countryInfo.tariff;
        const cost = gla * 1.5;
        actionPlan.push({
            title: 'Energy Audit & Retrofit',
            description: `Upgrade HVAC and LED lighting to hit CRREM 2030 target (${effectiveBenchmark.toFixed(1)} kgCO₂/sqm/yr).`,
            co2Saving: +co2Saving.toFixed(1),
            dollarSaving: Math.round(dollarSaving),
            cost: Math.round(cost),
            payback: +(cost / Math.max(1, dollarSaving)).toFixed(2),
        });
    }

    if (wasteAssessed && wasteRecycled < 50) {
        actionPlan.push({
            title: 'Waste Diversion Programme',
            description: 'Contract with recycling partner; target >75% diversion from landfill.',
            co2Saving: 8,
            dollarSaving: 6000,
            cost: 9000,
            payback: 1.5,
        });
    }

    if (carbonPrice > 0) {
        actionPlan.forEach(a => {
            const cpContribution = Math.round(carbonPrice * a.co2Saving);
            a.carbonPriceContribution = cpContribution;
            a.dollarSaving = a.dollarSaving + cpContribution;
            a.payback = +(a.cost / Math.max(1, a.dollarSaving)).toFixed(2);
        });
    }

    actionPlan.sort((a, b) => a.payback - b.payback);

    // ESG Compliance Detail
    const esgComplianceDetail = [];
    if (applicability.CSRD) {
        esgComplianceDetail.push({
            framework: 'CSRD',
            status: anyUnknown ? 'GAP' : 'PASS',
            note: anyUnknown ? 'Refrigerant leakage tracking missing' : 'Meeting disclosure standards',
        });
    }
    if (applicability.SFDR) {
        esgComplianceDetail.push({
            framework: 'SFDR',
            status: esgScore >= 70 ? 'PASS' : 'PARTIAL',
            note: 'Article 8 / 9 disclosures',
        });
    }
    if (applicability['IFRS S2']) {
        esgComplianceDetail.push({
            framework: 'IFRS S2',
            status: scope2 > 0 ? 'PASS' : 'PARTIAL',
            note: 'Climate-related financial disclosures',
        });
    }
    esgComplianceDetail.push({
        framework: 'GHG Scope 1',
        status: scope1 > 0 ? 'PASS' : 'NOT TRACKED',
        note: scope1In != null ? 'Manually reported' : 'Auto-calculated',
    });
    esgComplianceDetail.push({
        framework: 'GHG Scope 2',
        status: scope2 > 0 ? 'PASS' : 'NOT TRACKED',
        note: scope2In != null ? 'Manually reported' : 'Auto-calculated',
    });
    esgComplianceDetail.push({
        framework: 'GHG Scope 3',
        status: scope3In != null ? 'PASS' : 'PARTIAL',
        note: scope3In != null ? 'Reported' : 'Not mandatory — optional input',
    });
    if (applicability['Refrigerant Tracking']) {
        esgComplianceDetail.push({
            framework: 'Refrigerant Tracking',
            status: anyUnknown ? 'GAP' : 'PASS',
            note: 'Required under CSRD Annex',
        });
    } else if (hvacCount > 0) {
        esgComplianceDetail.push({
            framework: 'Refrigerant Tracking',
            status: 'N/A',
            note: 'Not required in this jurisdiction',
        });
    }
    if (applicability['BEE/PAT']) {
        esgComplianceDetail.push({
            framework: 'BEE/PAT',
            status: annualElectricity > 0 ? 'PASS' : 'NOT TRACKED',
            note: 'Indian Bureau of Energy Efficiency',
        });
    }

    esgComplianceDetail.push({
        framework: 'Water',
        status: waterAssessed ? 'PASS' : 'NOT ASSESSED',
        note: waterAssessed ? `${waterScore}/7 pts` : 'Not penalised',
    });
    esgComplianceDetail.push({
        framework: 'Waste',
        status: wasteAssessed ? (wasteScore >= 5 ? 'PASS' : 'PARTIAL') : 'NOT ASSESSED',
        note: wasteAssessed ? `${wasteScore}/8 pts` : 'Not penalised',
    });

    // Risk breakdown
    const dealRiskBreakdown = [
        {
            factor: 'Refinancing Risk',
            finding: refinancingBreakdown.finding,
            severity: refinancingBreakdown.severity,
            action: refinancingBreakdown.action,
        },
        {
            factor: 'LTV Limit',
            finding: `${Math.round(ltv)}%`,
            severity: ltv > 70 ? 'High' : 'Low',
            action: ltv > 70 ? 'Re-gear or equity injection' : 'None',
        },
        {
            factor: 'Occupancy',
            finding: `${occupancy}%`,
            severity: occupancy < 80.5 ? 'High' : 'Low',
            action: occupancy < 80.5 ? 'Lease-up effort' : 'Monitor',
        },
        {
            factor: 'ESG Penalty',
            finding: `Score ${esgScore}`,
            severity: esgScore < 40 ? 'High' : esgScore <= 60 ? 'Medium' : 'Low',
            action: esgScore < 70 ? 'See Action Plan' : 'None',
        },
    ];

    const marketPositionScore = Math.max(
        40,
        Math.min(100, Math.round(75 + (occupancy - 85) * 0.8 - Math.max(0, ltv - 65) * 0.3))
    );

    const narrative =
        `This ${assetClass} in ${countryInfo.name} presents a deal risk of ${riskScore} and an ESG compliance score of ${esgScore}. ` +
        `At ${intensity.toFixed(1)} kgCO₂/sqm against a ${effectiveBenchmark.toFixed(1)} benchmark, the asset is ${carbonStatus}. ` +
        (rateType === 'Floating'
            ? `The floating-rate loan remains exposed to ${countryInfo.name} benchmark (${benchmarkRate}%). `
            : (monthsToMaturity < 36
                ? `Refinancing in ~${Math.round(monthsToMaturity)} months at ${rate}% vs ${benchmarkRate}% benchmark is the primary risk. `
                : ''
            )) +
        (applicability.CSRD && anyUnknown ? 'CSRD refrigerant disclosure is currently a gap.' : '');

    let portfolioAssets = null;
    if (numBuildings > 1) {
        portfolioAssets = Array.from({ length: Math.min(numBuildings, 20) }, (_, i) => {
            const jitter = (i * 7) % 23 - 11;
            return {
                name: `${body.address || countryInfo.name} #${i + 1}`,
                class: assetClass,
                country,
                gla: Math.round(gla / numBuildings),
                intensity: +(intensity + jitter * 0.4).toFixed(1),
                crrem: effectiveBenchmark,
                esg: Math.max(10, Math.min(95, esgScore + jitter)),
                dealRisk: Math.max(10, Math.min(95, riskScore - jitter)),
                compliance: esgScore + jitter >= 70 ? 'PASS' : (esgScore + jitter < 40 ? 'GAP' : 'PARTIAL'),
            };
        });
    }

    res.json({
        dealRiskScore: riskScore,
        esgComplianceScore: esgScore,
        marketPositionScore,
        carbonData: {
            footprintTonnes: Math.round(carbonFootprint),
            intensityKgPerSqm: +intensity.toFixed(1),
            crremTarget: +effectiveBenchmark.toFixed(1),
            baseCrrem: +crremTarget.toFixed(1),
            envelopeFactor: ENVELOPE_FACTOR[envelope],
            status: carbonStatus,
            scope1: +scope1.toFixed(1),
            scope2: +scope2.toFixed(1),
            scope3: +scope3.toFixed(1),
        },
        dealRiskBreakdown,
        esgComplianceDetail,
        applicability,
        context: {
            country,
            countryName: countryInfo.name,
            gridIntensity,
            benchmarkRate,
            tariff: countryInfo.tariff,
            assetClass,
            address: body.address || '',
            yearBuilt,
            numBuildings,
            envelope,
            rateType,
            carbonPrice,
            hvacList,
            energyRating,
        },
        actionPlan,
        narrative,
        portfolioAssets,
    });
}

module.exports = {
    analyse,
    marketData,
    COUNTRY_DATA,
};
